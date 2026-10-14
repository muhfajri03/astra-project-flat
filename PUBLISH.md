# Panduan publikasi Astra ke Google Play

Semua langkah di bawah dikerjakan oleh Anda karena butuh akun pribadi Anda. Kebijakan Google Play sering berubah; angka dan syarat di bawah berasal dari pengetahuan saya, jadi **cocokkan dengan Play Console Help** sebelum bertindak.

## 0. Status yang jujur

| Bagian | Status |
| --- | --- |
| Logika inti (skor ucapan, nada, streak, badge) | Diuji otomatis: 26 unit test lulus |
| Seluruh UI, alur, dan penyimpanan | Diuji di Chromium dengan pengenal suara dan mikrofon tiruan: 15 cek lulus, tanpa error konsol |
| Proyek Android (Capacitor 8), izin, ikon, splash, penandatanganan | Dibuat dan dikonfigurasi, tetapi **belum dikompilasi**: tidak ada Android SDK di lingkungan pembuatan |
| Perilaku di HP asli (STT, TTS Mandarin, mikrofon, tombol kembali) | **Belum diuji**; lihat daftar uji di bagian 2 |
| Scanner dan Roleplay | Belum dibuat (butuh layanan AI berbayar); tampil sebagai "Segera" |

Jadi urutannya: build lewat CI, pasang di HP Anda, uji, baru kirim ke Play Console.

## 1. Build AAB lewat GitHub Actions

