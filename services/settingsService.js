import { db } from '../firebaseConfig';
import { 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

export const settingsService = {
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
        // Create default categories if not found
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
        
        // Save default categories to database
        await setDoc(categoriesRef, {
          list: defaultCategories,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { 
          success: true, 
          categories: defaultCategories
        };
      }
    } catch (error) {
      console.error('Error getting categories:', error);
      return { 
        success: false, 
        error: 'Gagal mengambil data kategori',
        categories: []
      };
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

  // Admin Bank Account
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
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber,
        accountHolderName: bankData.accountHolderName,
        updatedAt: serverTimestamp()
      };

      // Use setDoc to create if not exists, or update if exists
      await setDoc(bankRef, updateData, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error updating admin bank account:', error);
      return { success: false, error: 'Gagal memperbarui rekening admin' };
    }
  },

  // App Configuration
  async getAppConfig() {
    try {
      const configRef = doc(db, 'app_settings', 'config');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        return { 
          success: true, 
          config: configSnap.data()
        };
      } else {
        // Create default config
        const defaultConfig = {
          appName: 'Febri Store',
          appVersion: '1.0.0',
          maintenanceMode: false,
          allowRegistration: true,
          minOrderAmount: 10000,
          adminFee: 1500,
          adminCommission: 0.05, // 5%
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(configRef, defaultConfig);
        return { 
          success: true, 
          config: defaultConfig
        };
      }
    } catch (error) {
      console.error('Error getting app config:', error);
      return { success: false, error: 'Gagal mengambil konfigurasi aplikasi' };
    }
  },

  async updateAppConfig(configData) {
    try {
      const configRef = doc(db, 'app_settings', 'config');
      const updateData = {
        ...configData,
        updatedAt: serverTimestamp()
      };

      await setDoc(configRef, updateData, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error updating app config:', error);
      return { success: false, error: 'Gagal memperbarui konfigurasi aplikasi' };
    }
  },

  // Order Status Options
  async getOrderStatuses() {
    try {
      const statusRef = doc(db, 'app_settings', 'order_statuses');
      const statusSnap = await getDoc(statusRef);
      
      if (statusSnap.exists()) {
        return { 
          success: true, 
          statuses: statusSnap.data().list || []
        };
      } else {
        // Create default order statuses
        const defaultStatuses = [
          { key: 'pending', label: 'Menunggu Pembayaran', color: '#FF9800' },
          { key: 'payment_uploaded', label: 'Bukti Pembayaran Diupload', color: '#2196F3' },
          { key: 'verified', label: 'Pembayaran Diverifikasi', color: '#4CAF50' },
          { key: 'processing', label: 'Sedang Diproses', color: '#9C27B0' },
          { key: 'shipped', label: 'Dikirim', color: '#00BCD4' },
          { key: 'delivered', label: 'Diterima', color: '#8BC34A' },
          { key: 'completed', label: 'Selesai', color: '#4CAF50' },
          { key: 'cancelled', label: 'Dibatalkan', color: '#F44336' },
          { key: 'payment_rejected', label: 'Pembayaran Ditolak', color: '#F44336' }
        ];
        
        await setDoc(statusRef, {
          list: defaultStatuses,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { 
          success: true, 
          statuses: defaultStatuses
        };
      }
    } catch (error) {
      console.error('Error getting order statuses:', error);
      return { success: false, error: 'Gagal mengambil status pesanan' };
    }
  },

  async updateOrderStatuses(statuses) {
    try {
      const statusRef = doc(db, 'app_settings', 'order_statuses');
      await updateDoc(statusRef, {
        list: statuses,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating order statuses:', error);
      return { success: false, error: 'Gagal memperbarui status pesanan' };
    }
  }
};