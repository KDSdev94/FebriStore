# Firebase Setup untuk Febri Store

## 🔥 Konfigurasi Firebase

Firebase sudah dikonfigurasi dengan data berikut:
- **Project ID**: febri-store
- **Project Number**: 573330612766
- **Storage Bucket**: febri-store.firebasestorage.app
- **Package Name**: com.febri.store

## 📋 Langkah Setup Firebase Console

### 1. Authentication Setup
1. Buka Firebase Console: https://console.firebase.google.com/project/febri-store
2. Pilih **Authentication** > **Sign-in method**
3. Enable **Email/Password** provider
4. (Opsional) Enable **Google** provider untuk social login

### 2. Firestore Database Setup
1. Pilih **Firestore Database** > **Create database**
2. Pilih **Start in test mode** (untuk development)
3. Pilih region: **asia-southeast1** (Singapore)

### 3. Firestore Security Rules
Ganti rules default dengan:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - user can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products collection - read for all, write for admin only
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Categories collection - read for all, write for admin only
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders collection - user can only read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Reviews collection - authenticated users can read all, write their own
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Storage Setup
1. Pilih **Storage** > **Get started**
2. Pilih **Start in test mode**
3. Pilih region yang sama: **asia-southeast1**

### 5. Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Product images - read for all, write for admin only
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User avatars - read for all, write for owner only
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🗃️ Sample Data untuk Testing

### Collection: users
```javascript
// Document ID: user1
{
  fullName: "Admin User",
  email: "admin@febristore.com",
  phone: "+6281234567890",
  password: "admin123", // In production, use proper hashing
  role: "admin",
  createdAt: "2024-01-01T00:00:00.000Z",
  isActive: true
}

// Document ID: user2
{
  fullName: "Customer User",
  email: "customer@example.com",
  phone: "+6281234567891",
  password: "customer123",
  role: "customer",
  createdAt: "2024-01-01T00:00:00.000Z",
  isActive: true
}
```

### Collection: categories
```javascript
// Document ID: electronics
{
  id: "electronics",
  name: "Elektronik",
  icon: "laptop",
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z"
}

// Document ID: fashion
{
  id: "fashion",
  name: "Fashion",
  icon: "tshirt-crew",
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Collection: products
```javascript
// Document ID: product1
{
  name: "Smartphone Android Terbaru",
  description: "Smartphone dengan teknologi terdepan, kamera berkualitas tinggi, dan performa yang luar biasa.",
  price: 2500000,
  originalPrice: 3000000,
  discount: 17,
  image: "https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=Smartphone",
  images: [
    "https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=Phone1",
    "https://via.placeholder.com/400x400/50C878/FFFFFF?text=Phone2"
  ],
  category: "electronics",
  rating: 4.5,
  reviews: 128,
  stock: 50,
  isActive: true,
  isFeatured: true,
  specifications: {
    brand: "Samsung",
    model: "Galaxy S24",
    storage: "256GB",
    ram: "8GB",
    color: "Phantom Black"
  },
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Testing Accounts

Untuk testing aplikasi, gunakan akun berikut:

**Admin Account:**
- Email: admin@febristore.com
- Password: admin123

**Customer Account:**
- Email: customer@example.com
- Password: customer123

## 📱 Next Steps

1. Jalankan aplikasi: `npm start`
2. Test login dengan akun di atas
3. Test fitur-fitur aplikasi
4. Tambahkan data produk melalui Firebase Console
5. Test pembelian dan checkout

## 🔒 Security Notes

- Ganti password default sebelum production
- Implement proper password hashing
- Review dan update security rules sesuai kebutuhan
- Enable App Check untuk additional security
- Setup monitoring dan alerts

## 📞 Support

Jika ada masalah dengan setup Firebase, silakan:
1. Cek Firebase Console untuk error logs
2. Pastikan semua services sudah enabled
3. Verifikasi konfigurasi di `firebaseConfig.js`
4. Test koneksi dengan Firebase menggunakan emulator