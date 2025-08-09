# Test Payment Verification System

## Alur Status Pesanan yang Diperbaiki

### 1. Status Awal
- **pending_payment**: Pesanan dibuat, menunggu pembayaran dari customer

### 2. Customer Upload Bukti Pembayaran
- Customer upload bukti pembayaran melalui OrderDetailScreen
- Status otomatis berubah ke **pending_verification**
- Notifikasi: "Bukti pembayaran berhasil diupload. Status pesanan telah diperbarui menjadi 'Menunggu Verifikasi Admin'. Admin akan memverifikasi pembayaran Anda."

### 3. Admin Verifikasi
- Admin dapat melihat pesanan dengan status **pending_verification** di AdminOrdersScreen
- Admin dapat melihat bukti pembayaran di AdminOrderDetailScreen
- Admin dapat:
  - **Konfirmasi Pembayaran**: Status berubah ke **payment_confirmed**, stok produk dikurangi
  - **Tolak Pembayaran**: Status kembali ke **pending_payment**

### 4. Status Selanjutnya
- **payment_confirmed**: Pembayaran dikonfirmasi, siap diproses
- **processing**: Pesanan sedang disiapkan
- **shipped**: Pesanan dikirim
- **delivered**: Pesanan selesai

## Fitur yang Ditambahkan

### OrderService
- `updatePaymentProof()`: Mengubah status ke pending_verification saat upload bukti
- `verifyPayment()`: Admin verifikasi pembayaran (approve/reject)

### OrderContext
- `verifyPayment()`: Wrapper function untuk admin verifikasi
- Status mapping untuk **pending_verification**

### OrderDetailScreen (Customer)
- Upload bukti pembayaran mengubah status ke pending_verification
- Tracking steps ditambah step verifikasi
- Status pembayaran menampilkan "Menunggu Verifikasi Admin"

### AdminOrderDetailScreen
- Section verifikasi pembayaran untuk status pending_verification
- Modal konfirmasi dengan input catatan
- Tombol Konfirmasi/Tolak pembayaran
- Status badge yang sesuai

### AdminOrdersScreen
- Filter "Perlu Verifikasi" untuk status pending_verification
- Counter untuk pesanan yang perlu verifikasi

## Testing Steps

### Test 1: Customer Upload Bukti Pembayaran
1. Login sebagai customer
2. Buat pesanan dengan metode transfer bank
3. Buka OrderDetailScreen
4. Upload bukti pembayaran
5. Verifikasi status berubah ke "Menunggu Verifikasi Admin"

### Test 2: Admin Verifikasi Pembayaran
1. Login sebagai admin
2. Buka AdminOrdersScreen
3. Pilih filter "Perlu Verifikasi"
4. Buka detail pesanan dengan status pending_verification
5. Lihat bukti pembayaran
6. Konfirmasi atau tolak pembayaran
7. Verifikasi status berubah sesuai aksi

### Test 3: Alur Lengkap
1. Customer upload bukti → pending_verification
2. Admin konfirmasi → payment_confirmed
3. Admin ubah status → processing → shipped → delivered

## Database Schema Updates

### Orders Collection
```javascript
{
  // ... existing fields
  status: 'pending_verification', // New status
  paymentStatus: 'proof_uploaded', // New field
  adminVerificationStatus: 'pending', // pending/approved/rejected
  adminVerificationAt: timestamp,
  adminNotes: 'string',
  paymentConfirmedAt: timestamp
}
```

## UI/UX Improvements

1. **Clear Status Communication**: Customer tahu kapan bukti diupload dan menunggu verifikasi
2. **Admin Dashboard**: Filter khusus untuk pesanan yang perlu verifikasi
3. **Visual Feedback**: Status badge dan icon yang jelas
4. **Verification Modal**: Admin dapat menambah catatan saat verifikasi
5. **Image Preview**: Admin dapat melihat bukti pembayaran dalam ukuran penuh

## Error Handling

1. Upload bukti pembayaran gagal
2. Verifikasi pembayaran gagal
3. Network error saat update status
4. Invalid image format/size

## Security Considerations

1. Hanya admin yang dapat verifikasi pembayaran
2. Bukti pembayaran hanya dapat diupload oleh pemilik pesanan
3. Status history untuk audit trail
4. Validasi image format dan size