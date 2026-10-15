import { useEffect, useRef, useState } from "react";
import { useApp } from "../app-context.js";
import { BackHeader, Button, Glass, ProgressRing, Segmented, Sheet, ToneCurve } from "../components/ui.jsx";
import { phraseById } from "../lib/content.js";
import { recordPronunciation } from "../lib/progress.js";
import { scoreAttempt, verdict } from "../lib/score.js";
import { createRecognizer, ensureMicPermission, recognitionSupported, speak, stopSpeaking } from "../lib/speech.js";
import { success, tap } from "../lib/haptics.js";

const GOOD = "text-slate-astra [text-shadow:0_0_14px_rgba(0,230,153,0.7)]";
const FIX = "text-slate-astra underline decoration-amber-astra decoration-[3px] underline-offset-[10px]";

export default function ListenEcho({ phrase, ids = [], i = 0 }) {
  const { state, act, back, replace } = useApp();
  const lang = phrase.lang;
  const slow = state.settings.slow;

  const [phase, setPhase] = useState("ready"); // ready | recording | processing | result
  const [result, setResult] = useState(null);
  const [active, setActive] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [focus, setFocus] = useState([]); // indeks kata yang perlu dilatih ulang
  const [toggled, setToggled] = useState(false);

  const rec = useRef(null);
  const startedAt = useRef(0);
  const toggleMode = useRef(false);
  const pointerDown = useRef(false);
  const phaseRef = useRef("ready");
  phaseRef.current = phase;

  useEffect(() => () => stopSpeaking(), []);

  const setSlow = (v) => act((s) => ({ ...s, settings: { ...s.settings, slow: v } }));

  const listen = async (text = phrase.text) => {
    setError(null);
    setPlaying(true);
    const ok = await speak(text, lang, slow);
    setPlaying(false);
    if (!ok) setError("Suara perangkat tidak tersedia. Periksa pengaturan text-to-speech di perangkat Anda.");
  };

  const begin = async () => {
    setError(null);
    await stopSpeaking();
    if (!(await recognitionSupported())) {
      setError("Pengenalan suara tidak tersedia di perangkat ini. Pasang atau aktifkan layanan suara Google, lalu coba lagi.");
      return;
    }
    if (!(await ensureMicPermission())) {
      setError("Izin mikrofon dibutuhkan untuk berlatih. Aktifkan di Pengaturan > Aplikasi > Astra > Izin.");
      return;
    }
    startedAt.current = Date.now();
    // jika jari sudah lepas (mis. karena dialog izin muncul), langsung masuk mode ketuk
    toggleMode.current = !pointerDown.current;
    setToggled(!pointerDown.current);
    setPhase("recording");
    rec.current = createRecognizer(lang);
    await rec.current.start();
  };

  const finish = async () => {
    if (phaseRef.current !== "recording") return;
    phaseRef.current = "processing"; // cegah finish() terpanggil dua kali
    setPhase("processing");

    let text = "";
    try {
      text = await rec.current.stop();
    } catch (e) {
      console.warn("stop() gagal:", e);
    }

    const why = rec.current?.lastError;
    if (!text && why === "timeout") {
      setError("Layanan suara tidak merespons. Pastikan HP online dan app Google (Speech Services) terpasang.");
    } else if (!text && why) {
      setError(`Pengenalan suara gagal: ${why}`);
    }

    const r = scoreAttempt(phrase, text);
    setResult(r);
    setFocus(r.words.map((w, idx) => (w.status === "fix" ? idx : -1)).filter((x) => x >= 0));
    setPhase("result");
    if (!r.silent) {
      act((s) => recordPronunciation(s, { phraseId: phrase.id, score: r.score }));
      if (r.score >= 80) success();
    }
  };

  const onDown = () => {
    pointerDown.current = true;
    if (phaseRef.current === "recording" && toggleMode.current) {
      finish();
      return;
    }
    if (phaseRef.current === "ready") begin();
  };
  const onUp = () => {
    pointerDown.current = false;
    if (phaseRef.current !== "recording") return;
    if (Date.now() - startedAt.current < 450) {
      // ketukan singkat: rekam terus sampai diketuk lagi
      toggleMode.current = true;
      setToggled(true);
    } else finish();
  };

  const retryFix = async () => {
    const words = result.words.filter((w) => w.status === "fix").map((w) => w.text);
    setPhase("ready");
    setActive(null);
    if (words.length) {
      setPlaying(true);
      await speak(lang === "zh" ? words.join("，") : words.join(", "), lang, true);
      setPlaying(false);
    }
  };

  const hasNext = ids.length > 0 && i + 1 < ids.length;
  const next = () => {
    if (hasNext) replace("listen", { phrase: phraseById(ids[i + 1]), ids, i: i + 1 });
    else back();
  };

  const showWords = phase === "result" && result ? result.words : phrase.words.map((w) => ({ text: w.t, pinyin: w.p, status: "idle" }));
  const score = result?.score ?? 0;
  const tipWord = active != null ? showWords[active] : null;

  return (
    <div className="flex min-h-screen flex-col">
      <BackHeader
        title={ids.length > 1 ? `Listen & Echo · ${i + 1}/${ids.length}` : "Listen & Echo"}
        onBack={back}
        right={null}
      />

      <div className="px-5">
        <div className="mb-4 flex justify-end">
          <Segmented
            value={slow}
            options={[
              { value: false, label: "Normal" },
              { value: true, label: "Lambat" },
            ]}
            onChange={setSlow}
          />
        </div>

        <Glass className="p-6">
          {phase === "result" && result && !result.silent && (
            <div className="screen mb-6 flex items-center gap-4">
              <ProgressRing value={score / 100} size={72} stroke={8} color={score >= 80 ? "#00E699" : "#F59E0B"}>
                <span className="text-xl font-extrabold text-slate-astra">{score}</span>
              </ProgressRing>
              <div>
                <p className="text-lg font-extrabold text-slate-astra">{verdict(score, false)}</p>
                <p className="text-xs text-slate-astra/50">
                  {result.words.filter((w) => w.status === "fix").length === 0
                    ? "Semua kata terdengar jelas"
                    : "Ketuk kata bergaris oranye untuk saran"}
                </p>
              </div>
            </div>
          )}
          {phase === "result" && result?.silent && (
            <p className="screen mb-5 rounded-2xl bg-amber-astra/10 p-3 text-sm text-amber-700">
              Suara belum terdengar. Dekatkan perangkat ke mulut, lalu tahan tombol mikrofon saat berbicara.
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-6">
            {showWords.map((w, idx) => {
              const tones = phrase.words[idx]?.tones;
              const pinyinParts = w.pinyin ? w.pinyin.split(" ") : [];
              const style = w.status === "good" ? GOOD : w.status === "fix" ? FIX : "text-slate-astra";
              const hint = phase !== "result" && focus.includes(idx) ? "decoration-dotted underline decoration-amber-astra/70 underline-offset-[10px] decoration-2" : "";
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (w.status === "fix") {
                      tap();
                      setActive(idx);
                    }
                  }}
                  className="press flex flex-col items-center gap-1"
                >
                  {lang === "zh" && tones && (
                    <span className="flex gap-1">
                      {tones.map((t, k) => (
                        <ToneCurve key={k} tone={t} w={30} h={16} strokeWidth={2} color={t === 5 ? "#94a3b8" : "#00E699"} />
                      ))}
                    </span>
                  )}
                  {lang === "zh" && pinyinParts.length > 0 && <span className="text-xs tracking-wide text-emerald-astra/75">{w.pinyin}</span>}
                  <span className={`${lang === "zh" ? "font-han text-4xl" : "text-3xl"} font-semibold transition-all duration-300 ${style} ${hint}`}>
                    {w.text}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-sm text-slate-astra/55">{phrase.translation}</p>
          {phase === "result" && result && !result.silent && (
            <p className="mt-3 text-center text-xs text-slate-astra/40">Terdengar: “{result.heard || "…"}”</p>
          )}
        </Glass>

        {error && <p className="mt-4 rounded-2xl bg-amber-astra/10 p-3 text-sm text-amber-700">{error}</p>}
      </div>

      <div className="mt-auto px-5 pt-8" style={{ paddingBottom: "calc(var(--sab) + 28px)" }}>
        {phase !== "result" ? (
          <div className="flex flex-col items-center gap-5">
            <Button variant="soft" onClick={() => listen()} disabled={phase === "recording" || phase === "processing"}>
              {playing ? "Memutar…" : "▶ Dengarkan"}
            </Button>
            <button
              aria-label="Tahan untuk merekam"
              disabled={phase === "processing"}
              onPointerDown={onDown}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onContextMenu={(e) => e.preventDefault()}
              className="no-select touch-none press relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-astra to-emerald-forest text-white shadow-glow disabled:opacity-50"
            >
              {phase === "recording" && (
                <>
                  <span className="absolute inset-0 rounded-full bg-mint/40" style={{ animation: "pulse-ring 1.2s ease-out infinite" }} />
                  <span className="absolute inset-0 rounded-full bg-mint/30" style={{ animation: "pulse-ring 1.2s .4s ease-out infinite" }} />
                </>
              )}
              <svg viewBox="0 0 24 24" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
            <p className="text-xs font-medium text-slate-astra/50">
              {phase === "recording" ? (toggled ? "Merekam… ketuk lagi untuk selesai" : "Mendengarkan… lepas jika selesai") : phase === "processing" ? "Menilai…" : "Tahan lalu ucapkan (atau ketuk sekali)"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button variant="soft" className="flex-1" onClick={() => { setPhase("ready"); setActive(null); }}>
                Coba lagi
              </Button>
              {focus.length > 0 && (
                <Button variant="soft" className="flex-1" onClick={retryFix}>
                  Ulangi yang meleset
                </Button>
              )}
            </div>
            <Button onClick={next}>{hasNext ? "Lanjut" : "Selesai"}</Button>
          </div>
        )}
      </div>

      <Sheet open={!!tipWord} onClose={() => setActive(null)}>
        {tipWord && (
          <>
            <p className={`${lang === "zh" ? "font-han" : ""} text-3xl font-bold text-slate-astra`}>{tipWord.text}</p>
            {tipWord.pinyin && <p className="text-sm text-emerald-astra">{tipWord.pinyin}</p>}
            <p className="mt-3 text-base leading-relaxed text-slate-astra/80">{tipWord.tip}</p>
            <div className="mt-5 flex gap-3">
              <Button variant="soft" className="flex-1" onClick={() => { setActive(null); listen(tipWord.text); }}>
                ▶ Contoh
              </Button>
              <Button className="flex-1" onClick={() => { setActive(null); setPhase("ready"); }}>
                Coba lagi
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}