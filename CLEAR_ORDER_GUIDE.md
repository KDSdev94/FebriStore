# Panduan Menghapus Data Pesanan

## 🗑️ Cara Menghapus Semua Data Pesanan

### **Metode 1: Melalui Admin Dashboard (Recommended)**

1. **Login sebagai Admin**
   - Buka aplikasi
   - Login dengan akun admin

2. **Buka Dashboard Admin**
   - Navigasi ke Dashboard Admin
   - Scroll ke bawah hingga menemukan section "Update Data Toko"

3. **Hapus Data Pesanan**
   - Klik tombol **"Hapus Semua Pesanan"** (tombol merah)
   - Konfirmasi dengan klik **"Ya, Hapus Semua"**
   - Tunggu proses selesai

4. **Konfirmasi Berhasil**
   - Akan muncul alert konfirmasi
   - Data pesanan telah terhapus dari sistem

### **Metode 2: Manual melalui Code (Developer)**

Jika Anda developer dan ingin menghapus data secara manual:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hapus semua data pesanan
await AsyncStorage.removeItem('orders');
console.log('Data pesanan berhasil dihapus');
```

## ✅ Manfaat Menghapus Data Pesanan

### **1. Sistem Lebih Bersih**
- Tidak ada data pesanan lama yang menggunakan format berbeda
- Performa aplikasi lebih optimal

### **2. Testing Lebih Mudah**
- Mulai dengan data fresh
- Tidak ada konflik dengan data lama
- Testing fitur baru lebih akurat

### **3. Konsistensi Data**
- Pesanan baru akan menggunakan format terbaru
- Nama toko akan konsisten dengan sistem baru
- Tidak ada data yang corrupt atau tidak sesuai

### **4. Troubleshooting**
- Mengatasi masalah data yang tidak konsisten
- Memperbaiki error yang disebabkan format data lama

## ⚠️ Hal yang Perlu Diperhatikan

### **Sebelum Menghapus:**
- ✅ Pastikan tidak ada pesanan penting yang perlu disimpan
- ✅ Backup data jika diperlukan
- ✅ Informasikan ke tim jika ini adalah sistem production

### **Setelah Menghapus:**
- ✅ Pesanan baru akan menggunakan format terbaru
- ✅ Nama toko akan konsisten di semua pesanan
- ✅ Sistem siap untuk testing dengan data fresh

## 🔄 Proses yang Terjadi

### **Ketika Data Dihapus:**
1. AsyncStorage key 'orders' dihapus
2. Semua data pesanan hilang dari aplikasi
3. Counter pesanan reset ke 0
4. History pesanan kosong

### **Ketika Pesanan Baru Dibuat:**
1. Menggunakan format data terbaru
2. Nama toko sesuai dengan sistem baru
3. Konsistensi dengan detail produk
4. Field `storeName` tersedia

## 🎯 Kapan Perlu Menghapus Data

### **Situasi yang Memerlukan Clear Data:**
- ✅ Setelah update sistem nama toko
- ✅ Ketika ada perubahan format data pesanan
- ✅ Untuk testing fitur baru
- ✅ Mengatasi bug data yang tidak konsisten
- ✅ Reset sistem untuk demo

### **Situasi yang TIDAK Perlu Clear Data:**
- ❌ Sistem berjalan normal
- ❌ Hanya update kecil pada UI
- ❌ Data pesanan masih valid dan konsisten

## 🚀 Setelah Clear Data

### **Langkah Selanjutnya:**
1. **Test Pesanan Baru**
   - Buat pesanan baru
   - Cek nama toko di detail pesanan
   - Pastikan konsisten dengan detail produk

2. **Verifikasi Sistem**
   - Cek semua fitur pesanan berfungsi
   - Pastikan tidak ada error
   - Test flow checkout lengkap

3. **Monitoring**
   - Pantau performa aplikasi
   - Cek log error
   - Pastikan sistem stabil

## 📱 Interface Admin

Tombol yang tersedia di Admin Dashboard:

| Tombol | Warna | Fungsi |
|--------|-------|--------|
| Update Produk | Biru | Update nama toko di produk |
| Update Pesanan | Hijau | Update format pesanan lama |
| **Hapus Semua Pesanan** | **Merah** | **Hapus semua data pesanan** |
| Update Semua | Orange | Update produk + pesanan |

## 🎉 Kesimpulan

Menghapus data pesanan adalah langkah yang baik untuk:
- ✅ Memastikan konsistensi sistem baru
- ✅ Menghilangkan data lama yang tidak sesuai
- ✅ Memulai fresh dengan format terbaru
- ✅ Mempermudah testing dan development

**Sistem siap untuk pesanan baru dengan nama toko yang konsisten!** 🚀