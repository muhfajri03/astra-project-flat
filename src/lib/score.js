// Penilaian ucapan berbasis hasil pengenalan suara (speech-to-text).
// Catatan jujur: ini mengukur apakah kata Anda TERKENALI oleh mesin pengenal suara,
// bukan penilaian fonem seperti layanan khusus. Cukup untuk umpan balik latihan harian.

const HAN = /\p{Script=Han}/u;

export function normalize(str = "") {
  return str
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/'/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

export function similarity(a, b) {
  if (a === b) return 1;
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max;
}

export function tokenize(str, lang) {
  if (lang === "zh") {
    return [...str].filter((c) => HAN.test(c));
  }
  const n = normalize(str);
  return n ? n.split(" ") : [];
}

function tokensEqual(a, b, lang) {
  if (a === b) return true;
  if (lang === "zh") return false;
  // kata pendek harus persis; kata panjang boleh selisih sedikit
  if (a.length < 4 || b.length < 4) return false;
  return similarity(a, b) >= 0.8;
}

// LCS: tandai token target mana yang terdengar.
export function alignTokens(target, heard, lang) {
  const n = target.length;
  const m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = tokensEqual(target[i], heard[j], lang)
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const matched = new Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (tokensEqual(target[i], heard[j], lang)) {
      matched[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return matched;
}

const TONE_HINT = {
  1: "nada 1: tinggi dan datar, tahan stabil",
  2: "nada 2: naik seperti bertanya \"hah?\"",
  3: "nada 3: turun rendah lalu naik di akhir",
  4: "nada 4: jatuh tajam dari tinggi ke rendah",
};

export function tipFor(word, lang) {
  if (lang === "zh") {
    if (!word.tones) return "Ucapkan lebih jelas, lalu coba lagi dengan kecepatan Lambat.";
    const tones = word.tones;
    if (tones.length >= 2 && tones[0] === 3 && tones[1] === 3) {
      return `Dua nada 3 berurutan: suku kata pertama diucapkan sebagai nada 2 (naik). Pinyin: ${word.p}.`;
    }
    const main = tones.find((t) => t !== 5);
    if (main) return `Perhatikan ${TONE_HINT[main]}. Pinyin: ${word.p}.`;
    return `Ucapkan ringan dan pendek (nada netral). Pinyin: ${word.p}.`;
  }
  const w = normalize(word.t);
  if (/th/.test(w)) return "Bunyi \"th\": julurkan ujung lidah sedikit di antara gigi, lalu hembuskan udara.";
  if (/^r|[^aeiou]r/.test(w)) return "Bunyi \"r\": lengkungkan lidah ke belakang tanpa menyentuh langit-langit, bibir sedikit membulat.";
  if (/v/.test(w)) return "Bunyi \"v\": gigi atas menyentuh bibir bawah dan getarkan suara (bukan \"p\" atau \"f\").";
  if (/w/.test(w)) return "Bunyi \"w\": bulatkan bibir lalu lepaskan cepat ke vokal berikutnya.";
  if (/[bcdfgkpst]$/.test(w)) return "Ucapkan konsonan akhir dengan jelas; jangan dihilangkan di ujung kata.";
  return "Ucapkan perlahan, tekankan suku kata yang kuat, lalu coba lagi dengan kecepatan Lambat.";
}

// phrase: { lang, words:[{t,p?,tones?}] }
export function scoreAttempt(phrase, heardText) {
  const lang = phrase.lang;
  const owner = [];
  const targetTokens = [];
  phrase.words.forEach((w, wi) => {
    tokenize(w.t, lang).forEach((tok) => {
      targetTokens.push(tok);
      owner.push(wi);
    });
  });
  const heardTokens = tokenize(heardText || "", lang);
  const silent = heardTokens.length === 0;
  const matched = silent ? targetTokens.map(() => false) : alignTokens(targetTokens, heardTokens, lang);

  const wordOk = phrase.words.map(() => true);
  owner.forEach((wi, k) => {
    if (!matched[k]) wordOk[wi] = false;
  });

  const words = phrase.words.map((w, i) => ({
    text: w.t,
    pinyin: w.p,
    status: wordOk[i] ? "good" : "fix",
    tip: wordOk[i] ? null : tipFor(w, lang),
  }));

  const good = matched.filter(Boolean).length;
  const score = targetTokens.length ? Math.round((good / targetTokens.length) * 100) : 0;
  return { score, words, heard: heardText || "", silent };
}

export function verdict(score, silent) {
  if (silent) return "Suara belum terdengar";
  if (score >= 95) return "Sempurna";
  if (score >= 80) return "Hampir sempurna";
  if (score >= 55) return "Bagus, sedikit lagi";
  return "Ayo coba lagi";
}
