import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { orderService } from './orderService';

export const transactionService = {
  // Get all transactions with detailed information
  async getAllTransactions() {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const transactions = [];
      
      for (const orderDoc of ordersSnapshot.docs) {
        const order = { id: orderDoc.id, ...orderDoc.data() };
        
        // Get buyer information
        let buyerName = 'Unknown';
        if (order.userId) {
          try {
            console.log('Getting buyer info for userId:', order.userId);
            const buyerRef = doc(db, 'users', order.userId);
            const buyerSnap = await getDoc(buyerRef);
            if (buyerSnap.exists()) {
              const buyerData = buyerSnap.data();
              console.log('Buyer data found:', buyerData);
              buyerName = buyerData.name || buyerData.fullName || 'Unknown';
            } else {
              console.log('Buyer document not found for userId:', order.userId);
            }
          } catch (error) {
            console.log('Error getting buyer info:', error);
          }
        } else {
          console.log('No userId found in order:', order.id);
        }
        
        // Get seller information from order items (handle multi-seller)
        let sellerNames = [];
        let sellerInfo = [];
        
        if (order.items && order.items.length > 0) {
          // Get unique sellers from order items
          const uniqueSellers = new Map();
          
          for (const item of order.items) {
            if (item.sellerId && !uniqueSellers.has(item.sellerId)) {
              try {
                console.log('Getting seller info for sellerId:', item.sellerId);
                const sellerRef = doc(db, 'users', item.sellerId);
                const sellerSnap = await getDoc(sellerRef);
                if (sellerSnap.exists()) {
                  const sellerData = sellerSnap.data();
                  console.log('Seller data found:', sellerData);
                  console.log('Bank info:', {
                    sellerBankName: sellerData.sellerBankName,
                    sellerBankAccount: sellerData.sellerBankAccount,
                    sellerAccountName: sellerData.sellerAccountName
                  });
                  const sellerName = sellerData.name || sellerData.fullName || 'Unknown';
                  const storeName = sellerData.storeName || 'Unknown Store';
                  
                  uniqueSellers.set(item.sellerId, {
                    id: item.sellerId,
                    name: sellerName,
                    storeName: storeName,
                    bankName: sellerData.sellerBankName || 'Bank tidak diatur',
                    accountNumber: sellerData.sellerBankAccount || 'Rekening tidak diatur',
                    accountName: sellerData.sellerAccountName || sellerName,
                    phone: sellerData.phone || 'Telepon tidak diatur'
                  });
                  sellerNames.push(sellerName);
                  sellerInfo.push({ 
                    name: sellerName, 
                    storeName: storeName,
                    bankName: sellerData.sellerBankName || 'Bank tidak diatur',
                    accountNumber: sellerData.sellerBankAccount || 'Rekening tidak diatur',
                    accountName: sellerData.sellerAccountName || sellerName,
                    phone: sellerData.phone || 'Telepon tidak diatur'
                  });
                } else {
                  console.log('Seller document not found for sellerId:', item.sellerId);
                  // Fallback to item data
                  const fallbackName = item.sellerName || 'Unknown';
                  uniqueSellers.set(item.sellerId, {
                    id: item.sellerId,
                    name: fallbackName,
                    storeName: item.storeName || 'Unknown Store',
                    bankName: 'Bank tidak diatur',
                    accountNumber: 'Rekening tidak diatur',
                    accountName: fallbackName,
                    phone: 'Telepon tidak diatur'
                  });
                  sellerNames.push(fallbackName);
                  sellerInfo.push({ 
                    name: fallbackName, 
                    storeName: item.storeName || 'Unknown Store',
                    bankName: 'Bank tidak diatur',
                    accountNumber: 'Rekening tidak diatur',
                    accountName: fallbackName,
                    phone: 'Telepon tidak diatur'
                  });
                }
              } catch (error) {
                console.log('Error getting seller info:', error);
                // Fallback to item data
                const fallbackName = item.sellerName || 'Unknown';
                uniqueSellers.set(item.sellerId, {
                  id: item.sellerId,
                  name: fallbackName,
                  storeName: item.storeName || 'Unknown Store',
                  bankName: 'Bank tidak diatur',
                  accountNumber: 'Rekening tidak diatur',
                  accountName: fallbackName,
                  phone: 'Telepon tidak diatur'
                });
                sellerNames.push(fallbackName);
                sellerInfo.push({ 
                  name: fallbackName, 
                  storeName: item.storeName || 'Unknown Store',
                  bankName: 'Bank tidak diatur',
                  accountNumber: 'Rekening tidak diatur',
                  accountName: fallbackName,
                  phone: 'Telepon tidak diatur'
                });
              }
            }
          }
        }
        
        // Format seller display text - show all seller names
        let sellerDisplayText = 'Unknown';
        if (sellerNames.length > 0) {
          sellerDisplayText = sellerNames.join('\n');
        }
        
        // Format date
        let formattedDate = 'N/A';
        if (order.createdAt) {
          if (order.createdAt.seconds) {
            formattedDate = new Date(order.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else if (typeof order.createdAt === 'string') {
            const date = new Date(order.createdAt);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
          }
        }
        
        // Determine transaction status and filter type
        let status = 'Unknown';
        let statusColor = '#666';
        let filterType = 'Unknown';
        let paymentText = 'Unknown';
        let transferNote = null;
        let needsTransfer = false;
        
        // Map order status to transaction status
        // COD orders have different flow - no admin verification, no seller transfer needed
        if (order.paymentMethod === 'cod') {
          // COD orders flow: processing -> cod_shipped -> cod_delivered
          if (order.status === 'pending_verification' || order.status === 'processing') {
            status = 'COD - Diproses Seller';
            statusColor = '#007AFF';
            filterType = 'Terverifikasi'; // COD orders are automatically verified
            paymentText = 'COD - Sedang Diproses';
            needsTransfer = false; // No transfer needed for COD
          } else if (order.status === 'cod_shipped') {
            status = 'COD - Dikirim';
            statusColor = '#007AFF';
            filterType = 'Terverifikasi';
            paymentText = 'COD - Dalam Pengiriman';
            needsTransfer = false;
          } else if (order.status === 'cod_delivered' || order.status === 'delivered') {
            status = 'COD - Selesai';
            statusColor = '#34C759';
            filterType = 'Selesai';
            paymentText = 'COD - Pembayaran Diterima';
            needsTransfer = false;
          } else {
            status = 'COD - Menunggu Verifikasi';
            statusColor = '#FF9500';
            filterType = 'Pending Verifikasi';
            paymentText = 'COD - Menunggu Verifikasi Seller';
            needsTransfer = false;
          }
        } else {
          // Non-COD orders follow original flow with admin verification and seller transfer
          if (order.adminVerificationStatus === 'pending') {
            status = 'Pending Verifikasi';
            statusColor = '#FF9500';
            filterType = 'Pending Verifikasi';
            paymentText = 'Menunggu Verifikasi Admin';
          } else if (order.adminVerificationStatus === 'approved') {
            // Check seller transfer status after admin verification
            if (order.sellerTransferStatus === 'pending' || !order.sellerTransferStatus) {
              status = 'Pending Transfer Seller';
              statusColor = '#FF9500';
              filterType = 'Pending Transfer Seller';
              paymentText = 'Terverifikasi Admin';
              transferNote = 'Menunggu Transfer ke Seller';
              needsTransfer = true;
            } else if (order.sellerTransferStatus === 'completed') {
              // After transfer to seller, check order processing status
              if (order.status === 'completed' || order.status === 'delivered') {
                status = 'Selesai';
                statusColor = '#34C759';
                filterType = 'Selesai';
                paymentText = 'Terverifikasi Admin';
              } else if (order.status === 'shipped') {
                status = 'Dalam Pengiriman';
                statusColor = '#007AFF';
                filterType = 'Terverifikasi';
                paymentText = 'Terverifikasi Admin';
              } else {
                status = 'Sedang Diproses';
                statusColor = '#007AFF';
                filterType = 'Terverifikasi';
                paymentText = 'Terverifikasi Admin';
              }
            }
          } else if (order.adminVerificationStatus === 'rejected') {
            status = 'Ditolak';
            statusColor = '#FF3B30';
            filterType = 'Ditolak';
            paymentText = 'Ditolak Admin';
          }
        }
        
        // Format amount
        const formattedAmount = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(order.totalAmount || 0);
        
        // Calculate admin fee and seller amount
        const totalAmount = order.totalAmount || 0;
        const adminFee = order.paymentMethod === 'cod' ? 0 : (order.adminFee || 1500); // No admin fee for COD
        const sellerAmount = order.paymentMethod === 'cod' ? 
          (order.subtotal || totalAmount) : // COD gets full subtotal
          (totalAmount - adminFee); // Non-COD gets amount minus admin fee
        
        const transaction = {
          id: order.id,
          orderId: order.orderNumber || `#${order.id.substring(0, 8).toUpperCase()}`,
          buyer: buyerName,
          seller: sellerDisplayText,
          sellerName: sellerDisplayText, // For transfer function
          sellerInfo: sellerInfo, // Detailed seller info for multi-seller handling
          isMultiSeller: sellerNames.length > 1,
          sellerCount: sellerNames.length,
          status,
          statusColor,
          payment: paymentText,
          transferNote,
          date: formattedDate,
          amount: formattedAmount,
          needsTransfer,
          filterType,
          totalAmount: totalAmount,
          adminFee: adminFee,
          sellerAmount: sellerAmount,
          orderNumber: order.orderNumber || `${order.id.substring(0, 8).toUpperCase()}`,
          // Additional data for admin actions
          adminVerificationStatus: order.adminVerificationStatus,
          sellerTransferStatus: order.sellerTransferStatus,
          sellerTransferData: order.sellerTransferData, // IMPORTANT: Include transfer data
          sellerId: order.sellerId,
          userId: order.userId,
          createdTimestamp: order.createdAt?.seconds || 0,
          // Payment method for COD detection
          paymentMethod: order.paymentMethod || 'transfer', // Default to transfer if not specified
          subtotal: order.subtotal // Add subtotal for COD calculations
        };
        
        // Only add non-COD transactions to admin transaction management
        // COD orders don't need admin intervention
        if (order.paymentMethod !== 'cod') {
          transactions.push(transaction);
        }
      }
      
      // Sort by creation date (newest first)
      transactions.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
      
      return { success: true, transactions };
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { success: false, error: 'Gagal mengambil data transaksi' };
    }
  },
  
  // Get transaction statistics
  async getTransactionStats() {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const stats = {
        totalPendapatan: 0, // Admin revenue from fees
        pendingVerifikasi: 0,
        transaksiSelesai: 0,
        pendingTransfer: 0,
        totalTransactionValue: 0, // Total value of all transactions
      };
      
      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        const orderTotal = order.totalAmount || 0;
        
        // Count pending verification (orders waiting for admin approval)
        if (order.adminVerificationStatus === 'pending' || 
            (order.status === 'pending_verification' && !order.adminVerificationStatus)) {
          stats.pendingVerifikasi++;
        }
        
        // Count completed/delivered transactions and calculate admin revenue
        if (order.status === 'completed' || order.status === 'delivered') {
          stats.transaksiSelesai++;
          stats.totalTransactionValue += orderTotal;
          
          // Calculate admin fee (1.5% of order total)
          const adminFee = order.adminFee || Math.round(orderTotal * 0.015);
          stats.totalPendapatan += adminFee;
        }
        
        // Count orders that need transfer to seller (payment confirmed but not transferred)
        if ((order.adminVerificationStatus === 'approved' || order.adminVerificationStatus === 'verified') && 
            (order.sellerTransferStatus === 'pending' || !order.sellerTransferStatus) &&
            order.status !== 'completed' && order.status !== 'delivered') {
          stats.pendingTransfer++;
        }
      });
      
      return { success: true, stats };
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      return { success: false, error: 'Gagal mengambil statistik transaksi' };
    }
  },
  
  // Mark seller transfer as completed
  async markSellerTransferCompleted(orderId, adminId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        sellerTransferStatus: 'completed',
        sellerTransferCompletedAt: serverTimestamp(),
        sellerTransferCompletedBy: adminId,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error marking seller transfer completed:', error);
      return { success: false, error: 'Gagal menandai transfer selesai' };
    }
  },
  
  // Verify payment (approve/reject)
  async verifyPayment(orderId, verificationData) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        adminVerificationStatus: verificationData.status, // 'approved' or 'rejected'
        adminVerifiedAt: serverTimestamp(),
        adminVerifiedBy: verificationData.adminId,
        adminNotes: verificationData.notes || '',
        updatedAt: serverTimestamp()
      };
      
      if (verificationData.status === 'approved') {
        updateData.paymentStatus = 'paid';
        // Don't automatically set to completed, let seller handle shipping
        if (!updateData.status || updateData.status === 'pending') {
          updateData.status = 'verified';
        }
        
        // Update order first
        await updateDoc(orderRef, updateData);
        
        // Reduce stock when payment is approved
        const stockResult = await orderService.reduceStockOnPaymentConfirmed(orderId);
        if (!stockResult.success) {
          console.error('Failed to reduce stock:', stockResult.error);
          // Don't fail the payment verification if stock reduction fails
          // Just log the error for admin to handle manually
        }
        
        return { 
          success: true, 
          stockReduced: stockResult.success,
          stockReductions: stockResult.stockReductions || []
        };
      } else if (verificationData.status === 'rejected') {
        updateData.status = 'payment_rejected';
        updateData.paymentStatus = 'rejected';
        updateData.adminRejectionReason = verificationData.rejectionReason || '';
        
        await updateDoc(orderRef, updateData);
        return { success: true };
      }
      
      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: 'Gagal memverifikasi pembayaran' };
    }
  },
  
  // Get transaction detail
  async getTransactionDetail(orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        return { success: false, error: 'Transaksi tidak ditemukan' };
      }
      
      const order = { id: orderSnap.id, ...orderSnap.data() };
      
      // Get buyer information
      let buyer = null;
      if (order.userId) {
        try {
          const buyerRef = doc(db, 'users', order.userId);
          const buyerSnap = await getDoc(buyerRef);
          if (buyerSnap.exists()) {
            buyer = { id: buyerSnap.id, ...buyerSnap.data() };
          }
        } catch (error) {
          console.log('Error getting buyer info:', error);
        }
      }
      
      // Get seller information
      let seller = null;
      if (order.sellerId) {
        try {
          const sellerRef = doc(db, 'users', order.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            seller = { id: sellerSnap.id, ...sellerSnap.data() };
          }
        } catch (error) {
          console.log('Error getting seller info:', error);
        }
      }
      
      return { 
        success: true, 
        transaction: order,
        buyer,
        seller
      };
    } catch (error) {
      console.error('Error getting transaction detail:', error);
      return { success: false, error: 'Gagal mengambil detail transaksi' };
    }
  },

  // Transfer to seller
  async transferToSeller(orderId, transferData) {
    try {
      console.log('=== TRANSFER TO SELLER DEBUG ===');
      console.log('Order ID:', orderId);
      console.log('Transfer Data received:', transferData);
      
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        sellerTransferStatus: 'completed',
        sellerTransferData: {
          ...transferData,
          transferredAt: serverTimestamp(),
          transferredBy: transferData.adminId,
          isVerified: false, // Initially not verified by seller
          verificationStatus: 'pending'
        },
        status: 'processing', // Keep English for consistency with existing system
        updatedAt: serverTimestamp()
      };

      console.log('Update data to save:', updateData);
      console.log('Transfer proofs in update data:', updateData.sellerTransferData.transferProofs);

      await updateDoc(orderRef, updateData);
      
      // Verify the data was saved correctly
      const updatedOrderSnap = await getDoc(orderRef);
      if (updatedOrderSnap.exists()) {
        const updatedOrder = updatedOrderSnap.data();
        console.log('Data after save - sellerTransferData:', updatedOrder.sellerTransferData);
        console.log('Transfer proofs after save:', updatedOrder.sellerTransferData?.transferProofs);
      }
      
      console.log('=== TRANSFER SAVE COMPLETED ===');
      return { success: true };
    } catch (error) {
      console.error('Error transferring to seller:', error);
      return { 
        success: false, 
        error: 'Gagal mentransfer ke penjual' 
      };
    }
  },

  // Verify seller transfer
  async verifySellerTransfer(orderId, verificationData) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      // Get current order data
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      const currentOrder = orderSnap.data();
      const currentTransferData = currentOrder.sellerTransferData || {};
      
      const updateData = {
        sellerTransferData: {
          ...currentTransferData,
          isVerified: verificationData.isVerified,
          verificationStatus: verificationData.isVerified ? 'verified' : 'rejected',
          verifiedAt: serverTimestamp(),
          verifiedBy: verificationData.verifiedBy,
          sellerStoreName: verificationData.sellerStoreName,
          verificationNotes: verificationData.notes
        },
        // Keep order status as processing - seller still needs to ship the order
        updatedAt: serverTimestamp()
      };

      await updateDoc(orderRef, updateData);
      
      return { 
        success: true, 
        message: verificationData.isVerified 
          ? 'Transfer berhasil diverifikasi' 
          : 'Masalah transfer telah dilaporkan'
      };
    } catch (error) {
      console.error('Error verifying seller transfer:', error);
      return { 
        success: false, 
        error: 'Gagal memverifikasi transfer' 
      };
    }
  },

  // Alias method for consistency
  async markTransferComplete(orderId, adminId) {
    return this.markSellerTransferCompleted(orderId, adminId);
  }
};