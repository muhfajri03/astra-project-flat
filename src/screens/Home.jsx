import { useState } from "react";
import { useApp } from "../app-context.js";
import { Button, Chip, Glass, ProgressRing, Segmented } from "../components/ui.jsx";
import { MODULES, dailyPhrase } from "../lib/content.js";
import {
  CHALLENGE_BONUS,
  CHALLENGE_TARGET,
  DAILY_GOAL_MIN,
  displayStreak,
  goalProgress,
  journeyPosition,
  minutesToday,
  pronunciationsToday,
} from "../lib/progress.js";
import { speak } from "../lib/speech.js";

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
  return name ? `${g}, ${name}` : g;
}

export default function Home() {
  const { state, act, go } = useApp();
  const lang = state.settings.lang;
  const phrase = dailyPhrase(lang);
  const streak = displayStreak(state);
  const prog = goalProgress(state);
  const mins = minutesToday(state);
  const jp = journeyPosition(state.points);
  const challengeN = Math.min(CHALLENGE_TARGET, pronunciationsToday(state));
  const challengeDone = state.challengeDay && challengeN >= CHALLENGE_TARGET;
  const [playing, setPlaying] = useState(false);

  const listen = async () => {
    setPlaying(true);
    await speak(phrase.text, lang, state.settings.slow);
    setPlaying(false);
  };

  const mods = [...MODULES].sort((a, b) => (a.lang === lang ? -1 : 0) - (b.lang === lang ? -1 : 0));

  return (
    <div className="px-5" style={{ paddingTop: "calc(var(--sat) + 22px)" }}>
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-astra/55">{greeting(state.settings.name)}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-astra">Latihan hari ini</h1>
        </div>
        <Chip>
          <span aria-hidden>🔥</span>
          {streak} hari
        </Chip>
      </header>

      <Glass className="mt-5 flex items-center gap-5 p-5">
        <ProgressRing value={prog} size={92}>
          <div className="text-center leading-tight">
            <p className="text-xl font-extrabold text-emerald-astra">{Math.round(prog * 100)}%</p>
          </div>
        </ProgressRing>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-astra/60">Target harian</p>
          <p className="text-2xl font-extrabold text-slate-astra">
            {mins} <span className="text-base font-semibold text-slate-astra/50">/ {DAILY_GOAL_MIN} mnt</span>
          </p>
          <p className="text-xs font-semibold text-emerald-astra">{state.points} Astra Points</p>
        </div>
      </Glass>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-astra/70">Kalimat harian</h2>
        <Segmented
          value={lang}
          options={[
            { value: "en", label: "English" },
            { value: "zh", label: "中文" },
          ]}
          onChange={(v) => act((s) => ({ ...s, settings: { ...s.settings, lang: v } }))}
        />
      </div>

      <div className="glass-dark relative mt-3 overflow-hidden rounded-[28px] p-6 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mint/25 blur-2xl" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-widest text-mint">Listen & Echo</p>
        {lang === "zh" ? (
          <>
            <p className="font-han mt-3 text-3xl font-semibold">{phrase.text}</p>
            <p className="mt-1 text-sm text-white/70">{phrase.words.map((w) => w.p).join(" ")}</p>
          </>
        ) : (
          <p className="mt-3 text-2xl font-bold leading-snug">“{phrase.text}”</p>
        )}
        <p className="mt-2 text-sm text-white/60">{phrase.translation}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="soft" className="flex-1" onClick={listen}>
            {playing ? "Memutar…" : "▶ Dengar"}
          </Button>
          <Button variant="mint" className="flex-1" onClick={() => go("listen", { phrase, ids: [phrase.id], i: 0 })}>
            🎙 Ucapkan
          </Button>
        </div>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-bold text-slate-astra/70">Lanjutkan</h2>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
        {mods.map((m) => {
          const learned = m.phrases.filter((p) => (state.learned[p.id] ?? 0) >= 80).length;
          return (
            <button key={m.id} onClick={() => go("module", { moduleId: m.id })} className="press shrink-0 text-left">
              <Glass className="w-40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-astra/70">
                  {m.lang === "zh" ? "Mandarin" : "English"}
                </p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-astra">{m.title}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-astra/10">
                  <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${(learned / m.phrases.length) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-astra/50">
                  {learned}/{m.phrases.length} dikuasai
                </p>
              </Glass>
            </button>
          );
        })}
      </div>

      <Glass className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-astra/70">Tantangan hari ini</p>
            <p className="mt-1 text-base font-bold text-slate-astra">Ucapkan {CHALLENGE_TARGET} kalimat</p>
            <p className="text-xs text-slate-astra/55">
              {challengeDone ? "Selesai, bonus sudah diterima" : `Bonus +${CHALLENGE_BONUS} Astra Points`}
            </p>
          </div>
          <ProgressRing value={challengeN / CHALLENGE_TARGET} size={56} stroke={7}>
            <span className="text-sm font-extrabold text-emerald-astra">
              {challengeN}/{CHALLENGE_TARGET}
            </span>
          </ProgressRing>
        </div>
      </Glass>

      <button className="press mt-4 block w-full text-left" onClick={() => go("profile")}>
        <Glass className="flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-astra text-lg font-extrabold text-mint">{jp.pos + 1}</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-astra">Perjalanan: {jp.next ? `menuju “${jp.next.title}”` : "puncak tercapai"}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-astra/10">
              <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${jp.progress * 100}%` }} />
            </div>
          </div>
        </Glass>
      </button>
    </div>
  );
}
