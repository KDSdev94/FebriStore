import AsyncStorage from '@react-native-async-storage/async-storage';

const storeNames = [
  'Toko Elektronik Jaya',
  'Fashion Store Central',
  'Gadget Corner',
  'Style Boutique',
  'Tech World',
  'Trendy Shop',
  'Digital Plaza',
  'Modern Store',
  'Smart Electronics',
  'Urban Fashion'
];

const cities = [
  'Jakarta',
  'Surabaya', 
  'Bandung',
  'Medan',
  'Semarang',
  'Makassar',
  'Palembang',
  'Tangerang',
  'Depok',
  'Bekasi'
];

export const addStoreInfoToProducts = async () => {
  try {
    // Get existing products
    const productsData = await AsyncStorage.getItem('products');
    if (!productsData) {
      console.log('No products found');
      return;
    }

    const products = JSON.parse(productsData);
    
    // Add store info to each product
    const updatedProducts = products.map((product, index) => {
      const storeIndex = index % storeNames.length;
      const cityIndex = index % cities.length;
      
      return {
        ...product,
        sellerId: `seller-${(index + 1).toString().padStart(3, '0')}`,
        sellerName: storeNames[storeIndex],
        storeName: storeNames[storeIndex],
        storeId: `store-${(index + 1).toString().padStart(3, '0')}`,
        storeCity: cities[cityIndex],
        storeRating: (4.0 + Math.random() * 1.0).toFixed(1),
        storeProducts: Math.floor(Math.random() * 500) + 50,
      };
    });

    // Save updated products
    await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
    console.log(`Updated ${updatedProducts.length} products with store information`);
    
    return { success: true, count: updatedProducts.length };
  } catch (error) {
    console.error('Error adding store info to products:', error);
    return { success: false, error: error.message };
  }
};

// Function to add store info to existing orders
export const addStoreInfoToOrders = async () => {
  try {
    // Get existing orders
    const ordersData = await AsyncStorage.getItem('orders');
    if (!ordersData) {
      console.log('No orders found');
      return;
    }

    const orders = JSON.parse(ordersData);
    
    // Add store info to each order item
    const updatedOrders = orders.map(order => {
      const updatedItems = order.items.map((item, index) => {
        const storeIndex = index % storeNames.length;
        
        return {
          ...item,
          sellerId: item.sellerId || `seller-${(index + 1).toString().padStart(3, '0')}`,
          sellerName: item.sellerName || storeNames[storeIndex],
        };
      });

      return {
        ...order,
        items: updatedItems,
        // Ensure customer info exists
        userName: order.userName || 'Customer Name',
        userEmail: order.userEmail || 'customer@example.com',
        userId: order.userId || 'user-123',
      };
    });

    // Save updated orders
    await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
    console.log(`Updated ${updatedOrders.length} orders with store information`);
    
    return { success: true, count: updatedOrders.length };
  } catch (error) {
    console.error('Error adding store info to orders:', error);
    return { success: false, error: error.message };
  }
};