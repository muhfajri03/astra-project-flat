import { describe, it, expect } from "vitest";
import { scoreAttempt, tokenize, verdict } from "./score.js";
import { classifyTone, toneCurve } from "./tones.js";
import { detectPitch, contourFromHz } from "./pitch.js";
import {
  initialState,
  applyActivity,
  displayStreak,
  recordPronunciation,
  recordTone,
  journeyPosition,
  toneAccuracy,
} from "./progress.js";
import { MODULES, dailyPhrase } from "./content.js";

const en = (text) => ({ lang: "en", words: text.split(" ").map((t) => ({ t })) });

describe("skor ucapan Inggris", () => {
  it("semua kata benar = 100", () => {
    const r = scoreAttempt(en("I'd like a cup of coffee"), "I'd like a cup of coffee");
    expect(r.score).toBe(100);
    expect(r.words.every((w) => w.status === "good")).toBe(true);
  });

  it("menandai kata yang hilang atau salah", () => {
    const r = scoreAttempt(en("where is the nearest bus stop"), "where is the nearest boss stop");
    expect(r.words.find((w) => w.text === "bus").status).toBe("fix");
    expect(r.words.find((w) => w.text === "stop").status).toBe("good");
    expect(r.score).toBe(83);
  });

  it("kapitalisasi dan tanda baca diabaikan", () => {
    const r = scoreAttempt(en("how much does this cost"), "How much does this cost?");
    expect(r.score).toBe(100);
  });

  it("kata panjang boleh selisih satu huruf", () => {
    const r = scoreAttempt(en("schedule a meeting"), "shedule a meeting");
    expect(r.score).toBe(100);
    // selisih dua huruf pada kata 8 huruf (kemiripan 0,75) tetap dianggap salah
    expect(scoreAttempt(en("schedule a meeting"), "schedual a meeting").score).toBe(67);
  });

  it("tidak ada suara = skor 0 dan ditandai silent", () => {
    const r = scoreAttempt(en("hello there"), "");
    expect(r.score).toBe(0);
    expect(r.silent).toBe(true);
    expect(verdict(r.score, r.silent)).toBe("Suara belum terdengar");
  });

  it("kata fix punya saran", () => {
    const r = scoreAttempt(en("think"), "sink");
    expect(r.words[0].tip).toMatch(/th/i);
  });
});

describe("skor ucapan Mandarin", () => {
  const phrase = MODULES.find((m) => m.id === "zh-hsk1").phrases[2]; // 我想点一杯咖啡

  it("tokenisasi per karakter Han", () => {
    expect(tokenize("我想，点!", "zh")).toEqual(["我", "想", "点"]);
  });

  it("semua benar", () => {
    expect(scoreAttempt(phrase, "我想点一杯咖啡").score).toBe(100);
  });

  it("satu karakter salah menandai seluruh kata itu", () => {
    const r = scoreAttempt(phrase, "我想点一杯咖非");
    expect(r.words.find((w) => w.text === "咖啡").status).toBe("fix");
    expect(r.words.find((w) => w.text === "一杯").status).toBe("good");
    expect(r.words.find((w) => w.text === "咖啡").tip).toMatch(/nada 1/);
  });

  it("saran dua nada 3 berurutan", () => {
    const hello = MODULES.find((m) => m.id === "zh-hsk1").phrases[0];
    const r = scoreAttempt(hello, "你们很高兴认识你");
    expect(r.words[0].tip).toMatch(/nada 2/);
  });
});

describe("nada Mandarin", () => {
  const toSemis = (curve) => curve.map((v) => v * 9); // 0..1 -> ~9 semitone

  it("mengenali keempat template", () => {
    for (const t of [1, 2, 3, 4]) {
      expect(classifyTone(toSemis(toneCurve(t))).tone).toBe(t);
    }
  });

  it("toleran terhadap noise kecil", () => {
    const noisy = toneCurve(4, 40).map((v, i) => v * 9 + Math.sin(i) * 0.3);
    expect(classifyTone(noisy).tone).toBe(4);
    const noisy2 = toneCurve(2, 40).map((v, i) => v * 9 + Math.cos(i * 2) * 0.3);
    expect(classifyTone(noisy2).tone).toBe(2);
  });

  it("data terlalu sedikit = null", () => {
    expect(classifyTone([1, 2]).tone).toBeNull();
  });
});

describe("deteksi pitch", () => {
  const sr = 44100;
  const makeSine = (hz, n = 2048, harmonics = false) => {
    const b = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      b[i] = 0.4 * Math.sin((2 * Math.PI * hz * i) / sr);
      if (harmonics) b[i] += 0.2 * Math.sin((2 * Math.PI * 2 * hz * i) / sr) + 0.1 * Math.sin((2 * Math.PI * 3 * hz * i) / sr);
    }
    return b;
  };

  it("sinus 200 Hz", () => {
    const f = detectPitch(makeSine(200), sr);
    expect(Math.abs(f - 200)).toBeLessThan(3);
  });

  it("sinus dengan harmonik 150 Hz (tidak melompat oktaf)", () => {
    const f = detectPitch(makeSine(150, 2048, true), sr);
    expect(Math.abs(f - 150)).toBeLessThan(4);
  });

  it("hening = null", () => {
    expect(detectPitch(new Float32Array(2048), sr)).toBeNull();
  });

  it("kontur dari Hz menghasilkan semitone relatif median", () => {
    const c = contourFromHz([100, 100, 100, 200, 200, 200, 100]);
    expect(c.length).toBe(7);
    expect(Math.max(...c)).toBeGreaterThan(0);
  });
});

