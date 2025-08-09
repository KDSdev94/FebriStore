import { db } from '../firebaseConfig.js';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

const bankData = [
  {
    sellerBankName: 'Bank Central Asia (BCA)',
    sellerBankAccount: '1234567890',
    sellerAccountName: 'Toko Elektronik Jaya'
  },
  {
    sellerBankName: 'Bank Mandiri',
    sellerBankAccount: '2345678901',
    sellerAccountName: 'Fashion Store Central'
  },
  {
    sellerBankName: 'Bank Rakyat Indonesia (BRI)',
    sellerBankAccount: '3456789012',
    sellerAccountName: 'Gadget Corner'
  },
  {
    sellerBankName: 'Bank Negara Indonesia (BNI)',
    sellerBankAccount: '4567890123',
    sellerAccountName: 'Style Boutique'
  },
  {
    sellerBankName: 'Bank Central Asia (BCA)',
    sellerBankAccount: '5678901234',
    sellerAccountName: 'Tech World'
  },
  {
    sellerBankName: 'Bank Mandiri',
    sellerBankAccount: '6789012345',
    sellerAccountName: 'Trendy Shop'
  },
  {
    sellerBankName: 'Bank Rakyat Indonesia (BRI)',
    sellerBankAccount: '7890123456',
    sellerAccountName: 'Digital Plaza'
  },
  {
    sellerBankName: 'Bank Negara Indonesia (BNI)',
    sellerBankAccount: '8901234567',
    sellerAccountName: 'Modern Store'
  }
];

const addSellerBankInfo = async () => {
  try {
    console.log('Starting to add bank information to sellers...');
    
    // Get all users with role 'seller'
    const q = query(collection(db, 'users'), where('role', '==', 'seller'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No sellers found in database');
      return { success: false, error: 'No sellers found' };
    }

    let updateCount = 0;
    const sellers = [];
    
    snapshot.forEach((docSnap) => {
      sellers.push({ id: docSnap.id, ...docSnap.data() });
    });

    console.log(`Found ${sellers.length} sellers`);

    // Update each seller with bank information
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const bankInfo = bankData[i % bankData.length]; // Cycle through bank data
      
      try {
        const sellerRef = doc(db, 'users', seller.id);
        await updateDoc(sellerRef, {
          sellerBankName: bankInfo.sellerBankName,
          sellerBankAccount: bankInfo.sellerBankAccount,
          sellerAccountName: bankInfo.sellerAccountName,
          updatedAt: new Date().toISOString()
        });
        
        updateCount++;
        console.log(`Updated seller ${seller.name || seller.id} with bank: ${bankInfo.sellerBankName}`);
      } catch (error) {
        console.error(`Error updating seller ${seller.id}:`, error);
      }
    }

    console.log(`Successfully updated ${updateCount} sellers with bank information`);
    return { success: true, count: updateCount };
    
  } catch (error) {
    console.error('Error adding seller bank info:', error);
    return { success: false, error: error.message };
  }
};

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSellerBankInfo()
    .then(result => {
      if (result.success) {
        console.log(`✅ Successfully updated ${result.count} sellers`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script error:', error);
      process.exit(1);
    });
}

export { addSellerBankInfo };