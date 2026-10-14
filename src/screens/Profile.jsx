import { useApp } from "../app-context.js";
import { Button, Glass, Segmented } from "../components/ui.jsx";
import { BADGES, JOURNEY, averageScore, displayStreak, journeyPosition, toneAccuracy } from "../lib/progress.js";
import { useState } from "react";

function ScoreChart({ history }) {
  const pts = history.slice(-20);
  if (pts.length < 2) {
    return <p className="py-6 text-center text-sm text-slate-astra/45">Grafik muncul setelah 2 latihan ucapan.</p>;
  }
  const w = 300;
  const h = 110;
  const xy = pts.map((p, i) => [8 + (i / (pts.length - 1)) * (w - 16), 8 + (1 - p.score / 100) * (h - 16)]);
  const d = xy.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Grafik skor ucapan">
      {[0, 50, 100].map((g) => (
        <line key={g} x1="8" x2={w - 8} y1={8 + (1 - g / 100) * (h - 16)} y2={8 + (1 - g / 100) * (h - 16)} stroke="rgba(10,77,60,.1)" />
      ))}
      <path d={d} fill="none" stroke="#0A4D3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {xy.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#00E699" stroke="#0A4D3C" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function Journey({ points }) {
  const { pos, progress } = journeyPosition(points);
  const gapY = 78;
  const h = JOURNEY.length * gapY;
  const xs = JOURNEY.map((_, i) => (i % 2 === 0 ? 90 : 230));
  const ys = JOURNEY.map((_, i) => h - 40 - i * gapY);
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 1; i < JOURNEY.length; i++) {
    const my = (ys[i - 1] + ys[i]) / 2;
    d += ` C${xs[i - 1]},${my} ${xs[i]},${my} ${xs[i]},${ys[i]}`;
  }
  const total = JOURNEY.length - 1;
  const done = Math.min(1, (pos + progress) / total);
  return (
    <svg viewBox={`0 0 320 ${h}`} className="w-full">
      <path d={d} fill="none" stroke="rgba(10,77,60,.12)" strokeWidth="10" strokeLinecap="round" pathLength="1" />
      <path d={d} fill="none" stroke="#00E699" strokeWidth="10" strokeLinecap="round" pathLength="1" strokeDasharray={`${done} 1`} style={{ transition: "stroke-dasharray 1s" }} />
      {JOURNEY.map((n, i) => {
        const reached = i <= pos;
        const current = i === pos;
        return (
          <g key={n.index}>
            {current && <circle cx={xs[i]} cy={ys[i]} r="26" fill="#00E699" opacity=".25" style={{ animation: "pulse-ring 1.6s ease-out infinite", transformOrigin: `${xs[i]}px ${ys[i]}px` }} />}
            <circle cx={xs[i]} cy={ys[i]} r="20" fill={reached ? "#0A4D3C" : "#fff"} stroke={reached ? "#00E699" : "rgba(10,77,60,.2)"} strokeWidth="3" />
            <text x={xs[i]} y={ys[i] + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={reached ? "#00E699" : "rgba(15,23,42,.35)"}>
              {i + 1}
            </text>
            <text x={xs[i] + (i % 2 === 0 ? 32 : -32)} y={ys[i] + 5} textAnchor={i % 2 === 0 ? "start" : "end"} fontSize="13" fontWeight="700" fill={reached ? "#0F172A" : "rgba(15,23,42,.4)"}>
              {n.title}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Profile() {
  const { state, act, go, reset } = useApp();
  const [confirm, setConfirm] = useState(false);
  const avg = averageScore(state);
  const acc = toneAccuracy(state);
  const streak = displayStreak(state);
  const hours = (state.totalSeconds / 60).toFixed(0);

  return (
    <div className="px-5" style={{ paddingTop: "calc(var(--sat) + 22px)" }}>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-astra">{state.settings.name ? state.settings.name : "Profil"}</h1>
      <p className="text-sm text-slate-astra/55">Perkembangan dan koleksi badge.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { l: "Streak", v: `${streak} hari`, s: `terbaik ${state.bestStreak}` },
          { l: "Astra Points", v: state.points, s: "total" },
          { l: "Waktu latihan", v: `${hours} mnt`, s: `${state.sessions} sesi ucapan` },
          { l: "Rata-rata skor", v: avg == null ? "—" : avg, s: "10 terakhir" },
        ].map((x) => (
          <Glass key={x.l} className="p-4">
            <p className="text-xs font-semibold text-slate-astra/55">{x.l}</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-astra">{x.v}</p>
            <p className="text-[11px] text-slate-astra/45">{x.s}</p>
          </Glass>
        ))}
      </div>

      <Glass className="mt-4 p-5">
        <p className="text-sm font-bold text-slate-astra">Skor ucapan</p>
        <ScoreChart history={state.history} />
      </Glass>

      <Glass className="mt-4 p-5">
        <p className="text-sm font-bold text-slate-astra">Akurasi nada Mandarin</p>
        <div className="mt-3 space-y-2.5">
          {[1, 2, 3, 4].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <span className="w-14 text-xs font-semibold text-slate-astra/60">Nada {t}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-astra/10">
                <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${acc[t] ?? 0}%` }} />
              </div>
              <span className="w-10 text-right text-xs font-bold text-emerald-astra">{acc[t] == null ? "—" : `${acc[t]}%`}</span>
            </div>
          ))}
        </div>
      </Glass>

      <h2 className="mb-3 mt-6 text-sm font-bold text-slate-astra/70">Badge</h2>
      <div className="grid grid-cols-3 gap-3">
        {BADGES.map((b) => {
          const got = state.badges.includes(b.id);
          return (
            <Glass key={b.id} className={`p-3 text-center ${got ? "" : "opacity-45 grayscale"}`}>
              <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full text-lg ${got ? "bg-gradient-to-br from-emerald-astra to-emerald-forest text-mint shadow-glow" : "bg-slate-astra/10 text-slate-astra/40"}`}>
                ✦
              </div>
              <p className="mt-2 text-[11px] font-bold leading-tight text-slate-astra">{b.name}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-slate-astra/50">{b.desc}</p>
            </Glass>
          );
        })}
      </div>

      <h2 className="mb-2 mt-6 text-sm font-bold text-slate-astra/70">Journey Roadmap</h2>
      <Glass className="p-3">
        <Journey points={state.points} />
      </Glass>

      <h2 className="mb-3 mt-6 text-sm font-bold text-slate-astra/70">Pengaturan</h2>
      <Glass className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-astra">Bahasa utama</span>
          <Segmented
            value={state.settings.lang}
            options={[
              { value: "en", label: "English" },
              { value: "zh", label: "中文" },
            ]}
            onChange={(v) => act((s) => ({ ...s, settings: { ...s.settings, lang: v } }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-astra">Kecepatan suara</span>
          <Segmented
            value={state.settings.slow}
            options={[
              { value: false, label: "Normal" },
              { value: true, label: "Lambat" },
            ]}
            onChange={(v) => act((s) => ({ ...s, settings: { ...s.settings, slow: v } }))}
          />
        </div>
        <Button variant="soft" className="w-full" onClick={() => go("privacy")}>
          Privasi dan data
        </Button>
        {!confirm ? (
          <Button variant="danger" className="w-full" onClick={() => setConfirm(true)}>
            Hapus semua data saya
          </Button>
        ) : (
          <div className="rounded-2xl bg-amber-astra/10 p-3">
            <p className="text-sm text-amber-800">Semua progres, streak, dan badge akan dihapus dari perangkat ini. Lanjutkan?</p>
            <div className="mt-3 flex gap-3">
              <Button variant="soft" className="flex-1" onClick={() => setConfirm(false)}>
                Batal
              </Button>
              <Button variant="danger" className="flex-1" onClick={reset}>
                Ya, hapus
              </Button>
            </div>
          </div>
        )}
      </Glass>
      <p className="mt-6 text-center text-xs text-slate-astra/35">Astra 1.0</p>
    </div>
  );
}
