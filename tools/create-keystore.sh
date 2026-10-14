#!/usr/bin/env bash
# Membuat kunci unggah (upload key) untuk Play Console dan menyiapkan nilai untuk GitHub Secrets.
# Jalankan di komputer Anda sendiri (butuh JDK: perintah `keytool`). Kata sandi diketik oleh Anda, bukan disimpan di skrip.
set -euo pipefail

OUT="${1:-astra-upload.jks}"
ALIAS="${2:-astra-upload}"

if [ -e "$OUT" ]; then
  echo "File $OUT sudah ada. Hapus atau pilih nama lain; kunci lama tidak boleh tertimpa." >&2
  exit 1
fi

read -r -s -p "Kata sandi keystore (min. 8 karakter): " PASS; echo
read -r -s -p "Ulangi kata sandi: " PASS2; echo
[ "$PASS" = "$PASS2" ] || { echo "Kata sandi tidak sama." >&2; exit 1; }

keytool -genkeypair -v \
  -keystore "$OUT" -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PASS" -keypass "$PASS"

B64="$OUT.base64.txt"
base64 -w0 "$OUT" > "$B64" 2>/dev/null || base64 "$OUT" | tr -d '\n' > "$B64"

cat <<EOF

Selesai. Langkah berikutnya:

1. SIMPAN $OUT dan kata sandinya di tempat aman (password manager + cadangan offline).
   Jangan commit ke Git. Jika hilang, pembaruan aplikasi memerlukan reset kunci lewat dukungan Google.

2. Di GitHub: Settings -> Secrets and variables -> Actions -> New repository secret, buat 4 secret:
   ANDROID_KEYSTORE_BASE64    = isi file $B64
   ANDROID_KEYSTORE_PASSWORD  = kata sandi yang tadi Anda ketik
   ANDROID_KEY_ALIAS          = $ALIAS
   ANDROID_KEY_PASSWORD       = kata sandi yang sama (keypass)

3. Setelah itu hapus $B64 dari komputer: berkas itu setara dengan kuncinya.
EOF