1. Buat repo GitHub (boleh privat) dan unggah isi proyek ini **dengan git, bukan lewat browser** (unggah browser dibatasi sekitar 100 file sekali unggah, sedangkan proyek ini 120 file; folder `src` bisa terpotong). Di komputer Anda, ekstrak ZIP lalu:
   ```bash
   cd astra            # folder yang berisi package.json dan index.html
   git init && git add -A && git commit -m "Astra 1.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   Pastikan `index.html`, `package.json`, `src/`, dan `android/` ada langsung di root repo (bukan di dalam subfolder). Tanpa git, alternatifnya unggah lewat browser dalam beberapa gelombang (misalnya `src` sendiri, `android` sendiri, sisanya sendiri).
2. Di komputer Anda yang punya JDK, jalankan `bash tools/create-keystore.sh`. Ikuti instruksinya untuk membuat kunci unggah dan 4 GitHub Secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).
   - Simpan file `.jks` dan kata sandinya di dua tempat aman. Jangan masukkan ke Git.
3. Di GitHub: tab **Actions → Android build → Run workflow**.
   - Tanpa secret, workflow menghasilkan **APK debug** untuk uji coba di HP.
   - Dengan secret, workflow menghasilkan **AAB rilis bertanda tangan** (berkas yang diunggah ke Play) plus APK rilis.
4. Unduh hasilnya dari bagian **Artifacts** pada run tersebut.

Jika build pertama gagal, kirimkan log yang gagal; kemungkinan hanya penyesuaian versi Gradle/SDK yang tidak bisa saya verifikasi dari sini.

## 2. Uji di HP asli sebelum dikirim

Pasang APK, lalu cek:

- [ ] Izin mikrofon muncul saat pertama kali menekan tombol rekam, dan pesan error jelas jika ditolak
- [ ] Listen & Echo Inggris: ucapkan kalimat, skor dan kata hijau/oranye muncul
- [ ] Listen & Echo Mandarin: pengenalan suara zh-CN berfungsi (butuh layanan suara Google; paket bahasa Mandarin mungkin perlu diunduh)
- [ ] Tombol "Dengarkan" memutar suara Inggris dan Mandarin (butuh mesin TTS dengan suara Mandarin terpasang)
- [ ] Tone Master mode Ucap: kurva suara tampil di layar dan nada terbaca masuk akal
- [ ] Tombol kembali Android: mundur satu layar, keluar hanya dari Home
- [ ] Tampilan di bawah status bar dan di atas bar navigasi (edge-to-edge Android 15+) tidak terpotong
- [ ] Haptic terasa saat menekan tombol; progres tetap ada setelah aplikasi ditutup paksa dan dibuka lagi

Catatan teknis yang perlu Anda tahu: di Android, pengenal suara dan pembaca nada tidak dijalankan bersamaan, karena keduanya memakai mikrofon. Karena itu kurva nada pengguna hanya ada di Tone Master mode Ucap, bukan di Listen & Echo.

## 3. Akun dan aturan Play Console

1. Daftar akun developer di play.google.com/console (ada biaya pendaftaran satu kali; saya ingat sekitar US$25, cek nilai terkini). Verifikasi identitas diperlukan.
2. **Akun pribadi baru** (bukan organisasi) umumnya wajib menjalankan **pengujian tertutup dengan minimal 12 penguji selama 14 hari berturut-turut** sebelum boleh mengajukan produksi. Rencanakan ini dari awal: kumpulkan 12+ teman/kelas yang mau memasang aplikasi lewat tautan uji. Verifikasi syarat terbarunya di Play Console Help.
3. Buat aplikasi baru → bahasa default Indonesia → Aplikasi → Gratis.

## 4. Isi formulir (Play Console → Dashboard)

| Formulir | Isian yang disarankan |
| --- | --- |
| Listing | Pakai `store/listing.md`, `store/icon-512.png`, `store/feature-graphic-1024x500.png`, `store/screenshots/*.png` |
| Kebijakan privasi | Wajib berupa URL publik. Isi bagian Kontak di `privacy-policy.md`, lalu hosting (mis. GitHub Pages) dan tempel URL-nya |
| Iklan | Tidak ada iklan |
| Akses aplikasi | Semua fungsi tersedia tanpa login |
| Rating konten | Isi kuesioner dengan jujur; aplikasi ini tanpa kekerasan, konten dewasa, atau fitur sosial |
| Target audiens | Pilih 13+ atau 18+. **Jangan** memilih anak di bawah 13 kecuali Anda siap memenuhi kebijakan Families |
| Keamanan data | Lihat catatan di bawah tabel |
| Kategori | Pendidikan |

**Keamanan data (Data safety):** aplikasi sendiri tidak mengirim data ke server pengembang, tidak punya SDK analitik atau iklan. Namun pengenalan suara dilakukan layanan bawaan perangkat yang bisa mengirim audio ke penyedianya. Baca pertanyaan formulir dengan cermat dan putuskan jawaban yang menurut Anda paling akurat; kebijakan privasi di repo sudah menjelaskan hal ini secara terbuka. Jika ragu, tanyakan ke Play Console Help.

## 5. Unggah dan rilis

1. **Pengujian → Pengujian internal** untuk mengecek build di perangkat sendiri, lalu **Pengujian tertutup** untuk memenuhi syarat 12 penguji / 14 hari.
2. Buat rilis → unggah AAB dari langkah 1 → catatan rilis → simpan → tinjau → mulai peluncuran.
3. Saat ditanya soal **Play App Signing**, setujui (default). Kunci yang Anda buat menjadi *kunci unggah*; Google memegang kunci penandatangan akhir.
4. Setelah syarat pengujian terpenuhi: **Produksi → Buat rilis**, lalu kirim untuk ditinjau. Peninjauan dapat memakan waktu beberapa hari.

## 6. Merilis pembaruan

Dorong tag baru (mis. `git tag v1.0.1 && git push --tags`) atau jalankan workflow lagi. `versionCode` otomatis naik mengikuti nomor run, dan wajib selalu lebih besar dari rilis sebelumnya.

## 7. Langkah berikutnya untuk fitur penuh

Scanner dan Roleplay butuh backend kecil (agar kunci API tidak ada di aplikasi) dan layanan berbayar:
- Scanner: model vision untuk mengenali benda + LLM untuk membuat 3 kalimat per bahasa
- Roleplay: STT + LLM percakapan + TTS, dengan kuota harian per pengguna untuk mengendalikan biaya
- Penilaian ucapan yang lebih akurat: layanan penilaian fonem (mis. Azure Pronunciation Assessment) menggantikan skor berbasis pengenalan suara

Tiga hal ini sebaiknya jadi versi 1.1 setelah versi dasar lolos di Play.
