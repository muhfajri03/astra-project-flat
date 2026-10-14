import { tap } from "../lib/haptics.js";

const Icon = ({ d, extra }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {extra}
  </svg>
);

const ITEMS = [
  { id: "home", label: "Home", icon: <Icon d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" /> },
  { id: "hub", label: "Belajar", icon: <Icon d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h12" /> },
  { id: "practice", label: "Latihan", center: true },
  { id: "profile", label: "Profil", icon: <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6" /> },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4"
      style={{ paddingBottom: "calc(var(--sab) + 12px)" }}
      aria-label="Navigasi utama"
    >
      <div
        className="glass flex items-end justify-around rounded-[30px] px-3 pb-2 pt-2"
        style={{ background: "rgba(255,255,255,0.92)" }}
      >
        {ITEMS.map((it) =>
          it.center ? (
            <button
              key={it.id}
              aria-label="Latihan"
              onClick={() => {
                tap("medium");
                onChange(it.id);
              }}
              className={`press -mt-7 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-astra to-emerald-forest text-white shadow-glow ring-4 ring-white/70 ${
                active === it.id ? "scale-105" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          ) : (
            <button
              key={it.id}
              onClick={() => {
                tap();
                onChange(it.id);
              }}
              className={`press flex w-16 flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold transition-colors ${
                active === it.id ? "text-emerald-astra" : "text-slate-astra/40"
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          )
        )}
      </div>
    </nav>
  );
}
