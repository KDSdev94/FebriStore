/**
 * Script untuk menjalankan update nama toko pada produk
 * Jalankan dengan: node runUpdateStoreNames.js
 */

// Import required modules
import { updateProductStoreNames } from './scripts/updateProductStoreNames.js';

// Main function
async function main() {
  console.log('=== Update Product Store Names ===');
  console.log('Starting update process...\n');
  
  try {
    const result = await updateProductStoreNames();
    
    if (result.success) {
      console.log('\n✅ Update completed successfully!');
      console.log(`📊 ${result.message}`);
      
      if (result.updatedCount > 0) {
        console.log(`\n🎉 ${result.updatedCount} products have been updated with proper store names.`);
      }
      
      if (result.errorCount > 0) {
        console.log(`\n⚠️  ${result.errorCount} products had errors during update.`);
      }
    } else {
      console.log('\n❌ Update failed:');
      console.log(result.error);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
  }
  
  console.log('\n=== Update Process Complete ===');
}

// Run the script
main().catch(console.error);