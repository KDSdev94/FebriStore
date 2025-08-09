/**
 * Script untuk menghapus semua data order
 * Jalankan dengan: node clearAllOrders.js
 */

import { clearOrdersWithSummary } from './scripts/clearOrderData.js';

console.log('🗑️  Memulai penghapusan data pesanan...\n');

clearOrdersWithSummary()
  .then(result => {
    if (result.success) {
      console.log('✅ Penghapusan berhasil!');
      console.log(`📊 ${result.message}`);
      
      if (result.clearedCount > 0) {
        console.log(`\n🎉 ${result.clearedCount} pesanan telah dihapus dari sistem.`);
        console.log('📝 Sekarang sistem bersih dari data pesanan lama.');
      } else {
        console.log('\n💡 Tidak ada pesanan yang perlu dihapus (sudah kosong).');
      }
      
      console.log('\n🔄 Manfaat penghapusan data pesanan:');
      console.log('- Sistem lebih bersih dan ringan');
      console.log('- Testing lebih mudah dengan data fresh');
      console.log('- Tidak ada konflik dengan format data lama');
      console.log('- Pesanan baru akan menggunakan format terbaru');
      
    } else {
      console.log('❌ Penghapusan gagal:');
      console.log(result.error);
    }
  })
  .catch(error => {
    console.error('💥 Error tidak terduga:', error);
  })
  .finally(() => {
    console.log('\n=== Penghapusan Selesai ===');
  });