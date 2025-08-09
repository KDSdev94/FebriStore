// Script untuk test menambah produk
// Jalankan ini di console untuk menambah produk sample

import { productService } from './services/productService.js';

const testProduct = {
  name: 'Test Produk Sample',
  description: 'Ini adalah produk test untuk memastikan sistem berjalan dengan baik.',
  price: 50000,
  stock: 10,
  category: 'Elektronik',
  imageUrl: 'https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Test+Product'
};

const storeInfo = {
  storeName: 'Toko Test',
  city: 'Jakarta',
  address: 'Jl. Test No. 123',
  phone: '081234567890'
};

// Fungsi untuk test add product
export const testAddProduct = async (sellerId) => {
  try {
    console.log('Testing add product...');
    const result = await productService.addProduct(testProduct, sellerId, storeInfo);
    
    if (result.success) {
      console.log('✅ Test product added successfully:', result.product);
      return result;
    } else {
      console.log('❌ Failed to add test product:', result.error);
      return result;
    }
  } catch (error) {
    console.log('❌ Error adding test product:', error);
    return { success: false, error: error.message };
  }
};

// Contoh penggunaan:
// testAddProduct('USER_ID_DISINI');