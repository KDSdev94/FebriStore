import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useOrder } from '../contexts/OrderContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const OrderScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { orders: allOrders, loading, getOrdersByUser, getOrdersByStatus, getStatusInfo, refreshOrders, updateOrderStatus } = useOrder();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const orderTabs = [
    { id: 'all', label: 'Semua', icon: 'format-list-bulleted' },
    { id: 'pending', label: 'Menunggu', icon: 'clock-outline' },
    { id: 'processing', label: 'Diproses', icon: 'package-variant' },
    { id: 'shipped', label: 'Dikirim', icon: 'truck-delivery' },
    { id: 'delivered', label: 'Selesai', icon: 'check-circle' },
  ];

  // Get user's orders
  const userOrders = getOrdersByUser(user?.id);

  // ✅ Auto-refresh when component mounts and when orders might change
  useEffect(() => {
    refreshOrders();
  }, []);

  // ✅ Listen for navigation focus events using useEffect approach
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshOrders();
    });

    return unsubscribe;
  }, [navigation, refreshOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handlePayment = (order) => {
    if (order.paymentMethod === 'cod') {
      // COD - langsung konfirmasi pembayaran
      Alert.alert(
        'Konfirmasi Pembayaran',
        'Apakah Anda yakin ingin mengkonfirmasi pembayaran COD untuk pesanan ini?',
        [
          {
            text: 'Batal',
            style: 'cancel',
          },
          {
            text: 'Konfirmasi',
            style: 'default',
            onPress: async () => {
              const result = await updateOrderStatus(order.id, 'payment_confirmed');
              if (result.success) {
                Alert.alert('Berhasil', 'Pembayaran COD berhasil dikonfirmasi!');
                await refreshOrders();
              } else {
                Alert.alert('Error', result.error || 'Gagal mengkonfirmasi pembayaran');
              }
            }
          }
        ]
      );
    } else {
      // Transfer - arahkan ke detail untuk upload bukti pembayaran
      navigation.navigate('OrderDetail', { order });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Filter orders based on selected tab
  const filteredOrders = selectedTab === 'all' 
    ? userOrders 
    : userOrders.filter(order => {
        // Map status for filtering
        const statusMap = {
          'pending': ['pending_payment', 'pending', 'pending_verification'],
          'processing': ['payment_confirmed', 'processing'],
          'shipped': ['shipped'],
          'delivered': ['delivered', 'completed', 'cod_delivered']
        };
        return statusMap[selectedTab]?.includes(order.status);
      });

  const renderTabItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.tabItem,
        selectedTab === item.id && styles.tabItemActive
      ]}
      onPress={() => setSelectedTab(item.id)}
    >
      <MaterialCommunityIcons 
        name={item.icon} 
        size={20} 
        color={selectedTab === item.id ? COLORS.card : COLORS.textLight} 
      />
      <Text style={[
        styles.tabText,
        selectedTab === item.id && styles.tabTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
      >
        {/* Header dengan Order ID, Tanggal, dan Status */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>#{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <MaterialCommunityIcons 
              name={statusInfo.icon} 
              size={14} 
              color={COLORS.card} 
            />
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* Informasi Toko */}
        {(() => {
          const sellers = [...new Set(item.items.map(orderItem => orderItem.sellerName).filter(Boolean))];
          return sellers.length > 0 && (
            <View style={styles.sellersContainer}>
              <MaterialCommunityIcons name="store" size={16} color={COLORS.primary} />
              <Text style={styles.sellersText}>
                {sellers.length === 1 
                  ? sellers[0]
                  : sellers.length === 2
                    ? `${sellers[0]}, ${sellers[1]}`
                    : sellers.length > 2
                      ? `${sellers[0]}, ${sellers[1]} +${sellers.length - 2} toko lainnya`
                      : sellers[0]
                }
              </Text>
            </View>
          );
        })()}

        {/* Daftar Produk */}
        <View style={styles.orderItems}>
          {item.items.slice(0, 3).map((orderItem, index) => (
            <View key={`${orderItem.productId}-${index}`} style={styles.orderItemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.productName}
              </Text>
              <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
            </View>
          ))}
          {item.items.length > 3 && (
            <Text style={styles.moreItems}>
              +{item.items.length - 3} produk lainnya
            </Text>
          )}
        </View>

        {/* Footer dengan Total dan Actions */}
        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total: </Text>
            <Text style={styles.totalAmount}>
              {formatPrice(
                item.paymentMethod === 'cod' 
                  ? item.subtotal || (item.totalAmount - (item.adminFee || 1500)) // COD tanpa biaya admin
                  : item.totalAmount // Non-COD dengan biaya admin
              )}
            </Text>
          </View>
          
          <View style={styles.orderActions}>
            {(item.status === 'pending_payment' || item.status === 'pending') && (
              <TouchableOpacity 
                style={styles.payButton}
                onPress={() => handlePayment(item)}
              >
                <MaterialCommunityIcons name="credit-card" size={14} color={COLORS.card} />
                <Text style={styles.payButtonText}>Bayar</Text>
              </TouchableOpacity>
            )}
            {item.status === 'pending_verification' && (
              <View style={[styles.statusIndicator, styles.waitingIndicator]}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.warning} />
                <Text style={styles.waitingText}>Menunggu Verifikasi</Text>
              </View>
            )}
            {item.status === 'payment_confirmed' && (
              <View style={[styles.statusIndicator, styles.confirmedIndicator]}>
                <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} />
                <Text style={styles.confirmedText}>Pembayaran Dikonfirmasi</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.detailButton}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            >
              <Text style={styles.detailButtonText}>Detail</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyOrders = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="clipboard-list-outline" size={80} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
      <Text style={styles.emptySubtitle}>
        Anda belum memiliki pesanan.{'\n'}
        Yuk, mulai berbelanja sekarang!
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Mulai Belanja</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={orderTabs}
          renderItem={renderTabItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsList}
        />
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        renderEmptyOrders()
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  tabsContainer: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabsList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.card,
  },
  ordersList: {
    paddingVertical: SPACING.sm,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  orderDate: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 120,
    justifyContent: 'center',
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    marginLeft: SPACING.xs,
    fontWeight: 'bold',
    fontSize: 12,
  },
  sellersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  sellersText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: '600',
    flex: 1,
  },
  orderItems: {
    marginBottom: SPACING.md,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
  },
  itemName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
    fontWeight: '500',
  },
  itemQuantity: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
  },
  moreItems: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  orderFooter: {
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  totalLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  payButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    elevation: 2,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  payButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  waitingIndicator: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  waitingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontWeight: '600',
  },
  confirmedIndicator: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  confirmedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '600',
  },
  detailButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  detailButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  shopButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    fontWeight: '600',
  },
});

export default OrderScreen;