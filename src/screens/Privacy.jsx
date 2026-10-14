import { useApp } from "../app-context.js";
import { BackHeader, Glass } from "../components/ui.jsx";

const ITEMS = [
  ["Tanpa akun", "Astra tidak meminta akun, email, atau nomor telepon. Progres (poin, streak, skor, badge) disimpan hanya di perangkat Anda."],
  ["Suara dan mikrofon", "Mikrofon dipakai hanya saat Anda menekan tombol rekam. Astra tidak menyimpan rekaman audio. Pengenalan suara dilakukan oleh layanan suara bawaan perangkat Anda (di Android umumnya layanan Google), yang dapat mengirim audio ke server penyedianya sesuai kebijakan penyedia tersebut."],
  ["Mode Ucap Tone Master", "Pembacaan nada dilakukan langsung di perangkat. Audio tidak dikirim ke mana pun oleh Astra."],
  ["Tanpa iklan dan pelacakan", "Astra tidak memuat iklan, SDK analitik, atau pelacak pihak ketiga."],
  ["Hapus data", "Profil → “Hapus semua data saya” menghapus seluruh data aplikasi dari perangkat. Mencopot pemasangan aplikasi juga menghapusnya."],
];

export default function Privacy() {
  const { back } = useApp();
  return (
    <div>
      <BackHeader title="Privasi dan data" onBack={back} />
      <div className="space-y-3 px-5 pb-8">
        {ITEMS.map(([t, d]) => (
          <Glass key={t} className="p-5">
            <p className="text-sm font-bold text-slate-astra">{t}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-astra/70">{d}</p>
          </Glass>
        ))}
      </div>
    </div>
  );
}
