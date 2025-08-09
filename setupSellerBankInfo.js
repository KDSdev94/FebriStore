import { createSampleSellers } from './scripts/createSampleSellers.js';
import { addSellerBankInfo } from './scripts/addSellerBankInfo.js';

const setupSellerBankInfo = async () => {
  try {
    console.log('🚀 Setting up seller bank information...\n');
    
    // Step 1: Create sample sellers if they don't exist
    console.log('Step 1: Creating sample sellers...');
    const createResult = await createSampleSellers();
    
    if (createResult.success) {
      console.log(`✅ Created ${createResult.count} new sellers\n`);
    } else {
      console.log(`⚠️  Seller creation result: ${createResult.error}\n`);
    }
    
    // Step 2: Add bank information to existing sellers
    console.log('Step 2: Adding bank information to existing sellers...');
    const bankResult = await addSellerBankInfo();
    
    if (bankResult.success) {
      console.log(`✅ Updated ${bankResult.count} sellers with bank information\n`);
    } else {
      console.log(`❌ Bank info update failed: ${bankResult.error}\n`);
    }
    
    console.log('🎉 Setup completed! Sellers now have bank account information for admin order details.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
};

// Run the setup
setupSellerBankInfo();