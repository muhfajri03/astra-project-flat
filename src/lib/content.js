// Konten pembelajaran. Mandarin: tiap kata punya Hanzi (t), pinyin (p), dan nada per suku kata (tones).
// Nada 5 = netral.

const en = (id, text, id_text) => ({
  id,
  lang: "en",
  text,
  translation: id_text,
  words: text.split(" ").map((w) => ({ t: w })),
});

const zh = (id, translation, words) => ({
  id,
  lang: "zh",
  text: words.map((w) => w.t).join(""),
  translation,
  words,
});

export const MODULES = [
  {
    id: "en-daily",
    lang: "en",
    title: "Daily English",
    subtitle: "Percakapan sehari-hari",
    phrases: [
      en("ed1", "Could you say that again please", "Bisa tolong ulangi sekali lagi?"),
      en("ed2", "I'd like a cup of coffee please", "Saya mau secangkir kopi."),
      en("ed3", "Where is the nearest bus stop", "Di mana halte bus terdekat?"),
      en("ed4", "Nice to meet you I'm from Indonesia", "Senang bertemu denganmu, saya dari Indonesia."),
      en("ed5", "How much does this cost", "Berapa harga ini?"),
      en("ed6", "Could you speak a little slower", "Bisa bicara sedikit lebih pelan?"),
      en("ed7", "What time does the store open", "Jam berapa toko ini buka?"),
      en("ed8", "I'm learning English every day", "Saya belajar bahasa Inggris setiap hari."),
    ],
  },
  {
    id: "en-business",
    lang: "en",
    title: "Business English",
    subtitle: "Rapat, email, dan kerja",
    phrases: [
      en("eb1", "Let's schedule a meeting for next Tuesday", "Mari jadwalkan rapat untuk Selasa depan."),
      en("eb2", "I'll send you the report by the end of the day", "Saya kirim laporannya sebelum hari ini berakhir."),
      en("eb3", "Could we go over the budget together", "Bisa kita tinjau anggarannya bersama?"),
      en("eb4", "Thank you for your time and consideration", "Terima kasih atas waktu dan pertimbangan Anda."),
      en("eb5", "I'm responsible for managing the project timeline", "Saya bertanggung jawab mengatur jadwal proyek."),
      en("eb6", "Let me follow up with you by email", "Biar saya tindak lanjuti lewat email."),
    ],
  },
  {
    id: "en-ielts",
    lang: "en",
    title: "IELTS / TOEFL Speaking",
    subtitle: "Pola jawaban ujian",
    phrases: [
      en("ei1", "In my opinion technology has changed the way we learn", "Menurut saya, teknologi telah mengubah cara kita belajar."),
      en("ei2", "One of the main reasons is that it saves a lot of time", "Salah satu alasan utamanya adalah menghemat banyak waktu."),
      en("ei3", "On the other hand there are some disadvantages", "Di sisi lain, ada beberapa kekurangan."),
      en("ei4", "Let me describe a place I enjoy visiting", "Izinkan saya mendeskripsikan tempat yang saya suka kunjungi."),
      en("ei5", "For example many students now study online", "Misalnya, banyak siswa kini belajar daring."),
      en("ei6", "To sum up I strongly believe that education matters", "Singkatnya, saya yakin pendidikan itu penting."),
    ],
  },
  {
    id: "zh-hsk1",
    lang: "zh",
    title: "HSK 1 Dasar",
    subtitle: "Kalimat pertama Mandarin",
    phrases: [
      zh("z1", "Halo, senang berkenalan denganmu.", [
        { t: "你好", p: "nǐ hǎo", tones: [3, 3] },
        { t: "很", p: "hěn", tones: [3] },
        { t: "高兴", p: "gāo xìng", tones: [1, 4] },
        { t: "认识", p: "rèn shi", tones: [4, 5] },
        { t: "你", p: "nǐ", tones: [3] },
      ]),
      zh("z2", "Terima kasih atas bantuanmu.", [
        { t: "谢谢", p: "xiè xie", tones: [4, 5] },
        { t: "你", p: "nǐ", tones: [3] },
        { t: "的", p: "de", tones: [5] },
        { t: "帮助", p: "bāng zhù", tones: [1, 4] },
      ]),
      zh("z3", "Saya ingin pesan secangkir kopi.", [
        { t: "我", p: "wǒ", tones: [3] },
        { t: "想", p: "xiǎng", tones: [3] },
        { t: "点", p: "diǎn", tones: [3] },
        { t: "一杯", p: "yì bēi", tones: [4, 1] },
        { t: "咖啡", p: "kā fēi", tones: [1, 1] },
      ]),
      zh("z4", "Permisi, di mana toilet?", [
        { t: "请问", p: "qǐng wèn", tones: [3, 4] },
        { t: "洗手间", p: "xǐ shǒu jiān", tones: [3, 3, 1] },
        { t: "在", p: "zài", tones: [4] },
        { t: "哪里", p: "nǎ li", tones: [3, 5] },
      ]),
      zh("z5", "Cuaca hari ini bagus.", [
        { t: "今天", p: "jīn tiān", tones: [1, 1] },
        { t: "天气", p: "tiān qì", tones: [1, 4] },
        { t: "很", p: "hěn", tones: [3] },
        { t: "好", p: "hǎo", tones: [3] },
      ]),
      zh("z6", "Saya orang Indonesia.", [
        { t: "我", p: "wǒ", tones: [3] },
        { t: "是", p: "shì", tones: [4] },
        { t: "印度尼西亚", p: "yìn dù ní xī yà", tones: [4, 4, 2, 1, 4] },
        { t: "人", p: "rén", tones: [2] },
      ]),
      zh("z7", "Berapa harga ini?", [
        { t: "这个", p: "zhè ge", tones: [4, 5] },
        { t: "多少", p: "duō shao", tones: [1, 5] },
        { t: "钱", p: "qián", tones: [2] },
      ]),
      zh("z8", "Saya sedang belajar bahasa Mandarin.", [
        { t: "我", p: "wǒ", tones: [3] },
        { t: "在", p: "zài", tones: [4] },
        { t: "学习", p: "xué xí", tones: [2, 2] },
        { t: "中文", p: "zhōng wén", tones: [1, 2] },
      ]),
      zh("z9", "Sampai jumpa besok!", [
        { t: "明天", p: "míng tiān", tones: [2, 1] },
        { t: "见", p: "jiàn", tones: [4] },
      ]),
      zh("z10", "Tolong ulangi sekali lagi, ya?", [
        { t: "再", p: "zài", tones: [4] },
        { t: "说", p: "shuō", tones: [1] },
        { t: "一遍", p: "yí biàn", tones: [2, 4] },
        { t: "好吗", p: "hǎo ma", tones: [3, 5] },
      ]),
    ],
  },
  {
    id: "zh-conv",
    lang: "zh",
    title: "Percakapan Mandarin",
    subtitle: "Kafe, jalan, belanja",
    phrases: [
      zh("zc1", "Saya mau satu latte panas, gulanya sedikit.", [
        { t: "我", p: "wǒ", tones: [3] },
        { t: "要", p: "yào", tones: [4] },
        { t: "一杯", p: "yì bēi", tones: [4, 1] },
        { t: "热", p: "rè", tones: [4] },
        { t: "拿铁", p: "ná tiě", tones: [2, 3] },
        { t: "少糖", p: "shǎo táng", tones: [3, 2] },
      ]),
      zh("zc2", "Bisa bayar pakai kartu?", [
        { t: "可以", p: "kě yǐ", tones: [3, 3] },
        { t: "刷卡", p: "shuā kǎ", tones: [1, 3] },
        { t: "吗", p: "ma", tones: [5] },
      ]),
      zh("zc3", "Permisi, bagaimana ke stasiun metro?", [
        { t: "请问", p: "qǐng wèn", tones: [3, 4] },
        { t: "地铁站", p: "dì tiě zhàn", tones: [4, 3, 4] },
        { t: "怎么走", p: "zěn me zǒu", tones: [3, 5, 3] },
      ]),
      zh("zc4", "Saya ingin memesan sebuah kamar.", [
        { t: "我", p: "wǒ", tones: [3] },
        { t: "想", p: "xiǎng", tones: [3] },
        { t: "订", p: "dìng", tones: [4] },
        { t: "一个", p: "yí ge", tones: [2, 5] },
        { t: "房间", p: "fáng jiān", tones: [2, 1] },
      ]),
      zh("zc5", "Bisa lebih murah sedikit?", [
        { t: "能", p: "néng", tones: [2] },
        { t: "便宜", p: "pián yi", tones: [2, 5] },
        { t: "一点", p: "yì diǎn", tones: [4, 3] },
        { t: "吗", p: "ma", tones: [5] },
      ]),
    ],
  },
];

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));

