import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../app-context.js";
import { BackHeader, Button, Glass, ToneCurve } from "../components/ui.jsx";
import { TONE_SETS } from "../lib/content.js";
import { recordTone, toneAccuracy } from "../lib/progress.js";
import { PitchTracker, contourFromHz, playToneCurve } from "../lib/pitch.js";
import { classifyTone, toneCurve } from "../lib/tones.js";
import { speak } from "../lib/speech.js";
import { success, tap } from "../lib/haptics.js";

const ROUNDS = 10;
const TIME_MS = 6000;
const rnd = (n) => Math.floor(Math.random() * n);
const newRound = () => ({ set: TONE_SETS[rnd(TONE_SETS.length)], tone: 1 + rnd(4) });
const TONE_NAME = { 1: "Nada 1 (datar tinggi)", 2: "Nada 2 (naik)", 3: "Nada 3 (turun-naik)", 4: "Nada 4 (jatuh)" };

function normContour(c) {
  if (c.length < 2) return [];
  const min = Math.min(...c);
  const max = Math.max(...c);
  if (max - min < 1.5) return c.map(() => 0.6);
  return c.map((v) => (v - min) / (max - min));
}

export default function ToneMaster() {
  const { state, back } = useApp();
  const [mode, setMode] = useState(null);
  const acc = toneAccuracy(state);

  if (mode === "listen") return <ListenGame onExit={() => setMode(null)} />;
  if (mode === "speak") return <SpeakGame onExit={() => setMode(null)} />;

  return (
    <div>
      <BackHeader title="Tone Master" onBack={back} />
      <div className="space-y-3 px-5">
        <p className="text-sm text-slate-astra/60">
          Mandarin punya empat nada. Suku kata yang sama bisa berarti lain jika nadanya berbeda: mā, má, mǎ, mà.
        </p>
        <Glass className="flex justify-around p-5">
          {[1, 2, 3, 4].map((t) => (
            <div key={t} className="flex flex-col items-center gap-1">
              <ToneCurve tone={t} w={56} h={36} strokeWidth={3} />
              <span className="text-xs font-bold text-slate-astra">Nada {t}</span>
              <span className="text-[11px] text-slate-astra/50">{acc[t] == null ? "—" : `${acc[t]}%`}</span>
            </div>
          ))}
        </Glass>
        <button className="press block w-full text-left" onClick={() => setMode("listen")}>
          <div className="glass-dark rounded-[28px] p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-mint">Mode Dengar</p>
            <p className="mt-2 text-lg font-bold">Tebak nada, {ROUNDS} ronde</p>
            <p className="text-sm text-white/65">Dengarkan nada, pilih suku kata yang tepat sebelum waktu habis. Pakai headphone jika bisa.</p>
          </div>
        </button>
        <button className="press block w-full text-left" onClick={() => setMode("speak")}>
          <Glass className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-astra/70">Mode Ucap</p>
            <p className="mt-2 text-lg font-bold text-slate-astra">Ucapkan nadanya</p>
            <p className="text-sm text-slate-astra/55">Mikrofon membaca naik-turun suara Anda dan mencocokkannya dengan kurva target.</p>
          </Glass>
        </button>
      </div>
    </div>
  );
}

