import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderService } from '../services/orderService';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load orders from Firebase on app start
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await orderService.getAllOrders();
      if (result.success) {
        setOrders(result.orders);
      } else {
        console.error('Error loading orders:', result.error);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOrders = async (ordersData) => {
    try {
      await AsyncStorage.setItem('orders', JSON.stringify(ordersData));
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  };

  const createOrder = async (orderData) => {
    try {
      // Generate order number
      const orderNumber = `ORD${Date.now().toString().slice(-6)}`;
      
      // Prepare order data for Firebase
      const firebaseOrderData = {
        ...orderData,
        orderNumber,
        // Extract seller info from first item (assuming single seller per order)
        sellerId: orderData.items[0]?.sellerId || 'unknown',
        sellerName: orderData.items[0]?.sellerName || 'Unknown Seller',
        storeName: orderData.items[0]?.storeName || 'Unknown Store',
      };

      // Create order in Firebase
      const result = await orderService.createOrder(firebaseOrderData);
      
      if (result.success) {
        // Also save to AsyncStorage for backward compatibility
        const newOrder = {
          id: result.orderId,
          orderNumber,
          ...orderData,
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        await saveOrders(updatedOrders);

        return { success: true, order: { ...newOrder, id: result.orderId } };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: 'Gagal membuat pesanan' };
    }
  };

  const updateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
    try {
      // Update order status in Firebase
      const result = await orderService.updateOrderStatus(orderId, newStatus, additionalData);
      
      if (result.success) {
        // Update local state
        const updatedOrders = orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString(), ...additionalData }
            : order
        );
        
        setOrders(updatedOrders);
        await saveOrders(updatedOrders);

        return { success: true };
      } else {
        return { success: false, error: result.error || 'Gagal memperbarui status pesanan' };
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Gagal memperbarui status pesanan' };
    }
  };

  const updatePaymentProof = async (orderId, paymentProofUri) => {
    try {
      // Update payment proof in Firebase
      const result = await orderService.updatePaymentProof(orderId, paymentProofUri);
      
      if (result.success) {
        // Update local state with correct status from database
        const updatedOrders = orders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                paymentProof: paymentProofUri,
                paymentProofUploadedAt: new Date().toISOString(),
                status: 'pending_verification', // ✅ Sync with database status
                paymentStatus: 'proof_uploaded', // ✅ Add payment status
                updatedAt: new Date().toISOString()
              }
            : order
        );
        
        setOrders(updatedOrders);
        await saveOrders(updatedOrders);

        return { success: true, updatedOrder: updatedOrders.find(o => o.id === orderId) };
      } else {
        return { success: false, error: result.error || 'Gagal mengupload bukti pembayaran' };
      }
    } catch (error) {
      console.error('Error updating payment proof:', error);
      return { success: false, error: 'Gagal mengupload bukti pembayaran' };
    }
  };

  const getOrderById = (orderId) => {
    return orders.find(order => order.id === orderId);
  };

  const getOrdersByStatus = (status) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  };

  const getOrdersByUser = (userId) => {
    return orders.filter(order => order.userId === userId);
  };

  const refreshOrders = async () => {
    await loadOrders();
  };

  const clearAllOrders = async () => {
    try {
      // Clear orders from state
      setOrders([]);
      
      // Clear orders from AsyncStorage
      await AsyncStorage.removeItem('orders');
      
      return { success: true, message: 'Semua pesanan berhasil dihapus' };
    } catch (error) {
      console.error('Error clearing all orders:', error);
      return { success: false, error: 'Gagal menghapus pesanan' };
    }
  };

  // Admin verify payment
  const verifyPayment = async (orderId, isApproved, adminNotes = '') => {
    try {
      const result = await orderService.verifyPayment(orderId, isApproved, adminNotes);
      
      if (result.success) {
        // Refresh orders to get updated data
        await loadOrders();
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Gagal memverifikasi pembayaran' };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: 'Gagal memverifikasi pembayaran' };
    }
  };

  // Order status mapping
  const getStatusInfo = (status) => {
    const statusMap = {
      'pending': {
        label: 'Menunggu Pembayaran',
        color: '#FF9500',
        icon: 'clock-outline'
      },
      'pending_payment': {
        label: 'Menunggu Pembayaran',
        color: '#FF9500',
        icon: 'clock-outline'
      },
      'pending_verification': {
        label: 'Menunggu Verifikasi Admin',
        color: '#FF6B35',
        icon: 'account-check-outline'
      },
      'payment_confirmed': {
        label: 'Pembayaran Dikonfirmasi',
        color: '#007AFF',
        icon: 'check-circle-outline'
      },
      'cod_confirmed': {
        label: 'COD - Pesanan Dikonfirmasi',
        color: '#007AFF',
        icon: 'cash-check'
      },
      'cod_processing': {
        label: 'COD - Sedang Diproses',
        color: '#5856D6',
        icon: 'package-variant'
      },
      'cod_shipped': {
        label: 'COD - Dalam Pengiriman',
        color: '#32D74B',
        icon: 'truck-delivery'
      },
      'cod_delivered': {
        label: 'COD - Barang Diterima & Dibayar',
        color: '#34C759',
        icon: 'cash-check'
      },
      'processing': {
        label: 'Diproses',
        color: '#5856D6',
        icon: 'package-variant'
      },
      'approved': {
        label: 'Disetujui Admin',
        color: '#007AFF',
        icon: 'check-circle-outline'
      },
      'rejected': {
        label: 'Ditolak Admin',
        color: '#FF3B30',
        icon: 'close-circle-outline'
      },
      'shipped': {
        label: 'Dikirim',
        color: '#32D74B',
        icon: 'truck-delivery'
      },
      'delivered': {
        label: 'Diterima',
        color: '#34C759',
        icon: 'check-all'
      },
      'completed': {
        label: 'Selesai',
        color: '#34C759',
        icon: 'check-circle'
      },
      'verified': {
        label: 'Terverifikasi',
        color: '#007AFF',
        icon: 'check-circle-outline'
      },
      'confirmed': {
        label: 'Dikonfirmasi',
        color: '#007AFF',
        icon: 'check-circle-outline'
      },
      'cancelled': {
        label: 'Dibatalkan',
        color: '#FF3B30',
        icon: 'close-circle-outline'
      },
      'refunded': {
        label: 'Dikembalikan',
        color: '#8E8E93',
        icon: 'undo-variant'
      }
    };

    if (!statusMap[status]) {
      console.warn('Unknown order status:', status);
    }
    
    return statusMap[status] || {
      label: 'Status Tidak Dikenal',
      color: '#8E8E93',
      icon: 'help-circle-outline'
    };
  };

  const value = {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    updatePaymentProof,
    verifyPayment,
    getOrderById,
    getOrdersByStatus,
    getOrdersByUser,
    getStatusInfo,
    loadOrders,
    refreshOrders,
    clearAllOrders,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContext;