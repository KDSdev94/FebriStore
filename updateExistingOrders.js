/**
 * Script untuk memperbarui order yang sudah ada dengan nama toko yang konsisten
 * Jalankan dengan: node updateExistingOrders.js
 */

import { updateOrderStoreNames } from './scripts/updateOrderStoreNames.js';

console.log('🚀 Memulai update order yang sudah ada...\n');

updateOrderStoreNames()
  .then(result => {
    if (result.success) {
      console.log('✅ Update berhasil!');
      console.log(`📊 ${result.message}`);
      
      if (result.updatedCount > 0) {
        console.log(`\n🎉 ${result.updatedCount} order telah diperbarui dengan nama toko yang konsisten.`);
        console.log('📝 Sekarang semua order akan menampilkan nama toko yang sama dengan detail produk.');
      }
      
      if (result.errorCount > 0) {
        console.log(`\n⚠️  ${result.errorCount} order mengalami error saat update.`);
      }
      
      console.log('\n💡 Perubahan yang dilakukan:');
      console.log('- Field storeName ditambahkan/diperbarui di setiap item order');
      console.log('- Nama toko di detail pesanan sekarang konsisten dengan detail produk');
      console.log('- Backward compatibility tetap terjaga dengan field sellerName');
      
    } else {
      console.log('❌ Update gagal:');
      console.log(result.error);
    }
  })
  .catch(error => {
    console.error('💥 Error tidak terduga:', error);
  })
  .finally(() => {
    console.log('\n=== Update Selesai ===');
  });