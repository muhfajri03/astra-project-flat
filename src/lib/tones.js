// Kurva nada Mandarin: nilai 0..1 (rendah..tinggi) untuk visualisasi dan klasifikasi.

export function toneCurve(tone, n = 24) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    let y;
    switch (tone) {
      case 1:
        y = 0.85;
        break;
      case 2:
        y = 0.35 + 0.55 * x;
        break;
      case 3:
        // turun ke dasar di sekitar 40%, lalu naik
        y = x < 0.4 ? 0.45 - 0.35 * (x / 0.4) : 0.1 + 0.6 * ((x - 0.4) / 0.6);
        break;
      case 4:
        y = 0.95 - 0.85 * x;
        break;
      default:
        y = 0.35 - 0.1 * x; // nada netral: pendek dan ringan
    }
    pts.push(y);
  }
  return pts;
}

export function resample(values, n = 16) {
  if (values.length === 0) return [];
  if (values.length === 1) return new Array(n).fill(values[0]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const pos = (i / (n - 1)) * (values.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(values.length - 1, lo + 1);
    out.push(values[lo] + (values[hi] - values[lo]) * (pos - lo));
  }
  return out;
}

function pearson(a, b) {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

// contour: nilai semitone (apa saja skalanya). Mengembalikan { tone: 1..4, confidence: 0..1 }.
export function classifyTone(contour) {
  const clean = contour.filter((v) => Number.isFinite(v));
  if (clean.length < 4) return { tone: null, confidence: 0 };
  const pts = resample(clean, 16);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  // hampir datar (< 1,5 semitone) => nada 1
  if (max - min < 1.5) return { tone: 1, confidence: 0.8 };

  const norm = pts.map((v) => (v - min) / (max - min));
  const scores = [2, 3, 4].map((t) => ({ tone: t, r: pearson(norm, resample(toneCurve(t), 16)) }));
  // nada 1 juga bisa tampak "bergelombang" kecil; naik/turun sangat landai dianggap datar
  const delta = Math.abs(pts[pts.length - 1] - pts[0]);
  if (max - min < 2.5 && delta < 1.5) return { tone: 1, confidence: 0.6 };
  scores.sort((a, b) => b.r - a.r);
  return { tone: scores[0].tone, confidence: Math.max(0, Math.min(1, scores[0].r)) };
}
