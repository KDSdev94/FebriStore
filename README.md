# FebriStore - E-Commerce Mobile App

<div align="center">
  <img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
</div>

## 📱 Tentang Aplikasi

FebriStore adalah aplikasi mobile e-commerce yang dibangun menggunakan Expo React Native. Aplikasi ini menyediakan platform lengkap untuk toko online dengan fitur-fitur modern dan user-friendly interface.

### ✨ Fitur Utama

- 🔐 **Multi-Role System**: Admin, Seller, dan Buyer
- 🏪 **Store Management**: Kelola toko dan profil seller
- 📦 **Product Management**: CRUD produk dengan kategori
- 🛒 **Shopping Cart**: Keranjang belanja dengan wishlist
- 💳 **Checkout System**: Proses pembelian yang mudah
- 📍 **Address Management**: Kelola alamat pengiriman
- 📋 **Order Tracking**: Lacak status pesanan
- 📊 **Revenue Analytics**: Dashboard admin dengan statistik
- 🔔 **Notifications**: Sistem notifikasi real-time
- 🔑 **Authentication**: Login/Register dengan Firebase Auth

## 🚀 Quick Start

### Prasyarat

- Node.js LTS (v16 atau lebih baru)
- npm atau yarn
- Expo CLI (`npm install -g @expo/cli`)
- Akun Firebase (Firestore, Auth, Storage)
- Android Studio / Xcode (untuk emulator)

### Instalasi

```bash
# Clone repository
git clone https://github.com/KDSdev94/E-SkuulTime.git
cd "EXPO Ecommerce"

# Install dependencies
npm install

# Jalankan aplikasi
npx expo start
```

### Menjalankan di Device

1. **Android/iOS**: Scan QR code dengan Expo Go app
2. **Emulator**: Tekan `a` untuk Android atau `i` untuk iOS
3. **Web**: Tekan `w` untuk membuka di browser

## ⚙️ Konfigurasi

### Firebase Setup

1. Buat project Firebase baru
2. Enable Authentication, Firestore, dan Storage
3. Download google-services.json dan letakkan di root project
4. Update konfigurasi di `firebaseConfig.js`

```javascript
// firebaseConfig.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

## 📁 Struktur Proyek

```
📱 FebriStore
├── 🧩 components/          # Komponen UI reusable
├── 🔄 contexts/           # React Context providers
├── 🧭 navigation/         # Navigasi aplikasi
├── 📱 screens/           # Layar aplikasi
│   ├── 👨‍💼 admin/         # Layar admin
│   ├── 🛒 buyer/         # Layar pembeli
│   └── 🏪 seller/        # Layar penjual
├── 🔧 services/          # Service layer & API calls
├── 📜 scripts/           # Utility scripts
├── 🛠️ utils/             # Helper functions
├── 🎨 assets/            # Gambar, font, dll
├── 🚀 App.js             # Entry point
├── 🔥 firebaseConfig.js  # Konfigurasi Firebase
└── 📦 package.json       # Dependencies
```

## 📜 Scripts Tersedia

```bash
# Development
npm start              # Jalankan Expo dev server
npm run android        # Jalankan di Android
npm run ios            # Jalankan di iOS
npm run web            # Jalankan di web browser

# Database Management
node clearAllOrders.js           # Hapus semua order
node setupSellerBankInfo.js      # Setup info bank seller
node updateExistingProducts.js   # Update produk existing
```

## 📸 Screenshots

_Tambahkan screenshot aplikasi di sini_

## 🤝 Contributing

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feature/amazing-feature`
3. Commit perubahan: `git commit -m 'Add amazing feature'`
4. Push ke branch: `git push origin feature/amazing-feature`
5. Buka Pull Request

## 📄 License

Hak cipta © 2024 FebriStore. All rights reserved.

---

<div align="center">
  <p>Made with ❤️ by FebriStore Team</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
