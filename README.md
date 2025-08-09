# Febri Store - Aplikasi E-commerce Mobile

Aplikasi e-commerce mobile yang dibangun dengan React Native dan Expo, menggunakan Firebase sebagai backend.

## 🚀 Fitur Utama

### Autentikasi
- Login dan Register
- Logout
- Manajemen profil pengguna

### Produk & Katalog
- Tampilan beranda dengan produk unggulan
- Kategori produk
- Pencarian produk
- Detail produk dengan rating dan ulasan
- Sistem diskon dan harga promo

### Keranjang Belanja
- Tambah/hapus produk ke keranjang
- Update kuantitas produk
- Kalkulasi total harga
- Persistent cart (tersimpan di local storage)

### Wishlist
- Tambah/hapus produk ke wishlist
- Lihat semua produk wishlist
- Tambah semua produk wishlist ke keranjang

### Profil & Pengaturan
- Edit profil pengguna
- Pengaturan notifikasi
- Mode gelap/terang
- Riwayat pesanan
- Kelola alamat pengiriman

## 🛠️ Teknologi yang Digunakan

- **React Native** - Framework mobile
- **Expo** - Development platform
- **React Navigation** - Navigasi aplikasi
- **Firebase** - Backend dan database
- **AsyncStorage** - Local storage
- **Expo Vector Icons** - Icon library
- **React Native Paper** - UI components

## 📱 Struktur Aplikasi

```
Febri Store/
├── assets/                 # Gambar, icon, dan asset lainnya
├── components/             # Komponen yang dapat digunakan kembali
│   └── ProductCard.js
├── contexts/               # Context providers
│   ├── AuthContext.js
│   ├── CartContext.js
│   └── WishlistContext.js
├── navigation/             # Konfigurasi navigasi
│   └── MainNavigator.js
├── screens/                # Screen/halaman aplikasi
│   ├── LoadingScreen.js
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── HomeScreen.js
│   ├── CategoriesScreen.js
│   ├── CartScreen.js
│   ├── WishlistScreen.js
│   └── ProfileScreen.js
├── services/               # Service untuk API calls
├── utils/                  # Utility functions dan constants
│   └── constants.js
├── App.js                  # Root component
├── firebaseConfig.js       # Konfigurasi Firebase
└── package.json
```

## 🎨 Design System

### Warna
- **Primary**: #4A90E2 (Biru)
- **Secondary**: #50C878 (Hijau)
- **Accent**: #FF6B6B (Merah)
- **Background**: #F8FAFC (Abu-abu terang)
- **Card**: #FFFFFF (Putih)
- **Text**: #2D3748 (Abu-abu gelap)

### Typography
- **H1**: 32px, Bold
- **H2**: 28px, Bold
- **H3**: 24px, SemiBold
- **H4**: 20px, SemiBold
- **Body1**: 16px, Regular
- **Body2**: 14px, Regular
- **Caption**: 12px, Regular

## 🚀 Instalasi dan Setup

1. **Clone repository**
   ```bash
   git clone [repository-url]
   cd febri-store
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Firebase**
   - Buat project baru di Firebase Console
   - Enable Authentication dan Firestore
   - Copy konfigurasi Firebase ke `firebaseConfig.js`

4. **Jalankan aplikasi**
   ```bash
   npm start
   ```

## 📋 Konfigurasi Firebase

Update file `firebaseConfig.js` dengan konfigurasi Firebase Anda:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 🗃️ Struktur Database Firestore

### Collection: users
```javascript
{
  id: "user-id",
  fullName: "Nama Lengkap",
  email: "email@example.com",
  phone: "+62xxxxxxxxxx",
  password: "hashed-password",
  role: "customer",
  createdAt: "2024-01-01T00:00:00.000Z",
  isActive: true
}
```

### Collection: products
```javascript
{
  id: "product-id",
  name: "Nama Produk",
  description: "Deskripsi produk",
  price: 100000,
  originalPrice: 150000,
  discount: 33,
  image: "https://example.com/image.jpg",
  category: "electronics",
  rating: 4.5,
  reviews: 128,
  stock: 50,
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Pengembangan

### Menambah Screen Baru
1. Buat file screen di folder `screens/`
2. Import dan tambahkan ke navigator di `App.js` atau `MainNavigator.js`
3. Tambahkan styling sesuai design system

### Menambah Context Baru
1. Buat file context di folder `contexts/`
2. Wrap aplikasi dengan provider di `App.js`
3. Gunakan hook di komponen yang membutuhkan

### Menambah Komponen
1. Buat file komponen di folder `components/`
2. Export default komponen
3. Import dan gunakan di screen yang membutuhkan

## 📱 Platform Support

- ✅ Android
- ✅ iOS
- ✅ Web (Expo Web)

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Kontak

Febri Store Team - febristore@example.com

Project Link: [https://github.com/febristore/mobile-app](https://github.com/febristore/mobile-app)

---

**Dibuat dengan ❤️ menggunakan React Native & Expo**