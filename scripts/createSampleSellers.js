import { db } from '../firebaseConfig.js';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const sampleSellers = [
  {
    name: 'Ahmad Wijaya',
    email: 'ahmad.wijaya@tokoelektronik.com',
    phone: '081234567890',
    password: 'seller123',
    role: 'seller',
    storeName: 'Toko Elektronik Jaya',
    storeDescription: 'Menyediakan berbagai perangkat elektronik berkualitas dengan harga terjangkau',
    address: 'Jl. Elektronik No. 123',
    city: 'Jakarta',
    sellerBankName: 'Bank Central Asia (BCA)',
    sellerBankAccount: '1234567890',
    sellerAccountName: 'Ahmad Wijaya',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@fashionstore.com',
    phone: '081234567891',
    password: 'seller123',
    role: 'seller',
    storeName: 'Fashion Store Central',
    storeDescription: 'Koleksi fashion terkini untuk pria dan wanita dengan gaya modern',
    address: 'Jl. Fashion Boulevard No. 456',
    city: 'Bandung',
    sellerBankName: 'Bank Mandiri',
    sellerBankAccount: '2345678901',
    sellerAccountName: 'Siti Nurhaliza',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Budi Santoso',
    email: 'budi.santoso@gadgetcorner.com',
    phone: '081234567892',
    password: 'seller123',
    role: 'seller',
    storeName: 'Gadget Corner',
    storeDescription: 'Spesialis gadget dan aksesoris teknologi terbaru',
    address: 'Jl. Teknologi Raya No. 789',
    city: 'Surabaya',
    sellerBankName: 'Bank Rakyat Indonesia (BRI)',
    sellerBankAccount: '3456789012',
    sellerAccountName: 'Budi Santoso',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Maya Sari',
    email: 'maya.sari@styleboutique.com',
    phone: '081234567893',
    password: 'seller123',
    role: 'seller',
    storeName: 'Style Boutique',
    storeDescription: 'Butik fashion eksklusif dengan desain unik dan berkualitas tinggi',
    address: 'Jl. Style Avenue No. 321',
    city: 'Yogyakarta',
    sellerBankName: 'Bank Negara Indonesia (BNI)',
    sellerBankAccount: '4567890123',
    sellerAccountName: 'Maya Sari',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

const createSampleSellers = async () => {
  try {
    console.log('Starting to create sample sellers...');
    
    let createdCount = 0;
    
    for (const sellerData of sampleSellers) {
      try {
        // Check if seller with this email already exists
        const q = query(collection(db, 'users'), where('email', '==', sellerData.email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          console.log(`Seller with email ${sellerData.email} already exists, skipping...`);
          continue;
        }
        
        // Create new seller
        const docRef = await addDoc(collection(db, 'users'), sellerData);
        createdCount++;
        
        console.log(`✅ Created seller: ${sellerData.name} (${sellerData.storeName}) with ID: ${docRef.id}`);
        console.log(`   Bank: ${sellerData.sellerBankName} - ${sellerData.sellerBankAccount}`);
        
      } catch (error) {
        console.error(`❌ Error creating seller ${sellerData.name}:`, error);
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} sample sellers`);
    return { success: true, count: createdCount };
    
  } catch (error) {
    console.error('Error creating sample sellers:', error);
    return { success: false, error: error.message };
  }
};

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleSellers()
    .then(result => {
      if (result.success) {
        console.log(`\n✅ Script completed successfully! Created ${result.count} sellers`);
      } else {
        console.log(`\n❌ Script failed: ${result.error}`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script error:', error);
      process.exit(1);
    });
}

export { createSampleSellers };