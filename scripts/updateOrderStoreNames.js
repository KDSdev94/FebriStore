import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Script untuk memperbarui order yang sudah ada dengan field storeName
 * yang konsisten dengan nama toko di detail produk
 */
export const updateOrderStoreNames = async () => {
  try {
    console.log('Starting to update order store names...');
    
    // Get existing orders from AsyncStorage
    const ordersData = await AsyncStorage.getItem('orders');
    if (!ordersData) {
      console.log('No orders found');
      return { success: true, message: 'No orders to update' };
    }

    const orders = JSON.parse(ordersData);
    let updatedCount = 0;
    let errorCount = 0;

    // Update each order
    const updatedOrders = orders.map(order => {
      try {
        // Update items in each order
        const updatedItems = order.items.map(item => {
          // Ensure storeName field exists and is consistent
          const storeName = item.storeName || item.sellerName || 'Toko Tidak Dikenal';
          
          return {
            ...item,
            storeName: storeName,
            sellerName: storeName // Keep sellerName for backward compatibility
          };
        });

        updatedCount++;
        return {
          ...order,
          items: updatedItems,
          updatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error updating order ${order.id}:`, error);
        errorCount++;
        return order; // Return original order if update fails
      }
    });

    // Save updated orders back to AsyncStorage
    await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    const message = `Updated ${updatedCount} orders. ${errorCount} errors occurred.`;
    console.log(message);
    
    return { 
      success: true, 
      message,
      updatedCount,
      errorCount
    };

  } catch (error) {
    console.error('Error updating order store names:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Function to update a specific order's store names
 */
export const updateSingleOrderStoreNames = async (orderId) => {
  try {
    const ordersData = await AsyncStorage.getItem('orders');
    if (!ordersData) {
      return { success: false, error: 'No orders found' };
    }

    const orders = JSON.parse(ordersData);
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return { success: false, error: 'Order not found' };
    }

    const order = orders[orderIndex];
    
    // Update items in the order
    const updatedItems = order.items.map(item => {
      const storeName = item.storeName || item.sellerName || 'Toko Tidak Dikenal';
      
      return {
        ...item,
        storeName: storeName,
        sellerName: storeName
      };
    });

    // Update the order
    orders[orderIndex] = {
      ...order,
      items: updatedItems,
      updatedAt: new Date().toISOString()
    };

    // Save back to AsyncStorage
    await AsyncStorage.setItem('orders', JSON.stringify(orders));
    
    return { 
      success: true, 
      message: `Order ${orderId} updated successfully`
    };

  } catch (error) {
    console.error('Error updating single order store names:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};