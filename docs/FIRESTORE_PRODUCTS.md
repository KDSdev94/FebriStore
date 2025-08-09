# 🔥 Implementasi Firestore untuk Produk

## 📋 **Struktur Database Firestore**

### Collection: `products`
```javascript
{
  id: "auto-generated-id",
  name: "Nama Produk",
  description: "Deskripsi produk",
  price: 25000,
  stock: 50,
  category: "Makanan & Minuman",
  image: "https://example.com/image.jpg",
  
  // Informasi Seller & Toko
  sellerId: "user-id-seller",
  storeName: "Nama Toko",
  storeCity: "Jakarta",
  storeAddress: "Alamat lengkap toko",
  storePhone: "081234567890",
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: true,
  
  // Statistik
  views: 0,
  sold: 0,
  rating: 0,
  reviewCount: 0
}
```

## 🛠️ **Service Functions (productService.js)**

### ✅ **Fungsi yang Tersedia:**

1. **`addProduct(productData, sellerId, storeInfo)`**
   - Menambah produk baru ke Firestore
   - Otomatis menambahkan informasi toko dari seller

2. **`updateProduct(productId, productData, storeInfo)`**
   - Mengupdate produk yang sudah ada
   - Memperbarui informasi toko jika ada perubahan

3. **`deleteProduct(productId)`**
   - Menghapus produk dari Firestore

4. **`getProductsBySeller(sellerId)`**
   - Mengambil semua produk milik seller tertentu
   - Diurutkan berdasarkan tanggal dibuat (terbaru)

5. **`getAllProducts()`**
   - Mengambil semua produk aktif
   - Untuk ditampilkan di HomeScreen pembeli

6. **`getProductsByCategory(category)`**
   - Mengambil produk berdasarkan kategori
   - Untuk filter kategori

7. **`getProductById(productId)`**
   - Mengambil detail produk berdasarkan ID

8. **`searchProducts(searchQuery)`**
   - Mencari produk berdasarkan nama, deskripsi, kategori, atau nama toko

9. **`incrementViews(productId)`**
   - Menambah jumlah views produk

## 📱 **Screen yang Sudah Terintegrasi**

### 1. **EditProductScreen**
- ✅ Update produk ke Firestore
- ✅ Delete produk dari Firestore
- ✅ Validasi input
- ✅ Loading states
- ✅ Error handling

### 2. **AddProductScreen**
- ✅ Tambah produk baru ke Firestore
- ✅ Kategori dari constants
- ✅ Validasi input
- ✅ Loading states
- ✅ Error handling

### 3. **SellerProductsScreen**
- ✅ Load produk seller dari Firestore
- ✅ Delete produk
- ✅ Refresh data
- ✅ Loading states

### 4. **HomeScreen**
- ✅ Load semua produk dari Firestore
- ✅ Tampilkan sebagai featured products
- ✅ Refresh data

## 🏪 **Informasi Toko dalam Produk**

Setiap produk otomatis menyimpan informasi toko:

```javascript
const storeInfo = {
  storeName: user?.storeName || user?.name || 'Toko Tidak Diketahui',
  city: user?.city || '',
  address: user?.address || '',
  phone: user?.phone || ''
};
```

### **Keuntungan:**
- ✅ Pembeli bisa melihat nama toko
- ✅ Informasi kontak toko tersedia
- ✅ Lokasi toko untuk estimasi ongkir
- ✅ Branding toko yang konsisten

## 📊 **Kategori Produk**

Menggunakan kategori dari `constants.js`:

1. 🍽️ **Makanan & Minuman** - `food_beverage`
2. 💻 **Elektronik** - `electronics`
3. 👕 **Fashion** - `fashion`
4. 🏠 **Rumah & Taman** - `home`
5. ⚽ **Olahraga** - `sports`
6. 📚 **Buku** - `books`
7. 💄 **Kecantikan** - `beauty`
8. 🚗 **Otomotif** - `automotive`
9. 🧸 **Mainan** - `toys`

## 🔍 **Fitur Pencarian**

```javascript
// Mencari berdasarkan:
- Nama produk
- Deskripsi produk
- Kategori
- Nama toko
```

## 📈 **Statistik Produk**

Setiap produk memiliki statistik:
- **Views**: Jumlah kali dilihat
- **Sold**: Jumlah terjual
- **Rating**: Rating rata-rata
- **ReviewCount**: Jumlah review

## 🚀 **Cara Menambah Data Sample**

1. Import script sample:
```javascript
import { addSampleProducts } from './scripts/addSampleProducts.js';
```

2. Jalankan dengan seller ID:
```javascript
addSampleProducts('SELLER_USER_ID');
```

## 🔐 **Security Rules Firestore**

Tambahkan rules berikut di Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products collection
    match /products/{productId} {
      // Allow read for all authenticated users
      allow read: if request.auth != null;
      
      // Allow write only for the product owner
      allow write: if request.auth != null && 
                   request.auth.uid == resource.data.sellerId;
      
      // Allow create for authenticated users
      allow create: if request.auth != null && 
                    request.auth.uid == request.resource.data.sellerId;
    }
  }
}
```

## 🎯 **Next Steps**

1. **Image Upload**: Implementasi upload gambar ke Firebase Storage
2. **Product Reviews**: Sistem review dan rating
3. **Product Variants**: Variasi produk (ukuran, warna, dll)
4. **Inventory Management**: Tracking stok otomatis
5. **Analytics**: Dashboard analytics untuk seller
6. **Search Optimization**: Implementasi Algolia untuk pencarian yang lebih baik

## 🐛 **Error Handling**

Semua fungsi sudah dilengkapi dengan:
- ✅ Try-catch blocks
- ✅ User-friendly error messages
- ✅ Console logging untuk debugging
- ✅ Fallback values
- ✅ Loading states

## 📱 **User Experience**

- ✅ Loading indicators
- ✅ Success/error alerts
- ✅ Smooth navigation
- ✅ Data validation
- ✅ Consistent UI/UX
- ✅ Responsive design