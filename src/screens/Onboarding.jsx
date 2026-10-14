import { useState } from "react";
import { useApp } from "../app-context.js";
import { Button, Glass } from "../components/ui.jsx";

export default function Onboarding() {
  const { act } = useApp();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("en");
  const [name, setName] = useState("");

  const finish = () =>
    act((s) => ({
      ...s,
      onboarded: true,
      settings: { ...s.settings, lang, name: name.trim().slice(0, 24) },
    }));

  return (
    <div className="flex min-h-screen flex-col px-6" style={{ paddingTop: "calc(var(--sat) + 48px)", paddingBottom: "calc(var(--sab) + 28px)" }}>
      <div className="animate-pop mb-8 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-astra to-emerald-forest text-3xl text-mint shadow-glow">
        ✦
      </div>

      {step === 0 && (
        <div className="screen flex flex-1 flex-col">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-astra">
            Bicara dulu,
            <br />
            <span className="text-emerald-astra">hafal belakangan.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-astra/65">
            Astra melatih Bahasa Inggris dan Mandarin lewat kebiasaan sederhana: dengar, tirukan, dapat umpan balik per kata.
          </p>
          <div className="mt-auto space-y-3">
            <Button className="w-full py-4 text-base" onClick={() => setStep(1)}>
              Mulai
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="screen flex flex-1 flex-col">
          <h2 className="text-2xl font-extrabold text-slate-astra">Mau mulai dari bahasa apa?</h2>
          <p className="mt-2 text-sm text-slate-astra/60">Bisa diganti kapan saja, dan keduanya tetap tersedia.</p>
          <div className="mt-6 grid gap-3">
            {[
              { v: "en", t: "Bahasa Inggris", s: "Daily, Business, IELTS/TOEFL" },
              { v: "zh", t: "Bahasa Mandarin", s: "HSK 1, percakapan, latihan nada" },
            ].map((o) => (
              <button key={o.v} onClick={() => setLang(o.v)} className="press text-left">
                <Glass className={`p-5 transition-all ${lang === o.v ? "ring-2 ring-mint" : ""}`}>
                  <p className="text-lg font-bold text-slate-astra">{o.t}</p>
                  <p className="text-sm text-slate-astra/60">{o.s}</p>
                </Glass>
              </button>
            ))}
          </div>
          <label className="mt-6 block text-sm font-semibold text-slate-astra/70">
            Nama panggilan (opsional)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Misalnya: Fajri"
              className="mt-2 w-full rounded-2xl border border-emerald-astra/15 bg-white/80 px-4 py-3 text-base outline-none focus:border-mint"
            />
          </label>
          <div className="mt-auto pt-8">
            <Button className="w-full py-4 text-base" onClick={finish}>
              Masuk ke Astra
            </Button>
            <p className="mt-3 text-center text-xs text-slate-astra/45">
              Suara Anda hanya dipakai untuk menilai latihan. Lihat Profil → Privasi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
