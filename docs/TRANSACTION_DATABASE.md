# Database Transaksi - Dokumentasi

## Overview
Dokumentasi ini menjelaskan struktur database untuk manajemen transaksi admin di aplikasi Febri Store.

## Collection: `orders`

### Fields Utama untuk Transaksi

#### Status Verifikasi Admin
- **adminVerificationStatus**: `string`
  - `"pending"` - Menunggu verifikasi admin
  - `"approved"` - Disetujui admin
  - `"rejected"` - Ditolak admin

- **adminVerifiedAt**: `Timestamp`
  - Waktu ketika admin memverifikasi pembayaran

- **adminVerifiedBy**: `string`
  - User ID admin yang melakukan verifikasi

- **adminNotes**: `string`
  - Catatan admin saat verifikasi

- **adminRejectionReason**: `string`
  - Alasan penolakan jika status = "rejected"

#### Status Transfer ke Seller
- **sellerTransferStatus**: `string`
  - `"pending"` - Menunggu transfer ke seller
  - `"completed"` - Transfer sudah selesai
  - `"not_applicable"` - Tidak perlu transfer (belum selesai/ditolak)

- **sellerTransferCompletedAt**: `Timestamp`
  - Waktu ketika admin menandai transfer selesai

- **sellerTransferCompletedBy**: `string`
  - User ID admin yang menandai transfer selesai

#### Identifikasi Order
- **orderNumber**: `string`
  - Nomor order yang mudah dibaca (contoh: #ABC12345)

- **updatedAt**: `Timestamp`
  - Waktu terakhir order diupdate

### Fields yang Sudah Ada (digunakan untuk transaksi)
- **id**: Document ID
- **userId**: ID pembeli
- **sellerId**: ID penjual
- **totalAmount**: Total pembayaran
- **status**: Status order umum
- **paymentStatus**: Status pembayaran
- **createdAt**: Waktu pembuatan order

## Filter Transaksi

### 1. Semua
Menampilkan semua transaksi tanpa filter

### 2. Pending Verifikasi
```javascript
adminVerificationStatus === 'pending'
```

### 3. Terverifikasi
```javascript
adminVerificationStatus === 'approved' && status !== 'completed'
```

### 4. Pending Transfer Seller
```javascript
adminVerificationStatus === 'approved' && 
status === 'completed' && 
(sellerTransferStatus === 'pending' || !sellerTransferStatus)
```

### 5. Selesai
```javascript
adminVerificationStatus === 'approved' && 
status === 'completed' && 
sellerTransferStatus === 'completed'
```

## Statistik Transaksi

### Total Pendapatan
Jumlah `totalAmount` dari semua order dengan:
- `status === 'completed'`
- `adminVerificationStatus === 'approved'`

### Pending Verifikasi
Jumlah order dengan:
- `adminVerificationStatus === 'pending'`

### Transaksi Selesai
Jumlah order dengan:
- `status === 'completed'`
- `adminVerificationStatus === 'approved'`

### Pending Transfer
Jumlah order dengan:
- `status === 'completed'`
- `adminVerificationStatus === 'approved'`
- `sellerTransferStatus === 'pending'` atau tidak ada

## Flow Transaksi

1. **Order Dibuat**
   - `adminVerificationStatus: 'pending'`
   - `sellerTransferStatus: 'not_applicable'`

2. **Admin Verifikasi Pembayaran**
   - Jika disetujui: `adminVerificationStatus: 'approved'`
   - Jika ditolak: `adminVerificationStatus: 'rejected'`

3. **Order Selesai (Delivered)**
   - `status: 'completed'`
   - `sellerTransferStatus: 'pending'` (jika sudah diverifikasi)

4. **Admin Transfer ke Seller**
   - `sellerTransferStatus: 'completed'`
   - `sellerTransferCompletedAt: timestamp`

## Inisialisasi Database

Jalankan script berikut untuk menginisialisasi database:

```bash
node scripts/initializeTransactionDatabase.js
```

Script ini akan:
- Menambahkan field yang diperlukan ke order yang sudah ada
- Mengatur status default berdasarkan data existing
- Membuat nomor order untuk order yang belum punya

## Service Functions

### transactionService.getAllTransactions()
Mengambil semua transaksi dengan informasi lengkap

### transactionService.getTransactionStats()
Mengambil statistik transaksi untuk dashboard

### transactionService.markSellerTransferCompleted(orderId, adminId)
Menandai transfer ke seller sudah selesai

### transactionService.verifyPayment(orderId, verificationData)
Memverifikasi pembayaran (approve/reject)

## Security Rules (Firestore)

Pastikan rules Firestore mengizinkan admin untuk:
- Read/write collection `orders`
- Read collection `users` untuk mendapatkan info buyer/seller

```javascript
// Contoh rule untuk admin
match /orders/{orderId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```