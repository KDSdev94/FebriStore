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
  serverTimestamp 
} from 'firebase/firestore';
import { settingsService } from './settingsService';

export const productService = {
  // Menambah produk baru
  async addProduct(productData, sellerId, storeInfo) {
    try {
      const productRef = collection(db, 'products');
      
      // Generate store name if not provided
      let storeName = storeInfo.storeName;
      if (!storeName || storeName.trim() === '') {
        // Use user name with "Toko" prefix if available
        if (storeInfo.userName && storeInfo.userName.trim() !== '') {
          storeName = `Toko ${storeInfo.userName}`;
        } else {
          storeName = 'Toko Online';
        }
      }
      
      const newProduct = {
        ...productData,
        sellerId: sellerId,
        storeName: storeName,
        storeCity: storeInfo.city || '',
        storeAddress: storeInfo.address || '',
        storePhone: storeInfo.phone || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        views: 0,
        sold: 0,
        rating: 0,
        reviewCount: 0
      };

      const docRef = await addDoc(productRef, newProduct);
      return { 
        success: true, 
        productId: docRef.id,
        product: { ...newProduct, id: docRef.id }
      };
    } catch (error) {
      console.error('Error adding product:', error);
      return { 
        success: false, 
        error: 'Gagal menambahkan produk' 
      };
    }
  },

  // Mengupdate produk
  async updateProduct(productId, productData, storeInfo) {
    try {
      const productRef = doc(db, 'products', productId);
      
      // Generate store name if not provided
      let storeName = storeInfo.storeName;
      if (!storeName || storeName.trim() === '') {
        // Use user name with "Toko" prefix if available
        if (storeInfo.userName && storeInfo.userName.trim() !== '') {
          storeName = `Toko ${storeInfo.userName}`;
        } else {
          storeName = 'Toko Online';
        }
      }
      
      const updatedProduct = {
        ...productData,
        storeName: storeName,
        storeCity: storeInfo.city || '',
        storeAddress: storeInfo.address || '',
        storePhone: storeInfo.phone || '',
        updatedAt: serverTimestamp()
      };

      await updateDoc(productRef, updatedProduct);
      return { 
        success: true,
        product: { ...updatedProduct, id: productId }
      };
    } catch (error) {
      console.error('Error updating product:', error);
      return { 
        success: false, 
        error: 'Gagal mengupdate produk' 
      };
    }
  },

  // Menghapus produk
  async deleteProduct(productId) {
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { 
        success: false, 
        error: 'Gagal menghapus produk' 
      };
    }
  },

  // Mendapatkan produk berdasarkan seller
  async getProductsBySeller(sellerId) {
    try {
      // Sederhanakan query untuk menghindari composite index
      const q = query(
        collection(db, 'products'), 
        where('sellerId', '==', sellerId)
      );
      
      const snapshot = await getDocs(q);
      const products = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter isActive di client side dan urutkan manual
        if (data.isActive !== false) { // termasuk undefined
          products.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Urutkan berdasarkan createdAt di client side
      products.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime; // desc
      });

      return { success: true, products };
    } catch (error) {
      console.error('Error getting seller products:', error);
      return { 
        success: false, 
        error: 'Gagal mengambil data produk',
        products: []
      };
    }
  },

  // Mendapatkan semua produk aktif
  async getAllProducts() {
    try {
      // Sederhanakan query untuk menghindari composite index
      const q = query(collection(db, 'products'));
      
      const snapshot = await getDocs(q);
      const products = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter isActive di client side
        if (data.isActive !== false) { // termasuk undefined
          products.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Urutkan berdasarkan createdAt di client side
      products.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime; // desc
      });

      return { success: true, products };
    } catch (error) {
      console.error('Error getting all products:', error);
      return { 
        success: false, 
        error: 'Gagal mengambil data produk',
        products: []
      };
    }
  },

  // Mendapatkan produk berdasarkan kategori
  async getProductsByCategory(category) {
    try {
      // Sederhanakan query untuk menghindari composite index
      const q = query(
        collection(db, 'products'), 
        where('category', '==', category)
      );
      
      const snapshot = await getDocs(q);
      const products = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter isActive di client side
        if (data.isActive !== false) { // termasuk undefined
          products.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Urutkan berdasarkan createdAt di client side
      products.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime; // desc
      });

      return { success: true, products };
    } catch (error) {
      console.error('Error getting products by category:', error);
      return { 
        success: false, 
        error: 'Gagal mengambil data produk',
        products: []
      };
    }
  },

  // Mendapatkan detail produk
  async getProductById(productId) {
    try {
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        return { 
          success: true, 
          product: {
            id: productSnap.id,
            ...productSnap.data()
          }
        };
      } else {
        return { 
          success: false, 
          error: 'Produk tidak ditemukan' 
        };
      }
    } catch (error) {
      console.error('Error getting product:', error);
      return { 
        success: false, 
        error: 'Gagal mengambil data produk' 
      };
    }
  },

  // Mencari produk
  async searchProducts(searchQuery) {
    try {
      // Firestore tidak mendukung full-text search, jadi kita ambil semua produk dulu
      // Untuk implementasi yang lebih baik, gunakan Algolia atau Elasticsearch
      const q = query(collection(db, 'products'));
      
      const snapshot = await getDocs(q);
      const allProducts = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter isActive di client side
        if (data.isActive !== false) { // termasuk undefined
          allProducts.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Filter produk berdasarkan nama atau deskripsi
      const filteredProducts = allProducts.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Urutkan berdasarkan relevansi (nama produk yang cocok di prioritaskan)
      filteredProducts.sort((a, b) => {
        const aNameMatch = a.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const bNameMatch = b.name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Jika sama, urutkan berdasarkan createdAt
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      return { success: true, products: filteredProducts };
    } catch (error) {
      console.error('Error searching products:', error);
      return { 
        success: false, 
        error: 'Gagal mencari produk',
        products: []
      };
    }
  },

  // Update view count
  async incrementViews(productId) {
    try {
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const currentViews = productSnap.data().views || 0;
        await updateDoc(productRef, {
          views: currentViews + 1
        });
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  // Get categories from database
  async getCategories() {
    return await settingsService.getCategories();
  },

  // Update all products for a specific seller with new store information
  async updateSellerStoreInfo(sellerId, storeInfo) {
    try {
      // Get all products for this seller
      const q = query(
        collection(db, 'products'), 
        where('sellerId', '==', sellerId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: true, message: 'No products found for this seller' };
      }

      // Generate store name if not provided
      let storeName = storeInfo.storeName;
      if (!storeName || storeName.trim() === '') {
        if (storeInfo.userName && storeInfo.userName.trim() !== '') {
          storeName = `Toko ${storeInfo.userName}`;
        } else {
          storeName = 'Toko Online';
        }
      }

      // Update each product
      const updatePromises = [];
      snapshot.forEach((doc) => {
        const updateData = {
          storeName: storeName,
          storeCity: storeInfo.city || '',
          storeAddress: storeInfo.address || '',
          storePhone: storeInfo.phone || '',
          updatedAt: serverTimestamp()
        };
        
        updatePromises.push(updateDoc(doc.ref, updateData));
      });

      await Promise.all(updatePromises);
      
      return { 
        success: true, 
        message: `Updated ${snapshot.size} products with new store information`,
        updatedCount: snapshot.size
      };
    } catch (error) {
      console.error('Error updating seller store info:', error);
      return { 
        success: false, 
        error: 'Gagal memperbarui informasi toko pada produk' 
      };
    }
  },

  // Reduce product stock
  async reduceStock(productId, quantity, variantName = null) {
    try {
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return { success: false, error: 'Produk tidak ditemukan' };
      }

      const productData = productSnap.data();
      
      if (variantName && productData.variants) {
        // Reduce variant stock
        const updatedVariants = productData.variants.map(variant => {
          if (variant.name === variantName) {
            const currentStock = variant.stock || 0;
            const newStock = Math.max(0, currentStock - quantity);
            return { ...variant, stock: newStock };
          }
          return variant;
        });

        await updateDoc(productRef, {
          variants: updatedVariants,
          updatedAt: serverTimestamp()
        });
      } else {
        // Reduce main product stock
        const currentStock = productData.stock || 0;
        const newStock = Math.max(0, currentStock - quantity);
        
        await updateDoc(productRef, {
          stock: newStock,
          sold: (productData.sold || 0) + quantity,
          updatedAt: serverTimestamp()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error reducing stock:', error);
      return { success: false, error: 'Gagal mengurangi stok produk' };
    }
  },

  // Get product with fresh seller information
  async getProductWithSellerInfo(productId) {
    try {
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return { 
          success: false, 
          error: 'Produk tidak ditemukan' 
        };
      }

      const productData = productSnap.data();
      
      // Get fresh seller information
      if (productData.sellerId) {
        const sellerRef = doc(db, 'users', productData.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          
          // Update product data with fresh seller info if needed
          let needsUpdate = false;
          const updatedData = { ...productData };
          
          // Generate current store name
          let currentStoreName = sellerData.storeName;
          if (!currentStoreName || currentStoreName.trim() === '') {
            if (sellerData.name && sellerData.name.trim() !== '') {
              currentStoreName = `Toko ${sellerData.name}`;
            } else {
              currentStoreName = 'Toko Online';
            }
          }
          
          // Check if store info needs updating
          if (productData.storeName !== currentStoreName) {
            updatedData.storeName = currentStoreName;
            needsUpdate = true;
          }
          
          if (productData.storeCity !== (sellerData.city || '')) {
            updatedData.storeCity = sellerData.city || '';
            needsUpdate = true;
          }
          
          if (productData.storeAddress !== (sellerData.address || '')) {
            updatedData.storeAddress = sellerData.address || '';
            needsUpdate = true;
          }
          
          if (productData.storePhone !== (sellerData.phone || '')) {
            updatedData.storePhone = sellerData.phone || '';
            needsUpdate = true;
          }
          
          // Update product if needed
          if (needsUpdate) {
            await updateDoc(productRef, {
              storeName: updatedData.storeName,
              storeCity: updatedData.storeCity,
              storeAddress: updatedData.storeAddress,
              storePhone: updatedData.storePhone,
              updatedAt: serverTimestamp()
            });
          }
          
          return { 
            success: true, 
            product: {
              id: productSnap.id,
              ...updatedData
            }
          };
        }
      }
      
      // Return product as is if no seller found
      return { 
        success: true, 
        product: {
          id: productSnap.id,
          ...productData
        }
      };
    } catch (error) {
      console.error('Error getting product with seller info:', error);
      return { 
        success: false, 
        error: 'Gagal mengambil data produk' 
      };
    }
  }
};