import { useApp } from "../app-context.js";
import { BackHeader, Button, Glass } from "../components/ui.jsx";
import { MODULE_BY_ID } from "../lib/content.js";

export default function ModuleScreen({ moduleId }) {
  const { state, back, go } = useApp();
  const m = MODULE_BY_ID[moduleId];
  if (!m) return null;
  const ids = m.phrases.map((p) => p.id);

  return (
    <div>
      <BackHeader title={m.title} onBack={back} />
      <div className="px-5">
        <p className="text-sm text-slate-astra/55">{m.subtitle}</p>
        <Button className="mt-4 w-full" onClick={() => go("listen", { phrase: m.phrases[0], ids, i: 0 })}>
          Mulai dari awal
        </Button>
        <div className="mt-5 space-y-3">
          {m.phrases.map((p, i) => {
            const best = state.learned[p.id];
            return (
              <button key={p.id} onClick={() => go("listen", { phrase: p, ids, i })} className="press block w-full text-left">
                <Glass className="flex items-center gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-astra/10 text-sm font-bold text-emerald-astra">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-base font-semibold text-slate-astra ${p.lang === "zh" ? "font-han" : ""}`}>{p.text}</p>
                    <p className="truncate text-xs text-slate-astra/50">{p.translation}</p>
                  </div>
                  {best != null && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        best >= 80 ? "bg-mint/25 text-emerald-astra" : "bg-amber-astra/15 text-amber-700"
                      }`}
                    >
                      {best}
                    </span>
                  )}
                </Glass>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
