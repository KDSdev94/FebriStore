import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Script untuk menghapus semua data order dari AsyncStorage
 */
export const clearAllOrders = async () => {
  try {
    console.log('Starting to clear all order data...');
    
    // Remove orders from AsyncStorage
    await AsyncStorage.removeItem('orders');
    
    console.log('✅ All order data has been cleared successfully!');
    
    return { 
      success: true, 
      message: 'Semua data pesanan berhasil dihapus'
    };

  } catch (error) {
    console.error('Error clearing order data:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Function to get current order count before clearing
 */
export const getOrderCount = async () => {
  try {
    const ordersData = await AsyncStorage.getItem('orders');
    if (!ordersData) {
      return { success: true, count: 0 };
    }

    const orders = JSON.parse(ordersData);
    return { success: true, count: orders.length };

  } catch (error) {
    console.error('Error getting order count:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Function to clear orders and show summary
 */
export const clearOrdersWithSummary = async () => {
  try {
    // Get current count first
    const countResult = await getOrderCount();
    const currentCount = countResult.success ? countResult.count : 0;
    
    // Clear the orders
    const clearResult = await clearAllOrders();
    
    if (clearResult.success) {
      return {
        success: true,
        message: `${currentCount} pesanan berhasil dihapus`,
        clearedCount: currentCount
      };
    } else {
      return clearResult;
    }

  } catch (error) {
    console.error('Error clearing orders with summary:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};