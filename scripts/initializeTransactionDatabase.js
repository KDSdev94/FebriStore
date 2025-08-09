import { db } from '../firebaseConfig.js';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Script untuk menginisialisasi database transaksi
 * Menambahkan field yang diperlukan untuk manajemen transaksi admin
 */

const initializeTransactionDatabase = async () => {
  try {
    console.log('🚀 Memulai inisialisasi database transaksi...');
    
    // Get all existing orders
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    console.log(`📦 Ditemukan ${ordersSnapshot.size} pesanan untuk diupdate`);
    
    let updatedCount = 0;
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const orderId = orderDoc.id;
      
      // Prepare update data for transaction management
      const updateData = {};
      
      // Add admin verification status if not exists
      if (!order.adminVerificationStatus) {
        // Set default based on existing payment status
        if (order.paymentStatus === 'paid') {
          updateData.adminVerificationStatus = 'approved';
          updateData.adminVerifiedAt = serverTimestamp();
        } else if (order.paymentStatus === 'pending') {
          updateData.adminVerificationStatus = 'pending';
        } else {
          updateData.adminVerificationStatus = 'pending';
        }
      }
      
      // Add seller transfer status if not exists
      if (!order.sellerTransferStatus) {
        if (order.status === 'completed' && order.adminVerificationStatus === 'approved') {
          updateData.sellerTransferStatus = 'pending';
        } else {
          updateData.sellerTransferStatus = 'not_applicable';
        }
      }
      
      // Add order number if not exists
      if (!order.orderNumber) {
        updateData.orderNumber = `#${orderId.substring(0, 8).toUpperCase()}`;
      }
      
      // Add timestamps if not exists
      if (!order.updatedAt) {
        updateData.updatedAt = serverTimestamp();
      }
      
      // Update the order if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'orders', orderId), updateData);
        updatedCount++;
        console.log(`✅ Updated order ${orderId}`);
      }
    }
    
    console.log(`🎉 Berhasil mengupdate ${updatedCount} pesanan`);
    console.log('✨ Database transaksi berhasil diinisialisasi!');
    
    // Log struktur database yang diharapkan
    console.log('\n📋 Struktur Database Transaksi:');
    console.log('Collection: orders');
    console.log('Fields yang ditambahkan:');
    console.log('- adminVerificationStatus: "pending" | "approved" | "rejected"');
    console.log('- adminVerifiedAt: Timestamp');
    console.log('- adminVerifiedBy: string (admin user ID)');
    console.log('- adminNotes: string');
    console.log('- adminRejectionReason: string');
    console.log('- sellerTransferStatus: "pending" | "completed" | "not_applicable"');
    console.log('- sellerTransferCompletedAt: Timestamp');
    console.log('- sellerTransferCompletedBy: string (admin user ID)');
    console.log('- orderNumber: string (e.g., #ABC12345)');
    console.log('- updatedAt: Timestamp');
    
  } catch (error) {
    console.error('❌ Error initializing transaction database:', error);
    throw error;
  }
};

// Run the initialization
initializeTransactionDatabase()
  .then(() => {
    console.log('🏁 Script selesai dijalankan');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script gagal:', error);
    process.exit(1);
  });