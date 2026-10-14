// Logika progres murni (tanpa penyimpanan) supaya mudah diuji.

export const DAILY_GOAL_MIN = 5;

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function prevDayKey(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return dayKey(d);
}

export function initialState() {
  return {
    version: 1,
    points: 0,
    streak: 0,
    bestStreak: 0,
    lastDay: null,
    day: null,
    secondsToday: 0,
    totalSeconds: 0,
    sessions: 0,
    learned: {}, // phraseId -> skor terbaik
    toneStats: { 1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0] }, // [benar, total]
    toneCombo: 0,
    bestToneCombo: 0,
    history: [], // { day, score } skor ucapan terakhir (maks 60)
    badges: [],
    challengeDay: null,
    settings: { lang: "en", slow: false, name: "", reminder: true },
    onboarded: false,
  };
}

// Aktivitas apa pun menjaga streak. Mengembalikan state baru.
export function applyActivity(state, { points = 0, seconds = 0, now = new Date() } = {}) {
  const today = dayKey(now);
  let s = { ...state };
  if (s.day !== today) {
    s.day = today;
    s.secondsToday = 0;
  }
  if (s.lastDay !== today) {
    s.streak = s.lastDay === prevDayKey(now) ? s.streak + 1 : 1;
    s.lastDay = today;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
  }
  s.points += points;
  s.secondsToday += seconds;
  s.totalSeconds += seconds;
  return s;
}

// Streak yang ditampilkan: putus jika kemarin pun tidak latihan.
export function displayStreak(state, now = new Date()) {
  if (!state.lastDay) return 0;
  if (state.lastDay === dayKey(now) || state.lastDay === prevDayKey(now)) return state.streak;
  return 0;
}

export function minutesToday(state, now = new Date()) {
  return state.day === dayKey(now) ? Math.floor(state.secondsToday / 60) : 0;
}

export function goalProgress(state, now = new Date()) {
  const secs = state.day === dayKey(now) ? state.secondsToday : 0;
  return Math.min(1, secs / (DAILY_GOAL_MIN * 60));
}

export function recordPronunciation(state, { phraseId, score, now = new Date() }) {
  let s = applyActivity(state, {
    points: Math.round(score / 10) + (score >= 90 ? 5 : 0),
    seconds: 20,
    now,
  });
  const best = Math.max(s.learned[phraseId] ?? 0, score);
  s = {
    ...s,
    sessions: s.sessions + 1,
    learned: { ...s.learned, [phraseId]: best },
    history: [...s.history, { day: dayKey(now), score }].slice(-60),
  };
  // Tantangan harian: 3 latihan ucapan hari ini = bonus sekali per hari.
  const today = dayKey(now);
  if (s.challengeDay !== today && pronunciationsToday(s, now) >= CHALLENGE_TARGET) {
    s = { ...s, points: s.points + CHALLENGE_BONUS, challengeDay: today, challengeJustDone: true };
  }
  return withBadges(s);
}

export const CHALLENGE_TARGET = 3;
export const CHALLENGE_BONUS = 15;

export function pronunciationsToday(state, now = new Date()) {
  const today = dayKey(now);
  return state.history.filter((h) => h.day === today).length;
}

export function recordTone(state, { tone, correct, now = new Date() }) {
  const stats = { ...state.toneStats, [tone]: [...state.toneStats[tone]] };
  stats[tone][1] += 1;
  if (correct) stats[tone][0] += 1;
  const combo = correct ? state.toneCombo + 1 : 0;
  let s = applyActivity(state, { points: correct ? 3 + Math.min(combo, 5) : 0, seconds: 10, now });
  s = {
    ...s,
    toneStats: stats,
    toneCombo: combo,
    bestToneCombo: Math.max(state.bestToneCombo, combo),
  };
  return withBadges(s);
}

export function toneAccuracy(state) {
  const out = {};
  for (const t of [1, 2, 3, 4]) {
    const [ok, total] = state.toneStats[t];
    out[t] = total ? Math.round((ok / total) * 100) : null;
  }
  return out;
}

export function averageScore(state, last = 10) {
  const h = state.history.slice(-last);
  if (!h.length) return null;
  return Math.round(h.reduce((a, b) => a + b.score, 0) / h.length);
}

export const BADGES = [
  { id: "first", name: "Langkah Pertama", desc: "Selesaikan latihan pertama", test: (s) => s.sessions >= 1 || s.totalSeconds > 0 },
  { id: "streak3", name: "Tiga Hari Berturut", desc: "Streak 3 hari", test: (s) => s.bestStreak >= 3 },
  { id: "streak7", name: "Seminggu Penuh", desc: "Streak 7 hari", test: (s) => s.bestStreak >= 7 },
  { id: "streak30", name: "Sebulan Konsisten", desc: "Streak 30 hari", test: (s) => s.bestStreak >= 30 },
  { id: "words10", name: "Sepuluh Kalimat", desc: "Kuasai 10 kalimat (skor 80+)", test: (s) => Object.values(s.learned).filter((v) => v >= 80).length >= 10 },
  { id: "perfect", name: "Pelafal Jernih", desc: "Raih skor 100", test: (s) => Object.values(s.learned).some((v) => v >= 100) },
  { id: "tone10", name: "Telinga Tajam", desc: "10 nada benar beruntun", test: (s) => s.bestToneCombo >= 10 },
  { id: "tone20", name: "Master Nada", desc: "20 nada benar beruntun", test: (s) => s.bestToneCombo >= 20 },
  { id: "pts500", name: "Astra 500", desc: "Kumpulkan 500 Astra Points", test: (s) => s.points >= 500 },
];

export function withBadges(state) {
  const have = new Set(state.badges);
  const newly = BADGES.filter((b) => !have.has(b.id) && b.test(state)).map((b) => b.id);
  return newly.length ? { ...state, badges: [...state.badges, ...newly], newBadges: newly } : state;
}

// Roadmap perjalanan: 12 pos, tiap pos butuh 60 poin lebih banyak.
export const JOURNEY = Array.from({ length: 12 }, (_, i) => ({
  index: i,
  need: i * 60,
  title: [
    "Mulai", "Sapaan", "Kafe", "Arah", "Belanja", "Hotel",
    "Kerja", "Rapat", "Presentasi", "Ujian", "Debat", "Fasih",
  ][i],
}));

export function journeyPosition(points) {
  let pos = 0;
  JOURNEY.forEach((n, i) => {
    if (points >= n.need) pos = i;
  });
  const next = JOURNEY[pos + 1];
  const progress = next ? (points - JOURNEY[pos].need) / (next.need - JOURNEY[pos].need) : 1;
  return { pos, next, progress };
}
