# Update Statistik Pendapatan - Seller & Admin

## Perubahan yang Dilakukan

### 1. **Statistik Pendapatan Seller** (SellerStoreProfileScreen.js)

#### Fitur Baru:
- **Total Pendapatan**: Pendapatan seller setelah dikurangi biaya admin (1.5%)
- **Pendapatan Bulan Ini**: Pendapatan seller untuk bulan berjalan
- **Pesanan Selesai**: Jumlah pesanan yang sudah delivered
- **Rata-rata Nilai Pesanan**: Average order value untuk seller

#### Perubahan File:
- `screens/seller/SellerStoreProfileScreen.js`: Menambahkan section statistik pendapatan
- `services/orderService.js`: Menambahkan fungsi `getSellerRevenueStats()`

#### Tampilan:
```
┌─────────────────────────────────────┐
│ Statistik Pendapatan                │
├─────────────────┬───────────────────┤
│ Total Pendapatan│ Pendapatan Bulan  │
│ Rp 2.500.000    │ Rp 450.000        │
├─────────────────┼───────────────────┤
│ Pesanan Selesai │ Rata-rata Pesanan │
│ 25              │ Rp 100.000        │
└─────────────────┴───────────────────┘
```

### 2. **Statistik Pendapatan Admin** (AdminDashboardScreen.js)

#### Fitur Baru:
- **Total Pendapatan Admin**: Pendapatan dari biaya admin 1.5%
- **Pendapatan Bulan Ini**: Pendapatan admin bulan berjalan
- **Total Nilai Transaksi**: Total nilai semua transaksi
- **Info Card**: Penjelasan sumber pendapatan admin

#### Perubahan File:
- `screens/admin/AdminDashboardScreen.js`: Update section statistik pendapatan
- `services/adminService.js`: Update fungsi `getDashboardStats()`

### 3. **Screen Statistik Pendapatan Admin Detail** (AdminRevenueStatsScreen.js)

#### Fitur Baru:
- **Pendapatan Periode**: Harian, mingguan, bulanan
- **Statistik Transaksi**: Total nilai transaksi, jumlah transaksi selesai
- **Chart 12 Bulan**: Grafik pendapatan admin 12 bulan terakhir
- **Info Lengkap**: Penjelasan detail sistem pendapatan

#### File Baru:
- `screens/admin/AdminRevenueStatsScreen.js`: Screen detail statistik pendapatan
- `services/adminService.js`: Fungsi `getAdminRevenueStats()`
- `navigation/AdminStackNavigator.js`: Route baru untuk AdminRevenueStats

#### Tampilan:
```
┌─────────────────────────────────────┐
│ Statistik Pendapatan Admin          │
├─────────────────────────────────────┤
│ Total Pendapatan Admin              │
│ Rp 37.500 (dari biaya admin 1.5%)  │
├─────────────────┬───────────────────┤
│ Bulan Ini       │ Minggu Ini        │
│ Rp 6.750        │ Rp 1.500          │
├─────────────────┴───────────────────┤
│ Hari Ini: Rp 225                    │
├─────────────────────────────────────┤
│ Chart 12 Bulan Terakhir             │
│ [Bar Chart]                         │
└─────────────────────────────────────┘
```

## Logika Perhitungan

### Seller Revenue:
```javascript
const orderTotal = order.totalAmount;
const adminFee = order.adminFee || Math.round(orderTotal * 0.015); // 1.5%
const sellerRevenue = orderTotal - adminFee;
```

### Admin Revenue:
```javascript
const adminFee = order.adminFee || Math.round(orderTotal * 0.015); // 1.5%
// Hanya dari pesanan yang sudah selesai/delivered
```

## Fitur Tambahan

### 1. **Format Mata Uang**
- Menggunakan format Rupiah Indonesia (IDR)
- Tanpa desimal untuk kemudahan baca

### 2. **Refresh Data**
- Pull-to-refresh di semua screen statistik
- Auto-reload saat screen focus

### 3. **Navigasi**
- Tap pada card statistik untuk melihat detail
- Breadcrumb navigation yang jelas

### 4. **Responsive Design**
- Grid layout yang responsive
- Chart horizontal scroll untuk mobile

## Testing

### Test Seller Stats:
1. Login sebagai seller
2. Buka Profil Toko
3. Verifikasi statistik pendapatan muncul
4. Tap untuk refresh data

### Test Admin Stats:
1. Login sebagai admin
2. Buka Dashboard
3. Verifikasi section "Statistik Pendapatan Admin"
4. Tap card untuk buka detail
5. Verifikasi chart dan info lengkap

## Database Impact

### Tidak Ada Perubahan Schema:
- Menggunakan field yang sudah ada
- Perhitungan dilakukan real-time
- Tidak perlu migrasi data

### Performance:
- Optimized query untuk statistik
- Caching di level aplikasi
- Minimal database calls

## Security

### Access Control:
- Seller hanya bisa lihat statistik sendiri
- Admin bisa lihat semua statistik
- Validasi user role di service layer

### Data Privacy:
- Seller tidak bisa lihat pendapatan seller lain
- Admin fee calculation transparan
- Audit trail untuk semua perhitungan