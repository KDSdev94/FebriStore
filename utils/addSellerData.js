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
  'Urban Fashion',
  'Mega Store',
  'Super Shop',
  'Elite Store',
  'Premium Outlet',
  'Grand Mall'
];

export const addSellerDataToProducts = async () => {
  try {
    console.log('Starting to add seller data to products...');
    
    // Get existing products
    const productsData = await AsyncStorage.getItem('products');
    if (!productsData) {
      console.log('No products found');
      return { success: false, error: 'No products found' };
    }

    const products = JSON.parse(productsData);
    console.log(`Found ${products.length} products`);
    
    // Add seller info to each product
    const updatedProducts = products.map((product, index) => {
      const storeIndex = index % storeNames.length;
      const storeName = storeNames[storeIndex];
      
      return {
        ...product,
        sellerId: `seller-${(index + 1).toString().padStart(3, '0')}`,
        sellerName: storeName,
        storeName: storeName,
        storeId: `store-${(index + 1).toString().padStart(3, '0')}`,
      };
    });

    // Save updated products
    await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
    console.log(`Successfully updated ${updatedProducts.length} products with seller data`);
    
    return { success: true, count: updatedProducts.length };
  } catch (error) {
    console.error('Error adding seller data to products:', error);
    return { success: false, error: error.message };
  }
};

export const addSellerDataToOrders = async () => {
  try {
    console.log('Starting to add seller data to orders...');
    
    // Get existing orders
    const ordersData = await AsyncStorage.getItem('orders');
    if (!ordersData) {
      console.log('No orders found');
      return { success: false, error: 'No orders found' };
    }

    const orders = JSON.parse(ordersData);
    console.log(`Found ${orders.length} orders`);
    
    // Add seller info to each order item
    const updatedOrders = orders.map(order => {
      const updatedItems = order.items.map((item, index) => {
        const storeIndex = index % storeNames.length;
        const storeName = storeNames[storeIndex];
        
        return {
          ...item,
          sellerId: item.sellerId || `seller-${(index + 1).toString().padStart(3, '0')}`,
          sellerName: item.sellerName || storeName,
        };
      });

      return {
        ...order,
        items: updatedItems,
        // Ensure customer info exists
        userName: order.userName || 'Customer Name',
        userEmail: order.userEmail || 'customer@example.com',
      };
    });

    // Save updated orders
    await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
    console.log(`Successfully updated ${updatedOrders.length} orders with seller data`);
    
    return { success: true, count: updatedOrders.length };
  } catch (error) {
    console.error('Error adding seller data to orders:', error);
    return { success: false, error: error.message };
  }
};

// Function to run both updates
export const updateAllSellerData = async () => {
  try {
    console.log('Starting complete seller data update...');
    
    const productResult = await addSellerDataToProducts();
    const orderResult = await addSellerDataToOrders();
    
    if (productResult.success && orderResult.success) {
      console.log('All seller data updated successfully');
      return {
        success: true,
        productCount: productResult.count,
        orderCount: orderResult.count
      };
    } else {
      return {
        success: false,
        error: `Product update: ${productResult.success ? 'OK' : productResult.error}, Order update: ${orderResult.success ? 'OK' : orderResult.error}`
      };
    }
  } catch (error) {
    console.error('Error in complete seller data update:', error);
    return { success: false, error: error.message };
  }
};