export const ALL_PHRASES = MODULES.flatMap((m) => m.phrases.map((p) => ({ ...p, moduleId: m.id })));

export function phraseById(id) {
  return ALL_PHRASES.find((p) => p.id === id);
}

// Kalimat harian: bergilir berdasarkan hari, per bahasa.
export function dailyPhrase(lang, date = new Date()) {
  const pool = ALL_PHRASES.filter((p) => p.lang === lang);
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  );
  return pool[day % pool.length];
}

// Pasangan nada untuk Tone Master: suku kata yang sama dengan empat nada.
export const TONE_SETS = [
  { base: "ma", syllables: ["mā", "má", "mǎ", "mà"], chars: ["妈", "麻", "马", "骂"], gloss: ["ibu", "rami", "kuda", "memarahi"] },
  { base: "shu", syllables: ["shū", "shú", "shǔ", "shù"], chars: ["书", "熟", "鼠", "树"], gloss: ["buku", "matang", "tikus", "pohon"] },
  { base: "yi", syllables: ["yī", "yí", "yǐ", "yì"], chars: ["衣", "姨", "椅", "意"], gloss: ["baju", "tante", "kursi", "makna"] },
  { base: "tang", syllables: ["tāng", "táng", "tǎng", "tàng"], chars: ["汤", "糖", "躺", "烫"], gloss: ["sup", "gula", "berbaring", "panas"] },
  { base: "wen", syllables: ["wēn", "wén", "wěn", "wèn"], chars: ["温", "文", "稳", "问"], gloss: ["hangat", "bahasa", "stabil", "bertanya"] },
];
