import { useEffect, useMemo } from "react";
import { toneCurve } from "../lib/tones.js";
import { tap } from "../lib/haptics.js";

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mist">
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-astra/25 blur-3xl animate-float" />
      <div
        className="absolute top-1/3 -right-32 h-80 w-80 rounded-full bg-mint/20 blur-3xl animate-float"
        style={{ animationDelay: "-2s" }}
      />
      <div
        className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-sage/15 blur-3xl animate-float"
        style={{ animationDelay: "-4s" }}
      />
    </div>
  );
}

export function Glass({ className = "", children, ...rest }) {
  return (
    <div className={`glass rounded-[28px] ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Button({ variant = "primary", className = "", onClick, children, ...rest }) {
  const styles = {
    primary: "bg-gradient-to-br from-emerald-astra to-emerald-forest text-white shadow-glow",
    soft: "bg-white text-emerald-astra border border-emerald-astra/15 shadow-sm",
    mint: "bg-mint text-emerald-astra shadow-glow",
    ghost: "text-emerald-astra/80",
    danger: "bg-white text-amber-700 border border-amber-astra/40",
  }[variant];
  return (
    <button
      className={`press rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-40 ${styles} ${className}`}
      onClick={(e) => {
        tap();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Chip({ children, className = "" }) {
  return (
    <span
      className={`glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-emerald-astra ${className}`}
    >
      {children}
    </span>
  );
}

export function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-emerald-astra/5 p-1 text-xs font-semibold">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => {
            tap();
            onChange(o.value);
          }}
          className={`rounded-full px-3.5 py-1.5 transition-all duration-200 ${
            value === o.value ? "bg-emerald-astra text-white shadow-sm" : "text-slate-astra/60"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressRing({ value, size = 96, stroke = 9, children, color = "#00E699" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(10,77,60,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

// Kurva nada. curve: array 0..1. overlay: kurva pengguna (opsional).
export function ToneCurve({ tone, curve, overlay, w = 120, h = 44, color = "#00E699", animate = false, strokeWidth = 3 }) {
  const pts = curve || toneCurve(tone, 24);
  const toPath = (arr) =>
    arr
      .map((v, i) => {
        const x = 4 + (i / (arr.length - 1)) * (w - 8);
        const y = 4 + (1 - v) * (h - 8);
        return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path
        d={toPath(pts)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={animate ? 1 : undefined}
        style={animate ? { animation: "draw .7s linear both" } : undefined}
      />
      {overlay && overlay.length > 1 && (
        <path
          d={toPath(overlay)}
          fill="none"
          stroke="#0F172A"
          strokeOpacity="0.75"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 5"
        />
      )}
    </svg>
  );
}

export function BackHeader({ title, onBack, right }) {
  return (
    <div className="flex items-center justify-between px-5 pb-3" style={{ paddingTop: "calc(var(--sat) + 14px)" }}>
      <button
        aria-label="Kembali"
        onClick={() => {
          tap();
          onBack();
        }}
        className="press glass grid h-10 w-10 place-items-center rounded-full text-emerald-astra"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <h1 className="text-sm font-bold tracking-wide text-slate-astra">{title}</h1>
      <div className="min-w-10">{right}</div>
    </div>
  );
}

export function Sheet({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-astra/30 backdrop-blur-[2px]" />
      <div
        className="glass screen relative w-full rounded-t-[32px] p-6"
        style={{ paddingBottom: "calc(var(--sab) + 24px)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-emerald-astra/20" />
        {children}
      </div>
    </div>
  );
}

export function Celebration({ badges = [], challenge = false, names = {}, onDone }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        dx: (Math.random() - 0.5) * 160,
        rot: (Math.random() - 0.5) * 900,
        delay: Math.random() * 0.4,
        dur: 1.8 + Math.random() * 1.2,
        color: ["#00E699", "#2ECC71", "#0A4D3C", "#F59E0B", "#ffffff"][i % 5],
      })),
    []
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-astra/40 backdrop-blur-sm" onClick={onDone}>
      {bits.map((b, i) => (
        <span
          key={i}
          className="pointer-events-none fixed top-0 h-3 w-2 rounded-sm"
          style={{
            left: `${b.left}%`,
            background: b.color,
            "--dx": `${b.dx}px`,
            "--rot": `${b.rot}deg`,
            animation: `confetti ${b.dur}s ${b.delay}s ease-in both`,
          }}
        />
      ))}
      <div className="glass animate-pop mx-8 w-full max-w-xs rounded-[32px] p-7 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-astra to-emerald-forest text-3xl shadow-glow">
          ✦
        </div>
        {challenge && (
          <p className="mb-2 text-sm font-semibold text-emerald-astra">Tantangan harian selesai! +15 Astra Points</p>
        )}
        {badges.map((id) => (
          <p key={id} className="text-lg font-bold text-slate-astra">
            Badge baru: {names[id] || id}
          </p>
        ))}
        <Button className="mt-5 w-full" onClick={onDone}>
          Lanjut
        </Button>
      </div>
    </div>
  );
}
