import { db } from '../firebaseConfig.js';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc,
  query,
  where
} from 'firebase/firestore';

/**
 * Script untuk memperbarui nama toko pada produk yang sudah ada
 * Akan menggunakan nama user sebagai basis nama toko
 */
export const updateProductStoreNames = async () => {
  try {
    console.log('Starting to update product store names...');
    
    // Get all products
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    
    if (productsSnapshot.empty) {
      console.log('No products found');
      return { success: true, message: 'No products to update' };
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Process each product
    for (const productDoc of productsSnapshot.docs) {
      try {
        const productData = productDoc.data();
        const productId = productDoc.id;
        
        // Skip if product already has a proper store name (not "Toko Tidak Diketahui")
        if (productData.storeName && 
            productData.storeName !== 'Toko Tidak Diketahui' && 
            productData.storeName.trim() !== '') {
          console.log(`Product ${productId} already has store name: ${productData.storeName}`);
          continue;
        }

        // Get seller information
        if (!productData.sellerId) {
          console.log(`Product ${productId} has no sellerId, skipping...`);
          continue;
        }

        // Get seller data from users collection
        const userRef = doc(db, 'users', productData.sellerId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log(`Seller ${productData.sellerId} not found for product ${productId}`);
          continue;
        }

        const userData = userDoc.data();
        
        // Generate store name
        let newStoreName = userData.storeName;
        if (!newStoreName || newStoreName.trim() === '') {
          if (userData.name && userData.name.trim() !== '') {
            newStoreName = `Toko ${userData.name}`;
          } else {
            newStoreName = 'Toko Online';
          }
        }

        // Update product with new store information
        const updateData = {
          storeName: newStoreName,
          storeCity: userData.city || productData.storeCity || '',
          storeAddress: userData.address || productData.storeAddress || '',
          storePhone: userData.phone || productData.storePhone || ''
        };

        await updateDoc(doc(db, 'products', productId), updateData);
        
        console.log(`Updated product ${productId} with store name: ${newStoreName}`);
        updatedCount++;

      } catch (error) {
        console.error(`Error updating product ${productDoc.id}:`, error);
        errorCount++;
      }
    }

    const message = `Updated ${updatedCount} products. ${errorCount} errors occurred.`;
    console.log(message);
    
    return { 
      success: true, 
      message,
      updatedCount,
      errorCount
    };

  } catch (error) {
    console.error('Error updating product store names:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Function to update a specific product's store name
 */
export const updateSingleProductStoreName = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      return { success: false, error: 'Product not found' };
    }

    const productData = productDoc.data();
    
    if (!productData.sellerId) {
      return { success: false, error: 'Product has no sellerId' };
    }

    // Get seller data
    const userRef = doc(db, 'users', productData.sellerId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'Seller not found' };
    }

    const userData = userDoc.data();
    
    // Generate store name
    let newStoreName = userData.storeName;
    if (!newStoreName || newStoreName.trim() === '') {
      if (userData.name && userData.name.trim() !== '') {
        newStoreName = `Toko ${userData.name}`;
      } else {
        newStoreName = 'Toko Online';
      }
    }

    // Update product
    const updateData = {
      storeName: newStoreName,
      storeCity: userData.city || productData.storeCity || '',
      storeAddress: userData.address || productData.storeAddress || '',
      storePhone: userData.phone || productData.storePhone || ''
    };

    await updateDoc(productRef, updateData);
    
    return { 
      success: true, 
      message: `Product updated with store name: ${newStoreName}`,
      storeName: newStoreName
    };

  } catch (error) {
    console.error('Error updating single product store name:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};