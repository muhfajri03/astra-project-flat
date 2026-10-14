import { useApp } from "../app-context.js";
import { Glass, Segmented } from "../components/ui.jsx";
import { MODULES } from "../lib/content.js";

export default function Hub() {
  const { state, act, go } = useApp();
  const lang = state.settings.lang;
  const mods = MODULES.filter((m) => m.lang === lang);

  return (
    <div className="px-5" style={{ paddingTop: "calc(var(--sat) + 22px)" }}>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-astra">Learning Hub</h1>
      <p className="mt-1 text-sm text-slate-astra/55">Pilih modul, lalu latih kalimatnya satu per satu.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { v: "en", t: "Bahasa Inggris", s: `${MODULES.filter((m) => m.lang === "en").length} modul`, mark: "EN" },
          { v: "zh", t: "Mandarin", s: `${MODULES.filter((m) => m.lang === "zh").length} modul`, mark: "中" },
        ].map((o) => (
          <button key={o.v} onClick={() => act((s) => ({ ...s, settings: { ...s.settings, lang: o.v } }))} className="press text-left">
            <div
              className={`rounded-[28px] p-5 transition-all ${
                lang === o.v ? "glass-dark text-white" : "glass text-slate-astra"
              }`}
            >
              <p className={`font-han text-3xl font-extrabold ${lang === o.v ? "text-mint" : "text-emerald-astra"}`}>{o.mark}</p>
              <p className="mt-3 text-base font-bold">{o.t}</p>
              <p className={`text-xs ${lang === o.v ? "text-white/65" : "text-slate-astra/55"}`}>{o.s}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {mods.map((m) => {
          const done = m.phrases.filter((p) => (state.learned[p.id] ?? 0) >= 80).length;
          return (
            <button key={m.id} onClick={() => go("module", { moduleId: m.id })} className="press block w-full text-left">
              <Glass className="flex items-center gap-4 p-5">
                <div className="flex-1">
                  <p className="text-base font-bold text-slate-astra">{m.title}</p>
                  <p className="text-sm text-slate-astra/55">{m.subtitle}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-astra/10">
                    <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${(done / m.phrases.length) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-emerald-astra">
                    {done}/{m.phrases.length}
                  </p>
                  <p className="text-[11px] text-slate-astra/45">dikuasai</p>
                </div>
              </Glass>
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-slate-astra/40">Kalimat dianggap dikuasai jika skor ucapan 80 atau lebih.</p>
    </div>
  );
}
