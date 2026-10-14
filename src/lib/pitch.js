// Deteksi nada dasar (F0) dari mikrofon dengan autokorelasi ternormalisasi.

export function detectPitch(buf, sampleRate, opts = {}) {
  const { minHz = 70, maxHz = 420, rmsThreshold = 0.01, minCorr = 0.55 } = opts;
  const n = buf.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += buf[i] * buf[i];
  const rms = Math.sqrt(sum / n);
  if (rms < rmsThreshold) return null;

  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(Math.ceil(sampleRate / minHz), n - 2);
  const corr = new Float32Array(maxLag + 1);
  let bestLag = -1;
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let num = 0;
    let ea = 0;
    let eb = 0;
    for (let i = 0; i < n - lag; i++) {
      const a = buf[i];
      const b = buf[i + lag];
      num += a * b;
      ea += a * a;
      eb += b * b;
    }
    const c = ea && eb ? num / Math.sqrt(ea * eb) : 0;
    corr[lag] = c;
    if (c > best) {
      best = c;
      bestLag = lag;
    }
  }
  if (bestLag < 0 || best < minCorr) return null;

  // hindari lompatan oktaf: pilih puncak lokal paling awal yang cukup kuat
  for (let lag = minLag + 1; lag < bestLag; lag++) {
    if (corr[lag] > corr[lag - 1] && corr[lag] >= corr[lag + 1] && corr[lag] >= 0.9 * best) {
      bestLag = lag;
      break;
    }
  }

  // interpolasi parabola untuk presisi
  const y0 = corr[bestLag - 1] ?? corr[bestLag];
  const y1 = corr[bestLag];
  const y2 = corr[bestLag + 1] ?? corr[bestLag];
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
  return sampleRate / (bestLag + shift);
}

export function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Hz[] (boleh ada null) -> kontur semitone relatif median, dihaluskan.
export function contourFromHz(hzList) {
  const voiced = hzList.filter((h) => h && h > 0);
  if (voiced.length < 3) return [];
  const med = median(voiced);
  const st = voiced.map((h) => 12 * Math.log2(h / med));
  // median filter jendela 3 untuk membuang lonjakan
  return st.map((v, i) => {
    const w = [st[i - 1] ?? v, v, st[i + 1] ?? v];
    return median(w);
  });
}

// Pelacak mikrofon (hanya di peramban / WebView).
export class PitchTracker {
  constructor({ onFrame } = {}) {
    this.onFrame = onFrame;
    this.hz = [];
    this.timer = null;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.hz = [];
    this.timer = setInterval(() => {
      this.analyser.getFloatTimeDomainData(this.buf);
      const f = detectPitch(this.buf, this.ctx.sampleRate);
      this.hz.push(f);
      this.onFrame?.(f, this.hz);
    }, 25);
  }

  async stop() {
    clearInterval(this.timer);
    this.stream?.getTracks().forEach((t) => t.stop());
    try {
      await this.ctx?.close();
    } catch {
      /* diabaikan */
    }
    return contourFromHz(this.hz);
  }
}

// Sintesis nada murni mengikuti kurva (untuk Tone Master). curve: 0..1.
export function playToneCurve(curve, { baseHz = 160, rangeSemitones = 9, duration = 0.7 } = {}) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  const now = ctx.currentTime;
  curve.forEach((v, i) => {
    const t = now + (i / (curve.length - 1)) * duration;
    osc.frequency.linearRampToValueAtTime(baseHz * 2 ** ((v * rangeSemitones) / 12), t);
  });
  osc.frequency.setValueAtTime(baseHz * 2 ** ((curve[0] * rangeSemitones) / 12), now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
  gain.gain.setValueAtTime(0.25, now + duration - 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
  return new Promise((resolve) => {
    osc.onended = () => {
      ctx.close();
      resolve();
    };
  });
}
