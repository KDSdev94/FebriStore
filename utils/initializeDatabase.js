import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const initializeDatabase = async () => {
  try {
    console.log('Initializing database with default data...');

    // Initialize Categories
    await initializeCategories();
    
    // Initialize Order Statuses
    await initializeOrderStatuses();
    
    // Initialize App Config
    await initializeAppConfig();
    
    console.log('Database initialization completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error: error.message };
  }
};

const initializeCategories = async () => {
  try {
    const categoriesRef = doc(db, 'app_settings', 'categories');
    const categoriesSnap = await getDoc(categoriesRef);
    
    if (!categoriesSnap.exists()) {
      const defaultCategories = [
        'Makanan & Minuman',
        'Elektronik',
        'Fashion',
        'Kesehatan & Kecantikan',
        'Rumah Tangga',
        'Olahraga',
        'Buku & Alat Tulis',
        'Mainan & Hobi',
        'Otomotif',
        'Pertanian'
      ];
      
      await setDoc(categoriesRef, {
        list: defaultCategories,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Categories initialized');
    } else {
      console.log('ℹ️ Categories already exist');
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
    throw error;
  }
};

const initializeOrderStatuses = async () => {
  try {
    const statusRef = doc(db, 'app_settings', 'order_statuses');
    const statusSnap = await getDoc(statusRef);
    
    if (!statusSnap.exists()) {
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
      
      console.log('✅ Order statuses initialized');
    } else {
      console.log('ℹ️ Order statuses already exist');
    }
  } catch (error) {
    console.error('Error initializing order statuses:', error);
    throw error;
  }
};

const initializeAppConfig = async () => {
  try {
    const configRef = doc(db, 'app_settings', 'config');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      const defaultConfig = {
        appName: 'Febri Store',
        appVersion: '1.0.0',
        maintenanceMode: false,
        allowRegistration: true,
        minOrderAmount: 10000,
        adminFee: 1500,
        adminCommission: 0.05, // 5%
        maxImageUpload: 5,
        supportedImageFormats: ['jpg', 'jpeg', 'png'],
        maxImageSize: 5242880, // 5MB in bytes
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(configRef, defaultConfig);
      console.log('✅ App config initialized');
    } else {
      console.log('ℹ️ App config already exists');
    }
  } catch (error) {
    console.error('Error initializing app config:', error);
    throw error;
  }
};

// Function to create default admin user
export const createDefaultAdmin = async () => {
  try {
    const adminRef = doc(db, 'users', 'default-admin');
    const adminSnap = await getDoc(adminRef);
    
    if (!adminSnap.exists()) {
      const defaultAdmin = {
        name: 'Admin Febri Store',
        email: 'admin@febristore.com',
        phone: '081234567890',
        password: 'admin123', // In production, this should be hashed
        role: 'admin',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(adminRef, defaultAdmin);
      console.log('✅ Default admin user created');
      console.log('📧 Email: admin@febristore.com');
      console.log('🔑 Password: admin123');
      
      return { success: true, admin: defaultAdmin };
    } else {
      console.log('ℹ️ Default admin already exists');
      return { success: true, admin: adminSnap.data() };
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
    return { success: false, error: error.message };
  }
};

// Function to initialize sample data for testing
export const initializeSampleData = async () => {
  try {
    console.log('Initializing sample data...');
    
    // Create sample seller
    await createSampleSeller();
    
    // Create sample products
    await createSampleProducts();
    
    console.log('Sample data initialization completed');
    return { success: true };
  } catch (error) {
    console.error('Error initializing sample data:', error);
    return { success: false, error: error.message };
  }
};

const createSampleSeller = async () => {
  try {
    const sellerRef = doc(db, 'users', 'sample-seller');
    const sellerSnap = await getDoc(sellerRef);
    
    if (!sellerSnap.exists()) {
      const sampleSeller = {
        name: 'Toko Sample',
        email: 'seller@sample.com',
        phone: '081234567891',
        password: 'seller123',
        role: 'seller',
        isActive: true,
        storeName: 'Toko Sample',
        storeDescription: 'Toko sample untuk testing aplikasi',
        storeAddress: 'Jl. Sample No. 123, Jakarta',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(sellerRef, sampleSeller);
      console.log('✅ Sample seller created');
    }
  } catch (error) {
    console.error('Error creating sample seller:', error);
    throw error;
  }
};

const createSampleProducts = async () => {
  try {
    const sampleProducts = [
      {
        id: 'sample-product-1',
        name: 'Nasi Gudeg Jogja',
        description: 'Nasi gudeg khas Jogja dengan cita rasa autentik. Dilengkapi dengan ayam, telur, dan sambal krecek.',
        price: 25000,
        stock: 50,
        category: 'Makanan & Minuman',
        images: ['https://via.placeholder.com/300x300?text=Nasi+Gudeg'],
        sellerId: 'sample-seller',
        sellerName: 'Toko Sample',
        isActive: true,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'sample-product-2',
        name: 'Kaos Polos Cotton',
        description: 'Kaos polos berbahan cotton combed 30s. Nyaman dipakai sehari-hari. Tersedia berbagai warna.',
        price: 45000,
        stock: 100,
        category: 'Fashion',
        images: ['https://via.placeholder.com/300x300?text=Kaos+Polos'],
        sellerId: 'sample-seller',
        sellerName: 'Toko Sample',
        isActive: true,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];
    
    for (const product of sampleProducts) {
      const productRef = doc(db, 'products', product.id);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        await setDoc(productRef, product);
        console.log(`✅ Sample product created: ${product.name}`);
      }
    }
  } catch (error) {
    console.error('Error creating sample products:', error);
    throw error;
  }
};

// Function to run all initialization
export const runFullInitialization = async () => {
  try {
    console.log('🚀 Starting full database initialization...');
    
    // Initialize basic settings
    const dbResult = await initializeDatabase();
    if (!dbResult.success) {
      throw new Error(dbResult.error);
    }
    
    // Create default admin
    const adminResult = await createDefaultAdmin();
    if (!adminResult.success) {
      throw new Error(adminResult.error);
    }
    
    // Initialize sample data
    const sampleResult = await initializeSampleData();
    if (!sampleResult.success) {
      throw new Error(sampleResult.error);
    }
    
    console.log('🎉 Full initialization completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ Database settings initialized');
    console.log('✅ Default admin created (admin@febristore.com / admin123)');
    console.log('✅ Sample data created');
    console.log('');
    console.log('🔧 You can now:');
    console.log('1. Login as admin to manage the system');
    console.log('2. Register as seller to add products');
    console.log('3. Register as buyer to make purchases');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Full initialization failed:', error);
    return { success: false, error: error.message };
  }
};