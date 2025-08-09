// Script untuk menambahkan produk sample ke Firestore
// Jalankan script ini untuk menambahkan data sample

import { productService } from '../services/productService.js';

const sampleProducts = [
  {
    name: 'Nasi Gudeg Jogja',
    description: 'Nasi gudeg khas Jogja dengan ayam kampung, telur, dan sambal krecek. Cita rasa manis gurih yang autentik.',
    price: 25000,
    stock: 50,
    category: 'food',
    imageUrl: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Gudeg'
  },
  {
    name: 'Es Teh Manis Dingin',
    description: 'Es teh manis segar dengan gula aren asli. Cocok untuk cuaca panas.',
    price: 8000,
    stock: 100,
    category: 'food',
    imageUrl: 'https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Es+Teh'
  },
  {
    name: 'Smartphone Android Terbaru',
    description: 'Smartphone dengan kamera 48MP, RAM 8GB, storage 128GB. Performa tinggi untuk gaming dan fotografi.',
    price: 2500000,
    stock: 15,
    category: 'electronics',
    imageUrl: 'https://via.placeholder.com/300x200/9B59B6/FFFFFF?text=Phone'
  },
  {
    name: 'Kaos Polos Cotton Combed',
    description: 'Kaos polos berbahan cotton combed 30s. Nyaman dipakai, tersedia berbagai warna.',
    price: 45000,
    stock: 200,
    category: 'fashion',
    imageUrl: 'https://via.placeholder.com/300x200/50C878/FFFFFF?text=Kaos'
  },
  {
    name: 'Buku Pemrograman JavaScript',
    description: 'Panduan lengkap belajar JavaScript dari dasar hingga advanced. Cocok untuk pemula.',
    price: 85000,
    stock: 30,
    category: 'books',
    imageUrl: 'https://via.placeholder.com/300x200/E91E63/FFFFFF?text=Book'
  },
  {
    name: 'Serum Wajah Vitamin C',
    description: 'Serum wajah dengan vitamin C untuk mencerahkan dan melembabkan kulit wajah.',
    price: 120000,
    stock: 75,
    category: 'beauty',
    imageUrl: 'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Serum'
  },
  {
    name: 'Sepatu Lari Nike',
    description: 'Sepatu lari dengan teknologi Air Max untuk kenyamanan maksimal saat berlari.',
    price: 850000,
    stock: 25,
    category: 'sports',
    imageUrl: 'https://via.placeholder.com/300x200/795548/FFFFFF?text=Shoes'
  },
  {
    name: 'Kursi Gaming Ergonomis',
    description: 'Kursi gaming dengan desain ergonomis, dilengkapi lumbar support dan armrest yang dapat disesuaikan.',
    price: 1200000,
    stock: 10,
    category: 'home',
    imageUrl: 'https://via.placeholder.com/300x200/607D8B/FFFFFF?text=Chair'
  }
];

const storeInfo = {
  storeName: 'Toko Sample',
  city: 'Jakarta',
  address: 'Jl. Sample No. 123',
  phone: '081234567890'
};

// Fungsi untuk menambahkan produk sample
export const addSampleProducts = async (sellerId) => {
  console.log('Menambahkan produk sample...');
  
  for (const product of sampleProducts) {
    try {
      const result = await productService.addProduct(product, sellerId, storeInfo);
      
      if (result.success) {
        console.log(`✅ Berhasil menambahkan: ${product.name}`);
      } else {
        console.log(`❌ Gagal menambahkan: ${product.name} - ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error menambahkan: ${product.name} - ${error.message}`);
    }
  }
  
  console.log('Selesai menambahkan produk sample!');
};

// Contoh penggunaan:
// addSampleProducts('USER_ID_SELLER_DISINI');