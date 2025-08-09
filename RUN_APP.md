# 🚀 Cara Menjalankan Febri Store

## 📋 Prerequisites

Pastikan Anda sudah menginstall:
1. **Node.js** (versi 16 atau lebih baru)
2. **npm** atau **yarn**
3. **Expo CLI**: `npm install -g @expo/cli`
4. **Expo Go** app di smartphone (untuk testing)

## 🔧 Setup Project

### 1. Install Dependencies
```bash
cd "C:\Users\Administrator\Downloads\Febri\Ecommerce"
npm install
```

### 2. Setup Firebase
- Ikuti instruksi di `FIREBASE_SETUP.md`
- Pastikan Firebase project sudah dikonfigurasi
- Enable Authentication dan Firestore

### 3. Jalankan Aplikasi
```bash
npm start
# atau
npx expo start
```

## 📱 Testing di Device

### Menggunakan Expo Go (Recommended untuk Development)
1. Install **Expo Go** dari Play Store/App Store
2. Jalankan `npm start`
3. Scan QR code yang muncul di terminal/browser
4. Aplikasi akan terbuka di Expo Go

### Menggunakan Android Emulator
1. Install Android Studio
2. Setup Android emulator
3. Jalankan emulator
4. Jalankan `npm start`
5. Tekan 'a' untuk membuka di Android emulator

### Menggunakan iOS Simulator (Mac only)
1. Install Xcode
2. Jalankan `npm start`
3. Tekan 'i' untuk membuka di iOS simulator

## 🧪 Testing Accounts

Gunakan akun berikut untuk testing:

**Admin:**
- Email: admin@febristore.com
- Password: admin123

**Customer:**
- Email: customer@example.com  
- Password: customer123

## 🔍 Troubleshooting

### Error: "Module not found"
```bash
npm install
npx expo install --fix
```

### Error: "Firebase not configured"
- Pastikan `firebaseConfig.js` sudah benar
- Cek Firebase Console apakah project sudah setup
- Pastikan Authentication dan Firestore sudah enabled

### Error: "Expo CLI not found"
```bash
npm install -g @expo/cli
```

### Error: "Metro bundler issues"
```bash
npx expo start --clear
```

## 📦 Build untuk Production

### Android APK (Development)
```bash
npx expo build:android -t apk
```

### Android App Bundle (Production)
```bash
npx expo build:android -t app-bundle
```

### iOS (Mac only)
```bash
npx expo build:ios
```

## 🌐 Web Version
```bash
npx expo start --web
```

## 📁 Struktur Project

```
Febri Store/
├── assets/                 # Images, icons
├── components/             # Reusable components
├── contexts/               # React contexts
├── navigation/             # Navigation setup
├── screens/                # App screens
├── services/               # API services
├── utils/                  # Utilities & constants
├── App.js                  # Root component
├── firebaseConfig.js       # Firebase config
└── package.json
```

## 🎯 Features Checklist

- ✅ Authentication (Login/Register)
- ✅ Product catalog with categories
- ✅ Shopping cart functionality
- ✅ Wishlist feature
- ✅ User profile management
- ✅ Search functionality
- ✅ Responsive design
- ✅ Firebase integration

## 📞 Support

Jika mengalami masalah:
1. Cek console untuk error messages
2. Pastikan semua dependencies terinstall
3. Restart Metro bundler: `npx expo start --clear`
4. Cek Firebase Console untuk backend issues

## 🔄 Development Workflow

1. **Start development server**: `npm start`
2. **Make changes** to code
3. **Hot reload** akan otomatis refresh app
4. **Test** di device/emulator
5. **Commit** changes ke git
6. **Build** untuk production saat siap

Happy coding! 🎉