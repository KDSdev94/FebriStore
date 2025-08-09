/**
 * Script untuk memperbarui produk yang sudah ada dengan informasi toko yang benar
 * Jalankan dengan: node updateExistingProducts.js
 */

import { updateProductStoreNames } from './scripts/updateProductStoreNames.js';

console.log('🚀 Memulai update produk yang sudah ada...\n');

updateProductStoreNames()
  .then(result => {
    if (result.success) {
      console.log('✅ Update berhasil!');
      console.log(`📊 ${result.message}`);
      
      if (result.updatedCount > 0) {
        console.log(`\n🎉 ${result.updatedCount} produk telah diperbarui dengan nama toko yang benar.`);
        console.log('📝 Sekarang semua produk akan menampilkan nama toko sesuai dengan data seller.');
      }
      
      if (result.errorCount > 0) {
        console.log(`\n⚠️  ${result.errorCount} produk mengalami error saat update.`);
      }
      
      console.log('\n💡 Tips:');
      console.log('- Seller dapat mengatur nama toko di menu "Profil Toko"');
      console.log('- Jika seller belum mengatur nama toko, akan otomatis menggunakan "Toko [Nama User]"');
      console.log('- Perubahan nama toko akan otomatis memperbarui semua produk seller tersebut');
      
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