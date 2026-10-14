import { useState } from "react";
import { useApp } from "../app-context.js";
import { Button, Glass, Segmented } from "../components/ui.jsx";
import { dailyPhrase } from "../lib/content.js";

function customPhrase(text, lang) {
  const clean = text.trim().replace(/\s+/g, " ").slice(0, 140);
  const words = lang === "zh" ? [...clean].filter((c) => /\p{Script=Han}/u.test(c)).map((c) => ({ t: c })) : clean.split(" ").map((t) => ({ t }));
  return {
    id: "custom",
    lang,
    text: lang === "zh" ? words.map((w) => w.t).join("") : clean,
    translation: "Kalimat buatan sendiri",
    words,
  };
}

export default function Practice() {
  const { state, go } = useApp();
  const lang = state.settings.lang;
  const [text, setText] = useState("");
  const [custLang, setCustLang] = useState(lang);
  const ok = customPhrase(text, custLang).words.length > 0;

  return (
    <div className="px-5" style={{ paddingTop: "calc(var(--sat) + 22px)" }}>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-astra">Practice Canvas</h1>
      <p className="mt-1 text-sm text-slate-astra/55">Pilih cara berlatih hari ini.</p>

      <div className="mt-5 grid gap-3">
        <button className="press text-left" onClick={() => go("listen", { phrase: dailyPhrase(lang), ids: [dailyPhrase(lang).id], i: 0 })}>
          <div className="glass-dark rounded-[28px] p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-mint">Listen & Echo</p>
            <p className="mt-2 text-lg font-bold">Kalimat harian</p>
            <p className="text-sm text-white/65">Dengar, tirukan, lihat kata mana yang perlu diperbaiki.</p>
          </div>
        </button>

        <button className="press text-left" onClick={() => go("tone")}>
          <Glass className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-astra/70">Mandarin</p>
            <p className="mt-2 text-lg font-bold text-slate-astra">Tone Master</p>
            <p className="text-sm text-slate-astra/55">Game nada 1–4: dengarkan kurvanya, lalu ucapkan sendiri.</p>
          </Glass>
        </button>

        <Glass className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-astra/70">Kalimat sendiri</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-slate-astra/60">Ketik kalimat yang ingin dilatih.</p>
            <Segmented
              value={custLang}
              options={[
                { value: "en", label: "EN" },
                { value: "zh", label: "中文" },
              ]}
              onChange={setCustLang}
            />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={140}
            placeholder={custLang === "zh" ? "例如：我喜欢学习中文" : "e.g. I would like to book a table for two"}
            className="font-han mt-3 w-full resize-none rounded-2xl border border-emerald-astra/15 bg-white/80 px-4 py-3 text-base outline-none focus:border-mint"
          />
          <Button className="mt-3 w-full" disabled={!ok} onClick={() => go("listen", { phrase: customPhrase(text, custLang), ids: ["custom"], i: 0 })}>
            Latih kalimat ini
          </Button>
          {custLang === "zh" && <p className="mt-2 text-xs text-slate-astra/45">Kalimat kustom Mandarin tidak menampilkan pinyin otomatis.</p>}
        </Glass>

        {[
          { t: "Contextual Scanner", s: "Foto benda, dapat kalimat percakapan. Butuh layanan AI vision." },
          { t: "Roleplay Room", s: "Percakapan suara dengan AI. Butuh layanan AI percakapan." },
        ].map((x) => (
          <Glass key={x.t} className="p-5 opacity-70">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-slate-astra">{x.t}</p>
              <span className="rounded-full bg-emerald-astra/10 px-2.5 py-1 text-[11px] font-bold text-emerald-astra">Segera</span>
            </div>
            <p className="mt-1 text-sm text-slate-astra/55">{x.s}</p>
          </Glass>
        ))}
      </div>
    </div>
  );
}