function ListenGame({ onExit }) {
  const { state, act } = useApp();
  const [n, setN] = useState(0);
  const [cur, setCur] = useState(newRound);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [remain, setRemain] = useState(TIME_MS);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);
  const timers = useRef([]);
  const pickedRef = useRef(null);
  pickedRef.current = picked;

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = useCallback(async () => {
    setErr(null);
    setPlaying(true);
    try {
      await playToneCurve(toneCurve(cur.tone));
    } catch {
      setErr("Audio tidak dapat diputar di perangkat ini.");
    }
    setPlaying(false);
  }, [cur]);

  // Ronde baru: putar otomatis dan mulai hitung mundur.
  useEffect(() => {
    if (done) return;
    setRemain(TIME_MS);
    later(play, 350);
  }, [cur, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = useCallback(
    (idx) => {
      if (pickedRef.current != null) return;
      const ok = idx === cur.tone - 1;
      setPicked(idx);
      if (ok) {
        setCorrect((c) => c + 1);
        success();
      } else tap("medium");
      act((s) => recordTone(s, { tone: cur.tone, correct: ok }));
      later(() => {
        if (n + 1 >= ROUNDS) setDone(true);
        else {
          setN((x) => x + 1);
          setPicked(null);
          setCur(newRound());
        }
      }, 1500);
    },
    [cur, n, act]
  );

  useEffect(() => {
    if (done || picked != null) return;
    const id = setInterval(() => {
      setRemain((r) => {
        if (r <= 100) {
          clearInterval(id);
          answer(-1);
          return 0;
        }
        return r - 100;
      });
    }, 100);
    return () => clearInterval(id);
  }, [cur, picked, done, answer]);

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setN(0);
    setCorrect(0);
    setPicked(null);
    setDone(false);
    setCur(newRound());
  };

  if (done) {
    return (
      <div>
        <BackHeader title="Hasil Tone Master" onBack={onExit} />
        <div className="px-5">
          <Glass className="animate-pop p-8 text-center">
            <p className="text-6xl font-extrabold text-emerald-astra">
              {correct}
              <span className="text-3xl text-slate-astra/40">/{ROUNDS}</span>
            </p>
            <p className="mt-2 text-base font-semibold text-slate-astra">
              {correct >= 9 ? "Telinga yang tajam" : correct >= 6 ? "Semakin terbiasa" : "Terus latih, nada memang tricky"}
            </p>
            <p className="mt-1 text-xs text-slate-astra/50">Kombo terbaik: {state.bestToneCombo}</p>
          </Glass>
          <div className="mt-5 flex gap-3">
            <Button variant="soft" className="flex-1" onClick={onExit}>
              Selesai
            </Button>
            <Button className="flex-1" onClick={restart}>
              Main lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const revealed = picked != null;
  return (
    <div>
      <BackHeader title={`Ronde ${n + 1}/${ROUNDS}`} onBack={onExit} right={<span className="text-sm font-bold text-emerald-astra">🔥 {state.toneCombo}</span>} />
      <div className="px-5">
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-emerald-astra/10">
          <div className="h-full rounded-full bg-mint" style={{ width: `${(remain / TIME_MS) * 100}%`, transition: "width .1s linear" }} />
        </div>

        <Glass className="grid h-44 place-items-center p-5">
          {revealed ? (
            <div className="screen text-center">
              <ToneCurve tone={cur.tone} w={200} h={80} animate strokeWidth={4} />
              <p className="mt-2 text-sm font-bold text-slate-astra">{TONE_NAME[cur.tone]}</p>
            </div>
          ) : (
            <div className="flex h-24 items-center gap-1.5" aria-label="Memutar nada">
              {Array.from({ length: 22 }, (_, k) => (
                <span
                  key={k}
                  className="w-1.5 origin-center rounded-full bg-emerald-astra/70"
                  style={{
                    height: `${30 + ((k * 37) % 60)}%`,
                    animation: playing ? `eq .5s ${(k % 7) * 0.07}s ease-in-out infinite alternate` : undefined,
                    transform: playing ? undefined : "scaleY(.3)",
                  }}
                />
              ))}
            </div>
          )}
        </Glass>

        <div className="mt-3 flex justify-center">
          <Button variant="soft" onClick={play} disabled={playing || revealed}>
            ↻ Putar lagi
          </Button>
        </div>
        {err && <p className="mt-3 rounded-2xl bg-amber-astra/10 p-3 text-sm text-amber-700">{err}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          {cur.set.syllables.map((syl, k) => {
            const isRight = k === cur.tone - 1;
            const isPicked = picked === k;
            const style = !revealed
              ? "glass"
              : isRight
              ? "bg-mint/30 border border-mint shadow-glow"
              : isPicked
              ? "bg-amber-astra/15 border border-amber-astra"
              : "glass opacity-60";
            return (
              <button
                key={k}
                disabled={revealed}
                onClick={() => answer(k)}
                className={`press rounded-[24px] p-4 text-center transition-all ${style}`}
              >
                <p className="text-3xl font-extrabold text-slate-astra">{syl}</p>
                <p className="font-han mt-1 text-xl text-emerald-astra">{cur.set.chars[k]}</p>
                <p className="text-xs text-slate-astra/50">{cur.set.gloss[k]}</p>
              </button>
            );
          })}
        </div>
        {revealed && (
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" onClick={() => speak(cur.set.chars[cur.tone - 1], "zh", true)}>
              ▶ Dengar kata “{cur.set.chars[cur.tone - 1]}”
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SpeakGame({ onExit }) {
  const { act } = useApp();
  const [target, setTarget] = useState(newRound);
  const [phase, setPhase] = useState("idle"); // idle | recording | result
  const [live, setLive] = useState([]);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const tracker = useRef(null);
  const auto = useRef(null);
  const frames = useRef(0);

  useEffect(
    () => () => {
      clearTimeout(auto.current);
      tracker.current?.stop();
    },
    []
  );

  const stop = async () => {
    clearTimeout(auto.current);
    const t = tracker.current;
    if (!t) return;
    tracker.current = null;
    const contour = await t.stop();
    if (contour.length < 6) {
      setRes({ silent: true });
      setPhase("result");
      return;
    }
    const cls = classifyTone(contour);
    const ok = cls.tone === target.tone;
    act((s) => recordTone(s, { tone: target.tone, correct: ok }));
    if (ok) success();
    setRes({ tone: cls.tone, ok, curve: normContour(contour) });
    setPhase("result");
  };

  const start = async () => {
    setErr(null);
    setRes(null);
    setLive([]);
    frames.current = 0;
    try {
      const t = new PitchTracker({
        onFrame: (_, all) => {
          frames.current += 1;
          if (frames.current % 4 === 0) setLive(normContour(contourFromHz(all)));
        },
      });
      await t.start();
      tracker.current = t;
      setPhase("recording");
      auto.current = setTimeout(stop, 2000);
    } catch {
      setErr("Mikrofon tidak dapat diakses. Izinkan akses mikrofon untuk Astra, lalu coba lagi.");
    }
  };

  const again = () => {
    setTarget(newRound());
    setPhase("idle");
    setRes(null);
    setLive([]);
  };

  const overlay = phase === "result" ? res?.curve : live;
  return (
    <div>
      <BackHeader title="Tone Master · Ucap" onBack={onExit} />
      <div className="px-5">
        <Glass className="p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-astra/70">Ucapkan dengan {TONE_NAME[target.tone].toLowerCase()}</p>
          <p className="mt-3 text-5xl font-extrabold text-slate-astra">{target.set.syllables[target.tone - 1]}</p>
          <p className="font-han mt-1 text-2xl text-emerald-astra">{target.set.chars[target.tone - 1]}</p>
          <p className="text-xs text-slate-astra/50">{target.set.gloss[target.tone - 1]}</p>
          <div className="mt-5 flex justify-center">
            <ToneCurve curve={toneCurve(target.tone, 32)} overlay={overlay} w={260} h={110} strokeWidth={4} />
          </div>
          <p className="mt-1 text-[11px] text-slate-astra/40">Garis hijau: target. Titik-titik gelap: suara Anda.</p>
        </Glass>

        {phase === "result" && res && (
          <div className="screen mt-4">
            {res.silent ? (
              <p className="rounded-2xl bg-amber-astra/10 p-3 text-sm text-amber-700">
                Suara belum terdeteksi. Ucapkan agak keras dan panjangkan vokalnya sekitar satu detik.
              </p>
            ) : (
              <p className={`rounded-2xl p-3 text-sm ${res.ok ? "bg-mint/25 text-emerald-astra" : "bg-amber-astra/10 text-amber-700"}`}>
                {res.ok ? "Tepat! " : "Hampir. "}Terdengar seperti {TONE_NAME[res.tone]?.toLowerCase()}.
                {!res.ok && ` Targetnya ${TONE_NAME[target.tone].toLowerCase()}.`}
              </p>
            )}
          </div>
        )}
        {err && <p className="mt-4 rounded-2xl bg-amber-astra/10 p-3 text-sm text-amber-700">{err}</p>}

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex gap-3">
            <Button
              variant="soft"
              onClick={async () => {
                try {
                  await playToneCurve(toneCurve(target.tone));
                } catch {
                  /* diabaikan */
                }
              }}
              disabled={phase === "recording"}
            >
              ▶ Nada target
            </Button>
            <Button variant="soft" onClick={() => speak(target.set.chars[target.tone - 1], "zh", true)} disabled={phase === "recording"}>
              ▶ Kata
            </Button>
          </div>
          {phase === "result" ? (
            <div className="flex gap-3">
              <Button variant="soft" onClick={() => { setPhase("idle"); setRes(null); setLive([]); }}>
                Coba lagi
              </Button>
              <Button onClick={again}>Nada berikutnya</Button>
            </div>
          ) : (
            <button
              aria-label={phase === "recording" ? "Berhenti" : "Mulai merekam"}
              onClick={phase === "recording" ? stop : start}
              className="press relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-astra to-emerald-forest text-white shadow-glow"
            >
              {phase === "recording" && <span className="absolute inset-0 rounded-full bg-mint/40" style={{ animation: "pulse-ring 1.2s ease-out infinite" }} />}
              <svg viewBox="0 0 24 24" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          )}
          <p className="text-xs text-slate-astra/50">{phase === "recording" ? "Merekam 2 detik… ucapkan sekarang" : phase === "idle" ? "Ketuk mikrofon, lalu ucapkan suku kata" : ""}</p>
          <Button variant="ghost" onClick={onExit}>
            Selesai
          </Button>
        </div>
      </div>
    </div>
  );
}
