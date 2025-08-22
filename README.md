# FebriStore (Expo React Native)

Aplikasi mobile Ecommerce untuk toko online yang menggunakan platform Expo React Native.

## Prasyarat

- Node.js LTS
- npm atau yarn
- Expo CLI (`npm i -g expo`)
- Akun Firebase (Firestore, Auth, Storage)

## Menjalankan secara lokal

```bash
# install dependencies
npm install

# jalankan app
npx expo start
```

Scan QR di Expo Go (Android/iOS) atau jalankan di emulator.

## Konfigurasi Firebase

Letakkan konfigurasi Firebase di `config/firebase.js` (web) dan file pendukung lainnya sesuai struktur saat ini. Pastikan kredensial tidak dikomit: gunakan file `.env` bila perlu.

## Build

- Development build: gunakan EAS Build (opsional)
- Produksi: sesuaikan dengan kebutuhan, karena project saat ini fokus pada Expo managed workflow

## Struktur Proyek (ringkas)

- `Pages/` halaman role (admin, guru, murid, dsb)
- `components/` komponen UI dan utilitas
- `services/` akses data dan integrasi Firebase
- `context/` konteks React (user, notifikasi, aktivitas)
- `scripts/` skrip utilitas Node untuk administrasi data

## Kontribusi

1. Fork/clone
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit: `git commit -m "feat: deskripsi singkat"`
4. Push dan buka Pull Request

## Lisensi

Hak cipta pemilik repository. Lihat ketentuan internal proyek.

## Repository

Repository GitHub: https://github.com/KDSdev94/E-SkuulTime.git
