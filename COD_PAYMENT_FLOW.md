# COD (Cash on Delivery) Payment Flow

## Perbedaan Alur Pembayaran

### Transfer Bank (Existing)
1. **Pembeli** → Transfer ke Admin (Subtotal + Biaya Admin Rp 1.500)
2. **Admin** → Verifikasi pembayaran
3. **Admin** → Transfer ke Seller (Subtotal - Komisi)
4. **Seller** → Kirim barang

### COD (Simplified Implementation)
1. **Pembeli** → Pesan dengan COD (Subtotal saja, GRATIS biaya admin)
2. **Seller** → Langsung proses pesanan (status: cod_confirmed)
3. **Seller** → Proses pesanan (status: cod_processing)
4. **Seller** → Kirim barang tanpa perlu nomor resi (status: cod_shipped)
5. **Seller** → Menunggu konfirmasi pembeli (tidak perlu action lagi)
6. **Pembeli** → Terima barang, bayar ke seller, klik "Pesanan Diterima" (status: cod_delivered)
7. **Seller** → Transfer komisi ke Admin (opsional, bisa diatur kemudian)

## Keuntungan COD

### Untuk Pembeli:
- ✅ GRATIS biaya admin (hemat Rp 1.500)
- ✅ Bayar setelah barang diterima (lebih aman)
- ✅ Tidak perlu repot transfer bank
- ✅ Bisa konfirmasi penerimaan pesanan di app

### Untuk Seller:
- ✅ Langsung dapat pesanan tanpa menunggu verifikasi admin
- ✅ Pembayaran langsung dari pembeli
- ✅ Proses lebih cepat

### Untuk Admin:
- ✅ Mengurangi beban verifikasi pembayaran
- ✅ Sistem lebih otomatis
- ⚠️ Komisi bisa diatur terpisah (misal bulanan)

## Status Order COD

### Status Flow COD:
1. **cod_confirmed** - Pesanan COD dikonfirmasi (langsung setelah checkout)
2. **cod_processing** - Seller mulai memproses pesanan
3. **cod_shipped** - Pesanan dikirim (seller menunggu konfirmasi pembeli)
4. **cod_delivered** - Pembeli konfirmasi terima barang & pembayaran COD selesai

### Payment Status:
- **Payment Status**: `cod_pending` (menunggu pembayaran COD)
- **Admin Verification**: `not_required` (tidak perlu verifikasi)

## UI Changes

1. **Checkout Screen**:
   - Biaya admin = Rp 0 untuk COD
   - Label "GRATIS biaya admin" untuk COD
   - Informasi jelas di pilihan metode pembayaran

2. **Order Detail Screen (Pembeli)**:
   - Status tracking khusus untuk COD
   - Informasi pembayaran COD dengan highlight gratis biaya admin
   - Tombol "Pesanan Diterima" saat status shipped/cod_shipped
   - Total pembayaran menampilkan subtotal saja (tanpa biaya admin)

3. **Seller Orders Screen**:
   - Tab "Baru" menggabungkan pesanan Transfer (pending_verification) dan COD (cod_confirmed)
   - Badge "COD" pada order item untuk membedakan dengan Transfer
   - Statistik menggabungkan status COD dan Transfer
   - Status dan warna khusus untuk COD orders

4. **Seller Order Detail Screen**:
   - Tombol aksi khusus COD: "Proses Pesanan COD", "Kirim Pesanan COD" (tanpa perlu nomor resi)
   - Status `cod_shipped`: Tampilkan card "Menunggu Konfirmasi Pembeli" (tidak ada tombol action)
   - Status text yang benar untuk COD: "COD Dikonfirmasi", "COD Diproses", "COD Dikirim", "COD Selesai"
   - TIDAK menampilkan bagian verifikasi admin untuk pesanan COD
   - TIDAK memerlukan nomor resi untuk pengiriman COD (berbeda dengan transfer bank)
   - TIDAK ada tombol "Konfirmasi Pembayaran COD" - pembeli yang konfirmasi
   - Status dan warna khusus untuk COD orders

## Implementation Files Modified

1. `screens/CheckoutScreen.js` - Dynamic admin fee & UI updates
2. `services/orderService.js` - Different status for COD orders
3. `contexts/OrderContext.js` - New COD status mapping
4. `screens/seller/SellerOrdersScreen.js` - Tab "Baru", COD badge, status text yang benar
5. `screens/seller/SellerOrderDetailScreen.js` - COD-specific action buttons & status, UI refresh setelah update
6. `screens/OrderDetailScreen.js` - COD tracking steps & payment info for buyers, tombol "Pesanan Diterima"

## Future Enhancements

1. **Seller Commission Tracking**: Sistem tracking komisi seller untuk COD
2. **COD Confirmation**: Fitur konfirmasi pembayaran COD oleh seller
3. **COD Analytics**: Laporan khusus untuk transaksi COD