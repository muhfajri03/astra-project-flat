import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

export const LOCALE = { en: "en-US", zh: "zh-CN" };
const native = () => Capacitor.isNativePlatform();

// ---------- Suara (TTS) ----------
export async function speak(text, lang, slow = false) {
  const locale = LOCALE[lang] || "en-US";
  const rate = slow ? 0.6 : 1.0;
  if (native()) {
    try {
      await TextToSpeech.stop();
      await TextToSpeech.speak({ text, lang: locale, rate, pitch: 1.0, volume: 1.0, category: "playback" });
      return true;
    } catch {
      return false;
    }
  }
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang === locale) || voices.find((x) => x.lang.startsWith(locale.slice(0, 2)));
    if (v) u.voice = v;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    setTimeout(() => resolve(true), 15000); // jaga-jaga jika peramban tidak memicu onend
    window.speechSynthesis.speak(u);
  });
}

export async function stopSpeaking() {
  try {
    if (native()) await TextToSpeech.stop();
    else window.speechSynthesis?.cancel();
  } catch {
    /* diabaikan */
  }
}

// ---------- Pengenalan suara (STT) ----------
export async function recognitionSupported() {
  if (native()) {
    try {
      const { available } = await SpeechRecognition.available();
      return available;
    } catch {
      return false;
    }
  }
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export async function ensureMicPermission() {
  if (native()) {
    try {
      const cur = await SpeechRecognition.checkPermissions();
      if (cur.speechRecognition === "granted") return true;
      const req = await SpeechRecognition.requestPermissions();
      return req.speechRecognition === "granted";
    } catch {
      return false;
    }
  }
  return true;
}

// Sesi rekam satu kali. Pemakaian: const s = createRecognizer(lang); s.start(); ... const text = await s.stop();
// Setelah stop(), s.lastError berisi alasan kegagalan (mis. "timeout") bila ada.
export function createRecognizer(lang) {
  const locale = LOCALE[lang] || "en-US";

  if (native()) {
    let finished = Promise.resolve("");
    const api = {
      lastError: "",
      async start() {
        api.lastError = "";
        finished = SpeechRecognition.start({
          language: locale,
          maxResults: 3,
          partialResults: false,
          popup: false,
        })
          .then((r) => (r?.matches || []).join(" "))
          .catch((e) => {
            api.lastError = String(e?.message || e);
            console.warn("STT error:", api.lastError);
            return "";
          });
      },
      async stop() {
        try {
          await SpeechRecognition.stop();
        } catch {
          /* sudah berhenti */
        }
        const text = await Promise.race([
          finished,
          new Promise((resolve) =>
            setTimeout(() => {
              if (!api.lastError) api.lastError = "timeout";
              resolve("");
            }, 4000)
          ),
        ]);
        return text || "";
      },
    };
    return api;
  }

  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec;
  let transcript = "";
  let done;
  return {
    lastError: "",
    async start() {
      rec = new Rec();
      rec.lang = locale;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = true;
      transcript = "";
      done = new Promise((resolve) => {
        rec.onresult = (e) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) transcript += " " + e.results[i][0].transcript;
          }
        };
        rec.onerror = () => resolve();
        rec.onend = () => resolve();
      });
      rec.start();
    },
    async stop() {
      try {
        rec.stop();
      } catch {
        /* diabaikan */
      }
      await Promise.race([done, new Promise((r) => setTimeout(r, 2500))]);
      return transcript.trim();
    },
  };
}