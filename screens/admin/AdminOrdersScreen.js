import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useOrder } from '../../contexts/OrderContext';
import { adminService } from '../../services/adminService';


const AdminOrdersScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { orders: allOrders, loading: ordersLoading, getOrdersByStatus, getStatusInfo, updateOrderStatus, loadOrders } = useOrder();
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Calculate counts for each filter
  const getFilterCounts = () => {
    return {
      all: allOrders.length,
      pending_payment: allOrders.filter(order => order.status === 'pending_payment').length,
      pending_verification: allOrders.filter(order => order.status === 'pending_verification').length,
      payment_confirmed: allOrders.filter(order => order.status === 'payment_confirmed').length,
      processing: allOrders.filter(order => order.status === 'processing').length,
      shipped: allOrders.filter(order => order.status === 'shipped').length,
      delivered: allOrders.filter(order => order.status === 'delivered').length,
      cancelled: allOrders.filter(order => order.status === 'cancelled').length,
    };
  };

  const counts = getFilterCounts();

  const filterOptions = [
    { key: 'all', label: 'Semua Pesanan', count: counts.all },
    { key: 'pending_payment', label: 'Menunggu Pembayaran', count: counts.pending_payment },
    { key: 'pending_verification', label: 'Perlu Verifikasi', count: counts.pending_verification },
    { key: 'payment_confirmed', label: 'Perlu Diproses', count: counts.payment_confirmed },
    { key: 'processing', label: 'Sedang Diproses', count: counts.processing },
    { key: 'shipped', label: 'Dikirim', count: counts.shipped },
    { key: 'delivered', label: 'Selesai', count: counts.delivered },
    { key: 'cancelled', label: 'Dibatalkan', count: counts.cancelled },
  ];

  useEffect(() => {
    // Set initial filter from route params
    if (route.params?.filter) {
      setSelectedFilter(route.params.filter);
    }
  }, []);

  useEffect(() => {
    filterOrders();
  }, [allOrders, selectedFilter]);

  const filterOrders = () => {
    let filtered = allOrders;
    
    if (selectedFilter !== 'all') {
      filtered = allOrders.filter(order => order.status === selectedFilter);
    }
    
    // Sort by creation date (newest first)
    filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredOrders(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVerifyPayment = (order) => {
    setSelectedOrder(order);
    setVerificationNotes('');
    setShowVerificationModal(true);
  };

  const processVerification = async (status) => {
    if (!selectedOrder) return;

    try {
      const verificationData = {
        status: status, // 'approved' or 'rejected'
        adminId: user.id,
        notes: verificationNotes,
        rejectionReason: status === 'rejected' ? verificationNotes : ''
      };

      const result = await adminService.verifyPayment(selectedOrder.id, verificationData);
      
      if (result.success) {
        Alert.alert(
          'Berhasil',
          `Pembayaran ${status === 'approved' ? 'disetujui' : 'ditolak'}`
        );
        setShowVerificationModal(false);
        loadOrders(); // Reload data
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error processing verification:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memproses verifikasi');
    }
  };

  const renderOrderItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('AdminOrderDetail', { order: item })}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{item.orderNumber}</Text>
          <Text style={styles.orderAmount}>
            {formatCurrency(
              item.paymentMethod === 'cod' 
                ? item.subtotal || (item.totalAmount - (item.adminFee || 1500)) // COD tanpa biaya admin
                : item.totalAmount // Non-COD dengan biaya admin
            )}
          </Text>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.buyerText}>Customer: {item.userName}</Text>
          <Text style={styles.emailText}>{item.userEmail}</Text>
          <Text style={styles.itemCountText}>{item.itemCount} produk</Text>
          
          {/* Show seller info */}
          {(() => {
            const sellers = [...new Set(item.items.map(orderItem => orderItem.sellerName).filter(Boolean))];
            return sellers.length > 0 && (
              <View style={styles.sellersContainer}>
                <MaterialCommunityIcons name="store" size={14} color={COLORS.textSecondary} />
                <Text style={styles.sellersText}>
                  {sellers.length === 1 
                    ? `Toko: ${sellers[0]}` 
                    : `${sellers.length} toko: ${sellers[0]}${sellers.length > 1 ? ` +${sellers.length - 1} lainnya` : ''}`
                  }
                </Text>
              </View>
            );
          })()}
        </View>

        <View style={styles.paymentInfo}>
          {item.paymentMethod === 'cod' ? (
            <View style={styles.codIndicator}>
              <MaterialCommunityIcons name="cash" size={16} color={COLORS.success} />
              <Text style={styles.codText}>COD - Gratis Admin</Text>
            </View>
          ) : (
            <>
              <Text style={styles.paymentMethodText}>Transfer Bank</Text>
              <View style={styles.proofStatus}>
                {item.paymentProof ? (
                  <View style={styles.proofIndicator}>
                    <MaterialCommunityIcons name="image" size={16} color={COLORS.success} />
                    <Text style={styles.proofText}>Ada bukti</Text>
                  </View>
                ) : (
                  <View style={styles.proofIndicator}>
                    <MaterialCommunityIcons name="image-off" size={16} color={COLORS.textLight} />
                    <Text style={styles.noProofText}>Belum ada bukti</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
        
        <View style={styles.orderFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <MaterialCommunityIcons name={statusInfo.icon} size={14} color={COLORS.card} />
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
          
          {/* Quick Action Buttons */}
          {item.status === 'pending_verification' && item.paymentProof && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleVerifyPayment(item);
              }}
            >
              <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
              <Text style={styles.quickActionText}>Verifikasi</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterTab = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterTab,
        selectedFilter === item.key && styles.activeFilterTab
      ]}
      onPress={() => setSelectedFilter(item.key)}
    >
      <Text style={[
        styles.filterTabText,
        selectedFilter === item.key && styles.activeFilterTabText
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  if (ordersLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pesanan</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('AdminSettings')}
          >
            <MaterialCommunityIcons name="cog" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat pesanan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('AdminSettings')}
        >
          <MaterialCommunityIcons name="cog" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Management Title */}
        <Text style={styles.managementTitle}>Manajemen Pesanan</Text>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter.key && styles.activeFilterTabText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Orders List */}
        <View style={styles.ordersList}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Tidak ada pesanan</Text>
              <Text style={styles.emptySubtext}>Pesanan akan muncul di sini</Text>
            </View>
          ) : (
            filteredOrders.map((item) => (
              <View key={item.id}>
                {renderOrderItem({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verifikasi Pembayaran</Text>
              <TouchableOpacity
                onPress={() => setShowVerificationModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Catatan Verifikasi:</Text>
              <TextInput
                style={styles.modalTextInput}
                value={verificationNotes}
                onChangeText={setVerificationNotes}
                placeholder="Tambahkan catatan (opsional)"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.rejectButton]}
                  onPress={() => processVerification('rejected')}
                >
                  <Text style={styles.rejectButtonText}>Tolak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.approveButton]}
                  onPress={() => processVerification('approved')}
                >
                  <Text style={styles.approveButtonText}>Setujui</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateButton: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  managementTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  filterScrollView: {
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingRight: 16,
  },
  filterTab: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  activeFilterTabText: {
    color: COLORS.white,
  },
  ordersList: {
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    ...TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  orderAmount: {
    ...TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  buyerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sellerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    fontWeight: '600',
  },
  orderDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  orderDetails: {
    marginBottom: SPACING.md,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  orderDetailText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  orderAmount: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  modalLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  modalTextInput: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  rejectButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    fontWeight: '600',
  },
  approveButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    fontWeight: '600',
  },
  // New styles for updated components
  orderInfo: {
    marginBottom: SPACING.sm,
  },
  emailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemCountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sellersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.xs,
  },
  sellersText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  paymentMethodText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  proofStatus: {
    alignItems: 'flex-end',
  },
  codIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  codText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  proofIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proofText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  noProofText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.sm,
  },
  quickActionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});

export default AdminOrdersScreen;