describe("progres dan streak", () => {
  const d = (s) => new Date(s + "T10:00:00");

  it("streak naik per hari berturut-turut dan reset jika bolong", () => {
    let s = initialState();
    s = applyActivity(s, { points: 5, seconds: 60, now: d("2026-10-10") });
    expect(s.streak).toBe(1);
    s = applyActivity(s, { points: 5, seconds: 60, now: d("2026-10-10") }); // hari sama
    expect(s.streak).toBe(1);
    s = applyActivity(s, { now: d("2026-10-11") });
    s = applyActivity(s, { now: d("2026-10-12") });
    expect(s.streak).toBe(3);
    s = applyActivity(s, { now: d("2026-10-15") }); // bolong
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(3);
  });

  it("streak yang ditampilkan 0 jika sudah lewat sehari penuh", () => {
    let s = applyActivity(initialState(), { now: d("2026-10-10") });
    expect(displayStreak(s, d("2026-10-11"))).toBe(1);
    expect(displayStreak(s, d("2026-10-12"))).toBe(0);
  });

  it("detik harian di-reset saat ganti hari", () => {
    let s = applyActivity(initialState(), { seconds: 120, now: d("2026-10-10") });
    expect(s.secondsToday).toBe(120);
    s = applyActivity(s, { seconds: 30, now: d("2026-10-11") });
    expect(s.secondsToday).toBe(30);
    expect(s.totalSeconds).toBe(150);
  });

  it("latihan ucapan memberi poin, mencatat skor terbaik, dan badge pertama", () => {
    let s = recordPronunciation(initialState(), { phraseId: "ed1", score: 70, now: d("2026-10-10") });
    expect(s.points).toBe(7);
    s = recordPronunciation(s, { phraseId: "ed1", score: 100, now: d("2026-10-10") });
    expect(s.learned.ed1).toBe(100);
    expect(s.badges).toContain("first");
    expect(s.badges).toContain("perfect");
  });

  it("tantangan harian memberi bonus sekali setelah 3 latihan", () => {
    const now = d("2026-10-10");
    let s = initialState();
    s = recordPronunciation(s, { phraseId: "a", score: 50, now });
    s = recordPronunciation(s, { phraseId: "b", score: 50, now });
    const before = s.points;
    expect(s.challengeJustDone).toBeUndefined();
    s = recordPronunciation(s, { phraseId: "c", score: 50, now });
    expect(s.challengeJustDone).toBe(true);
    expect(s.points).toBe(before + 5 + 15);
    const { challengeJustDone, ...base } = s;
    s = recordPronunciation(base, { phraseId: "d", score: 50, now });
    expect(s.challengeJustDone).toBeUndefined(); // tidak dobel
    expect(s.points).toBe(before + 5 + 15 + 5);
  });

  it("combo nada dan akurasi per nada", () => {
    let s = initialState();
    for (let i = 0; i < 10; i++) s = recordTone(s, { tone: 2, correct: true, now: d("2026-10-10") });
    expect(s.bestToneCombo).toBe(10);
    expect(s.badges).toContain("tone10");
    s = recordTone(s, { tone: 3, correct: false, now: d("2026-10-10") });
    expect(s.toneCombo).toBe(0);
    expect(toneAccuracy(s)[2]).toBe(100);
    expect(toneAccuracy(s)[3]).toBe(0);
    expect(toneAccuracy(s)[1]).toBeNull();
  });

  it("posisi roadmap", () => {
    expect(journeyPosition(0).pos).toBe(0);
    expect(journeyPosition(130).pos).toBe(2);
    expect(journeyPosition(99999).pos).toBe(11);
  });
});

describe("konten", () => {
  it("setiap kalimat Mandarin punya pinyin dan nada per kata, dan jumlah suku kata cocok", () => {
    for (const m of MODULES.filter((x) => x.lang === "zh")) {
      for (const p of m.phrases) {
        for (const w of p.words) {
          expect(w.p, `${p.id} ${w.t}`).toBeTruthy();
          expect(w.tones.length, `${p.id} ${w.t}`).toBe(w.p.split(" ").length);
          expect([...w.t].length, `${p.id} ${w.t}`).toBe(w.tones.length);
        }
      }
    }
  });

  it("id kalimat unik dan kalimat harian tersedia", () => {
    const ids = MODULES.flatMap((m) => m.phrases.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(dailyPhrase("en").lang).toBe("en");
    expect(dailyPhrase("zh").lang).toBe("zh");
  });
});
