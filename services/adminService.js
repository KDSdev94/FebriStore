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

export const adminService = {
  // Dashboard Statistics
  async getDashboardStats() {
    try {
      const stats = {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0, // Admin revenue from fees
        totalTransactionValue: 0, // Total value of all transactions
        monthlyRevenue: 0, // Admin revenue this month
        totalSellers: 0,
        totalProducts: 0,
        pendingVerifications: 0,
        shippedOrders: 0
      };

      // Get current month and year for monthly calculations
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Get orders stats
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        const orderTotal = order.totalAmount || 0;
        
        stats.totalOrders++;
        stats.totalTransactionValue += orderTotal;
        
        // Calculate admin fee (1.5% of order total)
        const adminFee = order.adminFee || Math.round(orderTotal * 0.015);
        
        if (order.status === 'pending' || order.paymentStatus === 'pending') {
          stats.pendingOrders++;
        }
        
        if (order.status === 'completed' || order.status === 'delivered') {
          stats.completedOrders++;
          // Only count admin revenue from completed orders
          stats.totalRevenue += adminFee;
          
          // Calculate monthly revenue
          const orderDate = order.createdAt?.seconds 
            ? new Date(order.createdAt.seconds * 1000)
            : new Date(order.createdAt || order.date);
            
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            stats.monthlyRevenue += adminFee;
          }
        }
        
        if (order.status === 'shipped') {
          stats.shippedOrders++;
        }
        
        if (order.adminVerificationStatus === 'pending') {
          stats.pendingVerifications++;
        }
      });

      // Get sellers count
      const sellersQuery = query(collection(db, 'users'), where('role', '==', 'seller'));
      const sellersSnapshot = await getDocs(sellersQuery);
      stats.totalSellers = sellersSnapshot.size;

      // Get products count
      const productsSnapshot = await getDocs(collection(db, 'products'));
      stats.totalProducts = productsSnapshot.size;

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { success: false, error: 'Gagal mengambil statistik dashboard' };
    }
  },

  // Get detailed admin revenue statistics
  async getAdminRevenueStats() {
    try {
      const stats = {
        totalAdminRevenue: 0,
        monthlyAdminRevenue: 0,
        weeklyAdminRevenue: 0,
        dailyAdminRevenue: 0,
        totalTransactionValue: 0,
        completedTransactions: 0,
        averageAdminFeePerTransaction: 0,
        revenueByMonth: [], // Last 12 months
      };

      // Get current date info
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const currentDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Initialize monthly revenue array (last 12 months)
      const monthlyRevenue = Array(12).fill(0);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Get all completed orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      
      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        
        // Only process completed/delivered orders
        if (order.status === 'completed' || order.status === 'delivered') {
          const orderTotal = order.totalAmount || 0;
          const adminFee = order.adminFee || Math.round(orderTotal * 0.015);
          
          stats.totalAdminRevenue += adminFee;
          stats.totalTransactionValue += orderTotal;
          stats.completedTransactions++;
          
          // Get order date
          const orderDate = order.createdAt?.seconds 
            ? new Date(order.createdAt.seconds * 1000)
            : new Date(order.createdAt || order.date);
          
          // Monthly revenue (current month)
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            stats.monthlyAdminRevenue += adminFee;
          }
          
          // Weekly revenue
          if (orderDate >= currentWeekStart) {
            stats.weeklyAdminRevenue += adminFee;
          }
          
          // Daily revenue
          if (orderDate >= currentDayStart) {
            stats.dailyAdminRevenue += adminFee;
          }
          
          // Revenue by month (last 12 months)
          const monthIndex = orderDate.getMonth();
          const orderYear = orderDate.getFullYear();
          
          // Only count if within last 12 months
          const monthsAgo = (currentYear - orderYear) * 12 + (currentMonth - monthIndex);
          if (monthsAgo >= 0 && monthsAgo < 12) {
            const arrayIndex = (12 - monthsAgo - 1) % 12;
            monthlyRevenue[arrayIndex] += adminFee;
          }
        }
      });

      // Calculate average admin fee per transaction
      stats.averageAdminFeePerTransaction = stats.completedTransactions > 0 
        ? stats.totalAdminRevenue / stats.completedTransactions 
        : 0;

      // Format monthly revenue data
      stats.revenueByMonth = monthlyRevenue.map((revenue, index) => {
        const monthIndex = (currentMonth - 11 + index + 12) % 12;
        return {
          month: monthNames[monthIndex],
          revenue: revenue
        };
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting admin revenue stats:', error);
      return { success: false, error: 'Gagal mengambil statistik pendapatan admin' };
    }
  },

  // Orders Management
  async getAllOrders() {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const orders = [];
      
      snapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by creation date in JavaScript
      orders.sort((a, b) => {
        let timestampA = 0;
        let timestampB = 0;
        
        // Handle different createdAt formats
        if (a.createdAt) {
          if (a.createdAt.seconds) {
            timestampA = a.createdAt.seconds;
          } else if (typeof a.createdAt === 'string') {
            timestampA = Math.floor(new Date(a.createdAt).getTime() / 1000);
          }
        }
        
        if (b.createdAt) {
          if (b.createdAt.seconds) {
            timestampB = b.createdAt.seconds;
          } else if (typeof b.createdAt === 'string') {
            timestampB = Math.floor(new Date(b.createdAt).getTime() / 1000);
          }
        }
        
        return timestampB - timestampA;
      });

      return { success: true, orders };
    } catch (error) {
      console.error('Error getting all orders:', error);
      return { success: false, error: 'Gagal mengambil data pesanan' };
    }
  },

  async getOrderById(orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        return { 
          success: true, 
          order: {
            id: orderSnap.id,
            ...orderSnap.data()
          }
        };
      } else {
        return { success: false, error: 'Pesanan tidak ditemukan' };
      }
    } catch (error) {
      console.error('Error getting order:', error);
      return { success: false, error: 'Gagal mengambil data pesanan' };
    }
  },

  async updateOrderStatus(orderId, statusData) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        ...statusData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Gagal memperbarui status pesanan' };
    }
  },

  async verifyPayment(orderId, verificationData) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        adminVerificationStatus: verificationData.status, // 'approved' or 'rejected'
        adminVerifiedAt: serverTimestamp(),
        adminVerifiedBy: verificationData.adminId,
        adminNotes: verificationData.notes || '',
        adminRejectionReason: verificationData.rejectionReason || '',
        updatedAt: serverTimestamp()
      };

      if (verificationData.status === 'approved') {
        updateData.status = 'payment_confirmed';
        updateData.paymentStatus = 'confirmed';
        updateData.sellerTransferStatus = 'pending'; // Ready for admin to transfer to seller
      } else if (verificationData.status === 'rejected') {
        updateData.status = 'payment_rejected';
        updateData.paymentStatus = 'rejected';
      }

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: 'Gagal memverifikasi pembayaran' };
    }
  },

  // Sellers Management
  async getAllSellers() {
    try {
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'seller')
      );
      const snapshot = await getDocs(q);
      const sellers = [];
      
      snapshot.forEach((doc) => {
        sellers.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by creation date in JavaScript
      sellers.sort((a, b) => {
        let timestampA = 0;
        let timestampB = 0;
        
        // Handle different createdAt formats
        if (a.createdAt) {
          if (a.createdAt.seconds) {
            timestampA = a.createdAt.seconds;
          } else if (typeof a.createdAt === 'string') {
            timestampA = Math.floor(new Date(a.createdAt).getTime() / 1000);
          }
        }
        
        if (b.createdAt) {
          if (b.createdAt.seconds) {
            timestampB = b.createdAt.seconds;
          } else if (typeof b.createdAt === 'string') {
            timestampB = Math.floor(new Date(b.createdAt).getTime() / 1000);
          }
        }
        
        return timestampB - timestampA;
      });

      return { success: true, sellers };
    } catch (error) {
      console.error('Error getting sellers:', error);
      return { success: false, error: 'Gagal mengambil data penjual' };
    }
  },

  // Store Management - Get all stores with seller info and product count
  async getAllStores() {
    try {
      // Get all sellers (without orderBy to avoid index requirement)
      const sellersQuery = query(
        collection(db, 'users'), 
        where('role', '==', 'seller')
      );
      const sellersSnapshot = await getDocs(sellersQuery);
      const stores = [];
      
      // For each seller, get their store info and product count
      for (const sellerDoc of sellersSnapshot.docs) {
        const seller = { id: sellerDoc.id, ...sellerDoc.data() };
        
        // Get products count for this seller
        const productsQuery = query(
          collection(db, 'products'),
          where('sellerId', '==', seller.id)
        );
        const productsSnapshot = await getDocs(productsQuery);
        
        // Handle different createdAt formats (Firestore Timestamp vs ISO string)
        let createdDate = 'N/A';
        let createdTimestamp = 0;
        
        if (seller.createdAt) {
          if (seller.createdAt.seconds) {
            // Firestore Timestamp
            createdDate = new Date(seller.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
            createdTimestamp = seller.createdAt.seconds;
          } else if (typeof seller.createdAt === 'string') {
            // ISO string
            const date = new Date(seller.createdAt);
            if (!isNaN(date.getTime())) {
              createdDate = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
              createdTimestamp = Math.floor(date.getTime() / 1000);
            }
          }
        }

        // Create store object
        const store = {
          id: seller.id,
          name: seller.storeName || seller.name + ' Store',
          owner: seller.name,
          email: seller.email,
          phone: seller.phone || '',
          description: seller.storeDescription || '',
          createdDate,
          createdTimestamp,
          status: seller.isActive !== false ? 'Aktif' : 'Nonaktif',
          isActive: seller.isActive !== false,
          productCount: productsSnapshot.size,
          sellerId: seller.id,
          // Profile images
          storeImage: seller.storeImage || seller.storeLogo,
          avatar: seller.avatar,
          profileImage: seller.profileImage
        };
        
        stores.push(store);
      }

      // Sort stores by creation date (newest first) in JavaScript
      stores.sort((a, b) => {
        return b.createdTimestamp - a.createdTimestamp;
      });

      return { success: true, stores };
    } catch (error) {
      console.error('Error getting stores:', error);
      return { success: false, error: 'Gagal mengambil data toko' };
    }
  },

  // Get store detail with products
  async getStoreDetail(sellerId) {
    try {
      // Get seller info
      const sellerRef = doc(db, 'users', sellerId);
      const sellerSnap = await getDoc(sellerRef);
      
      if (!sellerSnap.exists()) {
        return { success: false, error: 'Toko tidak ditemukan' };
      }
      
      const seller = { id: sellerSnap.id, ...sellerSnap.data() };
      
      // Get seller's products
      const productsQuery = query(
        collection(db, 'products'),
        where('sellerId', '==', sellerId)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const products = [];
      
      productsSnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort products by creation date in JavaScript
      products.sort((a, b) => {
        let timestampA = 0;
        let timestampB = 0;
        
        // Handle different createdAt formats
        if (a.createdAt) {
          if (a.createdAt.seconds) {
            timestampA = a.createdAt.seconds;
          } else if (typeof a.createdAt === 'string') {
            timestampA = Math.floor(new Date(a.createdAt).getTime() / 1000);
          }
        }
        
        if (b.createdAt) {
          if (b.createdAt.seconds) {
            timestampB = b.createdAt.seconds;
          } else if (typeof b.createdAt === 'string') {
            timestampB = Math.floor(new Date(b.createdAt).getTime() / 1000);
          }
        }
        
        return timestampB - timestampA;
      });
      
      // Handle different createdAt formats (Firestore Timestamp vs ISO string)
      let createdDate = 'N/A';
      
      if (seller.createdAt) {
        if (seller.createdAt.seconds) {
          // Firestore Timestamp
          createdDate = new Date(seller.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } else if (typeof seller.createdAt === 'string') {
          // ISO string
          const date = new Date(seller.createdAt);
          if (!isNaN(date.getTime())) {
            createdDate = date.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
          }
        }
      }

      // Create store detail object
      const storeDetail = {
        id: seller.id,
        name: seller.storeName || seller.name + ' Store',
        owner: seller.name,
        email: seller.email,
        phone: seller.phone || '085741128982',
        description: seller.storeDescription || 'Menyediakan berbagai macam pilihan menu lauk yang bervariasi dari mulai olahan ikan, ayam, daging, sayuran, dan minuman segar',
        createdDate,
        status: seller.isActive !== false ? 'Aktif' : 'Nonaktif',
        isActive: seller.isActive !== false,
        products: products,
        sellerId: seller.id,
        // Profile images
        storeImage: seller.storeImage || seller.storeLogo,
        avatar: seller.avatar,
        profileImage: seller.profileImage
      };

      return { success: true, store: storeDetail };
    } catch (error) {
      console.error('Error getting store detail:', error);
      return { success: false, error: 'Gagal mengambil detail toko' };
    }
  },

  // Deactivate/Activate store (seller)
  async updateStoreStatus(sellerId, isActive) {
    try {
      const sellerRef = doc(db, 'users', sellerId);
      await updateDoc(sellerRef, {
        isActive: isActive,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating store status:', error);
      return { success: false, error: 'Gagal memperbarui status toko' };
    }
  },

  // Delete store (seller and all their products)
  async deleteStore(sellerId) {
    try {
      const batch = writeBatch(db);

      // Delete seller
      const sellerRef = doc(db, 'users', sellerId);
      batch.delete(sellerRef);

      // Get and delete all products from this seller
      const productsQuery = query(
        collection(db, 'products'),
        where('sellerId', '==', sellerId)
      );
      const productsSnapshot = await getDocs(productsQuery);
      
      productsSnapshot.forEach((productDoc) => {
        batch.delete(productDoc.ref);
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error deleting store:', error);
      return { success: false, error: 'Gagal menghapus toko' };
    }
  },

  // Delete product
  async deleteProduct(productId) {
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: 'Gagal menghapus produk' };
    }
  },

  async updateSellerStatus(sellerId, isActive) {
    try {
      const sellerRef = doc(db, 'users', sellerId);
      await updateDoc(sellerRef, {
        isActive: isActive,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating seller status:', error);
      return { success: false, error: 'Gagal memperbarui status penjual' };
    }
  },

  // Products Management
  async getAllProducts() {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const products = [];
      
      snapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by creation date in JavaScript
      products.sort((a, b) => {
        let timestampA = 0;
        let timestampB = 0;
        
        // Handle different createdAt formats
        if (a.createdAt) {
          if (a.createdAt.seconds) {
            timestampA = a.createdAt.seconds;
          } else if (typeof a.createdAt === 'string') {
            timestampA = Math.floor(new Date(a.createdAt).getTime() / 1000);
          }
        }
        
        if (b.createdAt) {
          if (b.createdAt.seconds) {
            timestampB = b.createdAt.seconds;
          } else if (typeof b.createdAt === 'string') {
            timestampB = Math.floor(new Date(b.createdAt).getTime() / 1000);
          }
        }
        
        return timestampB - timestampA;
      });

      return { success: true, products };
    } catch (error) {
      console.error('Error getting all products:', error);
      return { success: false, error: 'Gagal mengambil data produk' };
    }
  },

  async updateProductStatus(productId, isActive) {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        isActive: isActive,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating product status:', error);
      return { success: false, error: 'Gagal memperbarui status produk' };
    }
  },

  // Bank Account Management
  async getAdminBankAccount() {
    try {
      const bankRef = doc(db, 'admin_settings', 'bank_account');
      const bankSnap = await getDoc(bankRef);
      
      if (bankSnap.exists()) {
        return { 
          success: true, 
          bankAccount: bankSnap.data()
        };
      } else {
        return { 
          success: true, 
          bankAccount: null 
        };
      }
    } catch (error) {
      console.error('Error getting admin bank account:', error);
      return { success: false, error: 'Gagal mengambil data rekening admin' };
    }
  },

  async updateAdminBankAccount(bankData) {
    try {
      const bankRef = doc(db, 'admin_settings', 'bank_account');
      const updateData = {
        ...bankData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(bankRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating admin bank account:', error);
      return { success: false, error: 'Gagal memperbarui rekening admin' };
    }
  },

  // Categories Management
  async getCategories() {
    try {
      const categoriesRef = doc(db, 'app_settings', 'categories');
      const categoriesSnap = await getDoc(categoriesRef);
      
      if (categoriesSnap.exists()) {
        return { 
          success: true, 
          categories: categoriesSnap.data().list || []
        };
      } else {
        // Return default categories if not found
        const defaultCategories = [
          'Makanan & Minuman',
          'Elektronik',
          'Fashion',
          'Kesehatan & Kecantikan',
          'Rumah Tangga',
          'Olahraga',
          'Buku & Alat Tulis',
          'Mainan & Hobi'
        ];
        return { 
          success: true, 
          categories: defaultCategories
        };
      }
    } catch (error) {
      console.error('Error getting categories:', error);
      return { success: false, error: 'Gagal mengambil data kategori' };
    }
  },

  async updateCategories(categories) {
    try {
      const categoriesRef = doc(db, 'app_settings', 'categories');
      await updateDoc(categoriesRef, {
        list: categories,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating categories:', error);
      return { success: false, error: 'Gagal memperbarui kategori' };
    }
  },

  // Transactions Management
  async getAllTransactions() {
    try {
      const snapshot = await getDocs(collection(db, 'transactions'));
      const transactions = [];
      
      snapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by creation date in JavaScript
      transactions.sort((a, b) => {
        let timestampA = 0;
        let timestampB = 0;
        
        // Handle different createdAt formats
        if (a.createdAt) {
          if (a.createdAt.seconds) {
            timestampA = a.createdAt.seconds;
          } else if (typeof a.createdAt === 'string') {
            timestampA = Math.floor(new Date(a.createdAt).getTime() / 1000);
          }
        }
        
        if (b.createdAt) {
          if (b.createdAt.seconds) {
            timestampB = b.createdAt.seconds;
          } else if (typeof b.createdAt === 'string') {
            timestampB = Math.floor(new Date(b.createdAt).getTime() / 1000);
          }
        }
        
        return timestampB - timestampA;
      });

      return { success: true, transactions };
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { success: false, error: 'Gagal mengambil data transaksi' };
    }
  },

  async processSellerPayment(orderId, paymentData) {
    try {
      const batch = writeBatch(db);

      // Update order
      const orderRef = doc(db, 'orders', orderId);
      batch.update(orderRef, {
        sellerPaymentStatus: 'paid',
        sellerPaidAt: serverTimestamp(),
        sellerPaymentMethod: paymentData.method,
        sellerPaymentNotes: paymentData.notes || '',
        updatedAt: serverTimestamp()
      });

      // Create transaction record
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        orderId: orderId,
        type: 'seller_payment',
        amount: paymentData.amount,
        method: paymentData.method,
        notes: paymentData.notes || '',
        processedBy: paymentData.adminId,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error processing seller payment:', error);
      return { success: false, error: 'Gagal memproses pembayaran ke penjual' };
    }
  }
};