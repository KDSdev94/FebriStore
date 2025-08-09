import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOrder } from '../../contexts/OrderContext';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/constants';

const AdminOrderDetailScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const { updateOrderStatus, getStatusInfo, verifyPayment } = useOrder();
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [sellersData, setSellersData] = useState({});

  useEffect(() => {
    fetchSellersData();
  }, []);

  const fetchSellersData = async () => {
    try {
      // Get unique seller IDs from order items
      const sellerIds = [...new Set(order.items.map(item => item.sellerId).filter(Boolean))];
      const sellersInfo = {};

      for (const sellerId of sellerIds) {
        try {
          const sellerRef = doc(db, 'users', sellerId);
          const sellerSnap = await getDoc(sellerRef);
          
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            sellersInfo[sellerId] = {
              id: sellerId,
              name: sellerData.name || 'Nama Penjual Tidak Dikenal',
              storeName: sellerData.storeName || 'Toko Tidak Dikenal',
              phone: sellerData.phone || 'Nomor telepon tidak tersedia',
              sellerBankName: sellerData.sellerBankName || 'Bank tidak tersedia',
              sellerBankAccount: sellerData.sellerBankAccount || 'Nomor rekening tidak tersedia',
              sellerAccountName: sellerData.sellerAccountName || 'Nama pemilik rekening tidak tersedia',
            };
          } else {
            // Fallback data if seller not found
            sellersInfo[sellerId] = {
              id: sellerId,
              name: 'Nama Penjual Tidak Dikenal',
              storeName: 'Toko Tidak Dikenal',
              phone: 'Nomor telepon tidak tersedia',
              sellerBankName: 'Bank tidak tersedia',
              sellerBankAccount: 'Nomor rekening tidak tersedia',
              sellerAccountName: 'Nama pemilik rekening tidak tersedia',
            };
          }
        } catch (error) {
          console.error(`Error fetching seller ${sellerId}:`, error);
          // Set fallback data for this seller
          sellersInfo[sellerId] = {
            id: sellerId,
            name: 'Nama Penjual Tidak Dikenal',
            storeName: 'Toko Tidak Dikenal',
            phone: 'Nomor telepon tidak tersedia',
            sellerBankName: 'Bank tidak tersedia',
            sellerBankAccount: 'Nomor rekening tidak tersedia',
            sellerAccountName: 'Nama pemilik rekening tidak tersedia',
          };
        }
      }

      setSellersData(sellersInfo);
    } catch (error) {
      console.error('Error fetching sellers data:', error);
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
    if (!dateString) return 'Tidak diketahui';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Tidak diketahui';
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusInfo = getStatusInfo(order.status);

  const statusOptions = [
    { 
      id: 'pending_payment', 
      label: 'Menunggu Pembayaran', 
      color: '#FF9500',
      icon: 'clock-outline',
      description: 'Pesanan menunggu pembayaran dari customer'
    },
    { 
      id: 'pending_verification', 
      label: 'Menunggu Verifikasi', 
      color: '#FF6B35',
      icon: 'account-check-outline',
      description: 'Bukti pembayaran menunggu verifikasi admin'
    },
    { 
      id: 'payment_confirmed', 
      label: 'Pembayaran Dikonfirmasi', 
      color: '#007AFF',
      icon: 'check-circle-outline',
      description: 'Pembayaran telah dikonfirmasi, siap diproses'
    },
    { 
      id: 'processing', 
      label: 'Sedang Diproses', 
      color: '#5856D6',
      icon: 'package-variant',
      description: 'Pesanan sedang disiapkan'
    },
    { 
      id: 'shipped', 
      label: 'Dalam Pengiriman', 
      color: '#32D74B',
      icon: 'truck-delivery',
      description: 'Pesanan sedang dikirim ke customer'
    },
    { 
      id: 'delivered', 
      label: 'Pesanan Selesai', 
      color: '#34C759',
      icon: 'check-all',
      description: 'Pesanan telah diterima customer'
    },
    { 
      id: 'cancelled', 
      label: 'Dibatalkan', 
      color: '#FF3B30',
      icon: 'close-circle-outline',
      description: 'Pesanan dibatalkan'
    }
  ];

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    
    try {
      const result = await updateOrderStatus(order.id, newStatus);
      
      if (result.success) {
        setShowStatusModal(false);
        Alert.alert('Berhasil', 'Status pesanan berhasil diperbarui');
        // Refresh order data
        navigation.setParams({ 
          order: { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        });
      } else {
        Alert.alert('Error', result.error || 'Gagal memperbarui status pesanan');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memperbarui status');
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyPayment = async (isApproved) => {
    setUpdating(true);
    
    try {
      const result = await verifyPayment(order.id, isApproved, verificationNotes);
      
      if (result.success) {
        setShowVerificationModal(false);
        setVerificationNotes('');
        Alert.alert(
          'Berhasil', 
          isApproved ? 'Pembayaran berhasil dikonfirmasi' : 'Pembayaran ditolak'
        );
        // Refresh order data
        const newStatus = isApproved ? 'payment_confirmed' : 'pending_payment';
        navigation.setParams({ 
          order: { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        });
      } else {
        Alert.alert('Error', result.error || 'Gagal memverifikasi pembayaran');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memverifikasi pembayaran');
    } finally {
      setUpdating(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Detail Pesanan Admin</Text>
      <TouchableOpacity 
        style={styles.statusButton}
        onPress={() => setShowStatusModal(true)}
      >
        <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderOrderInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>ID Pesanan</Text>
        <Text style={styles.infoValue}>#{order.orderNumber}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Tanggal Pesanan</Text>
        <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Terakhir Update</Text>
        <Text style={styles.infoValue}>{formatDate(order.updatedAt)}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status Pesanan</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <MaterialCommunityIcons name={statusInfo.icon} size={16} color={COLORS.card} />
          <Text style={styles.statusText}>{statusInfo.label}</Text>
        </View>
      </View>
    </View>
  );

  const renderCustomerInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informasi Customer</Text>
      
      <View style={styles.customerContainer}>
        <View style={styles.customerHeader}>
          <MaterialCommunityIcons name="account-circle" size={24} color={COLORS.primary} />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>
              {order.userName || 'Unknown Customer'}
            </Text>
            <Text style={styles.customerEmail}>
              {order.userEmail || 'No Email'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPaymentInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informasi Pembayaran</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Metode Pembayaran</Text>
        <Text style={styles.infoValue}>
          {order.paymentMethod === 'transfer' ? 'Transfer Bank' : 'Bayar di Tempat (COD)'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status Pembayaran</Text>
        <View style={[
          styles.paymentStatusBadge,
          { 
            backgroundColor: 
              order.status === 'pending_payment' ? COLORS.warning : 
              order.status === 'pending_verification' ? '#FF6B35' : 
              COLORS.success 
          }
        ]}>
          <Text style={styles.paymentStatusText}>
            {order.status === 'pending_payment' ? 'Belum Bayar' : 
             order.status === 'pending_verification' ? 'Perlu Verifikasi' :
             'Sudah Bayar'}
          </Text>
        </View>
      </View>

      {order.paymentMethod === 'transfer' && order.paymentProof && (
        <View style={styles.paymentProofSection}>
          <Text style={styles.paymentProofTitle}>Bukti Pembayaran:</Text>
          <View style={styles.proofContainer}>
            <TouchableOpacity 
              onPress={() => setShowImageModal(true)}
              style={styles.proofImageContainer}
            >
              <Image source={{ uri: order.paymentProof }} style={styles.proofImage} />
              <View style={styles.imageOverlay}>
                <MaterialCommunityIcons name="magnify-plus" size={24} color={COLORS.card} />
                <Text style={styles.imageOverlayText}>Tap untuk memperbesar</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.proofUploadDate}>
              Diupload: {order.paymentProofUploadedAt ? formatDate(order.paymentProofUploadedAt) : 'Tidak diketahui'}
            </Text>
          </View>
        </View>
      )}

      {order.paymentMethod === 'transfer' && !order.paymentProof && (
        <View style={styles.noProofContainer}>
          <MaterialCommunityIcons name="image-off" size={48} color={COLORS.textLight} />
          <Text style={styles.noProofText}>Belum ada bukti pembayaran</Text>
        </View>
      )}

      {/* Payment Verification Actions */}
      {order.status === 'pending_verification' && order.paymentProof && (
        <View style={styles.verificationActions}>
          <Text style={styles.verificationTitle}>Verifikasi Pembayaran</Text>
          <Text style={styles.verificationSubtitle}>
            Periksa bukti pembayaran di atas dan pilih tindakan:
          </Text>
          
          <View style={styles.verificationButtons}>
            <TouchableOpacity 
              style={[styles.verificationButton, styles.approveButton]}
              onPress={() => setShowVerificationModal(true)}
              disabled={updating}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.card} />
              <Text style={styles.verificationButtonText}>Konfirmasi Pembayaran</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.verificationButton, styles.rejectButton]}
              onPress={() => handleVerifyPayment(false)}
              disabled={updating}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.card} />
              <Text style={styles.verificationButtonText}>Tolak Pembayaran</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderShippingAddress = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
      
      <View style={styles.addressContainer}>
        <View style={styles.addressHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
          <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
        </View>
        
        <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
        <Text style={styles.addressText}>
          {order.shippingAddress.address}, {order.shippingAddress.city}
          {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
        </Text>
      </View>
    </View>
  );

  const renderStoreInfo = () => {
    // Group items by seller to get unique sellers
    const itemsBySeller = order.items.reduce((acc, item) => {
      const sellerId = item.sellerId || 'unknown';
      const sellerName = item.sellerName || 'Toko Tidak Dikenal';
      
      if (!acc[sellerId]) {
        acc[sellerId] = {
          sellerName,
          sellerId,
          items: []
        };
      }
      
      acc[sellerId].items.push(item);
      return acc;
    }, {});

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Toko</Text>
        
        {Object.entries(itemsBySeller).map(([sellerId, sellerData]) => {
          const sellerInfo = sellersData[sellerId];
          
          return (
            <View key={sellerId} style={styles.storeInfoContainer}>
              <View style={styles.storeHeader}>
                <MaterialCommunityIcons name="store" size={20} color={COLORS.primary} />
                <Text style={styles.storeTitle}>{sellerData.sellerName}</Text>
              </View>
              
              {sellerInfo && (
                <View style={styles.storeDetails}>
                  <View style={styles.storeDetailRow}>
                    <Text style={styles.storeDetailLabel}>Nama Penjual:</Text>
                    <Text style={styles.storeDetailValue}>{sellerInfo.name}</Text>
                  </View>
                  
                  <View style={styles.storeDetailRow}>
                    <Text style={styles.storeDetailLabel}>Telepon:</Text>
                    <Text style={styles.storeDetailValue}>{sellerInfo.phone}</Text>
                  </View>
                  
                  <View style={styles.storeOrderSummary}>
                    <Text style={styles.storeOrderSummaryLabel}>
                      Total dari {sellerData.sellerName}: 
                    </Text>
                    <Text style={styles.storeOrderSummaryAmount}>
                      {formatPrice(sellerData.items.reduce((sum, item) => sum + item.totalPrice, 0))}
                    </Text>
                  </View>
                </View>
              )}
              
              {!sellerInfo && (
                <View style={styles.storeLoadingContainer}>
                  <MaterialCommunityIcons name="loading" size={20} color={COLORS.textLight} />
                  <Text style={styles.storeLoadingText}>Memuat informasi toko...</Text>
                </View>
              )}
            </View>
          );
        })}

      </View>
    );
  };

  const renderOrderItems = () => {
    // Group items by seller
    const itemsBySeller = order.items.reduce((acc, item) => {
      const sellerId = item.sellerId || 'unknown';
      const sellerName = item.sellerName || 'Toko Tidak Dikenal';
      
      if (!acc[sellerId]) {
        acc[sellerId] = {
          sellerName,
          sellerId,
          items: []
        };
      }
      
      acc[sellerId].items.push(item);
      return acc;
    }, {});

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Item Pesanan ({order.itemCount} produk)</Text>
        
        {Object.entries(itemsBySeller).map(([sellerId, sellerData]) => (
          <View key={sellerId} style={styles.sellerGroup}>
            <View style={styles.sellerHeader}>
              <View style={styles.sellerHeaderLeft}>
                <MaterialCommunityIcons name="store" size={18} color={COLORS.primary} />
                <Text style={styles.sellerName}>{sellerData.sellerName}</Text>
                <Text style={styles.itemCount}>({sellerData.items.length} produk)</Text>
              </View>
              <Text style={styles.sellerTotal}>
                {formatPrice(sellerData.items.reduce((sum, item) => sum + item.totalPrice, 0))}
              </Text>
            </View>
            
            {sellerData.items.map((item, index) => (
              <View key={`${item.productId}-${index}`} style={styles.orderItem}>
                <Image 
                  source={{ uri: item.productImage }} 
                  style={styles.itemImage} 
                />
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                  
                  {item.selectedVariant && (
                    <Text style={styles.itemVariant}>
                      Varian: {item.selectedVariant.name}
                    </Text>
                  )}
                  
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                  

                </View>
                
                <Text style={styles.itemTotal}>{formatPrice(item.totalPrice)}</Text>
              </View>
            ))}
            
            <View style={styles.sellerSummary}>
              <Text style={styles.sellerSummaryLabel}>Subtotal dari {sellerData.sellerName}:</Text>
              <Text style={styles.sellerSummaryAmount}>
                {formatPrice(sellerData.items.reduce((sum, item) => sum + item.totalPrice, 0))}
              </Text>
            </View>
          </View>
        ))}
        
        <View style={styles.orderSummaryNote}>
          <MaterialCommunityIcons name="information" size={16} color={COLORS.textSecondary} />
          <Text style={styles.orderSummaryNoteText}>
            Pesanan ini melibatkan {Object.keys(itemsBySeller).length} toko berbeda
          </Text>
        </View>
      </View>
    );
  };

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal ({order.itemCount} item)</Text>
        <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Biaya Admin</Text>
        <Text style={styles.summaryValue}>
          {order.paymentMethod === 'cod' ? formatPrice(0) : formatPrice(order.adminFee || order.shippingCost || 1500)}
        </Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Pembayaran</Text>
        <Text style={styles.totalValue}>
          {formatPrice(
            order.paymentMethod === 'cod' 
              ? order.subtotal || (order.totalAmount - (order.adminFee || 1500)) // COD tanpa biaya admin
              : order.totalAmount // Non-COD dengan biaya admin
          )}
        </Text>
      </View>
    </View>
  );

  const renderNotes = () => {
    if (!order.notes) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catatan Customer</Text>
        <Text style={styles.notesText}>{order.notes}</Text>
      </View>
    );
  };

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Status Pesanan</Text>
            <TouchableOpacity 
              onPress={() => setShowStatusModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDescription}>
            Pilih status baru untuk pesanan #{order.orderNumber}
          </Text>
          
          <ScrollView style={styles.statusList}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.statusOption,
                  order.status === status.id && styles.statusOptionActive
                ]}
                onPress={() => handleUpdateStatus(status.id)}
                disabled={updating || order.status === status.id}
              >
                <View style={[styles.statusIcon, { backgroundColor: status.color }]}>
                  <MaterialCommunityIcons name={status.icon} size={20} color={COLORS.card} />
                </View>
                <View style={styles.statusContent}>
                  <Text style={[
                    styles.statusLabel,
                    order.status === status.id && styles.statusLabelActive
                  ]}>
                    {status.label}
                  </Text>
                  <Text style={styles.statusDescription}>{status.description}</Text>
                </View>
                {order.status === status.id && (
                  <MaterialCommunityIcons name="check" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderVerificationModal = () => (
    <Modal
      visible={showVerificationModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowVerificationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Konfirmasi Pembayaran</Text>
            <TouchableOpacity 
              onPress={() => setShowVerificationModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDescription}>
            Anda akan mengkonfirmasi pembayaran untuk pesanan #{order.orderNumber}. 
            Pastikan bukti pembayaran sudah sesuai dengan jumlah yang harus dibayar.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Catatan Verifikasi (Opsional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tambahkan catatan verifikasi..."
              value={verificationNotes}
              onChangeText={setVerificationNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowVerificationModal(false)}
              disabled={updating}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => handleVerifyPayment(true)}
              disabled={updating}
            >
              {updating ? (
                <MaterialCommunityIcons name="loading" size={20} color={COLORS.card} />
              ) : (
                <Text style={styles.confirmButtonText}>Konfirmasi Pembayaran</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOrderInfo()}
        {renderCustomerInfo()}
        {renderPaymentInfo()}
        {renderShippingAddress()}
        {renderStoreInfo()}
        {renderOrderItems()}
        {renderOrderSummary()}
        {renderNotes()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderStatusModal()}
      {renderImageModal()}
      {renderVerificationModal()}
    </SafeAreaView>
  );



  function renderImageModal() {
    return (
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
          >
            <MaterialCommunityIcons name="close" size={30} color={COLORS.card} />
          </TouchableOpacity>
          
          <View style={styles.imageModalContent}>
            <Text style={styles.imageModalTitle}>Bukti Pembayaran</Text>
            <Image 
              source={{ uri: order.paymentProof }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
            <Text style={styles.imageModalDate}>
              Diupload: {order.paymentProofUploadedAt ? formatDate(order.paymentProofUploadedAt) : 'Tidak diketahui'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  statusButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
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
  customerContainer: {
    marginTop: SPACING.sm,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerDetails: {
    marginLeft: SPACING.md,
  },
  customerName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  customerEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  paymentStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  paymentStatusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
  },
  paymentProofSection: {
    marginTop: SPACING.md,
  },
  paymentProofTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  proofContainer: {
    alignItems: 'center',
  },
  proofImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  proofImage: {
    width: 250,
    height: 200,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  imageOverlayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  proofUploadDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  noProofContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noProofText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  addressContainer: {
    marginTop: SPACING.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  addressName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  addressPhone: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  addressText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 20,
  },
  sellerGroup: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary + '60',
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  sellerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.xs,
  },
  sellerName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  itemCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  sellerTotal: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.divider + '20',
    marginHorizontal: SPACING.xs,
  },

  sellerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + '08',
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  sellerSummaryLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 13,
  },
  sellerSummaryAmount: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  orderSummaryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  orderSummaryNoteText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontStyle: 'italic',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  itemName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    lineHeight: 16,
    fontSize: 13,
  },
  itemVariant: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontStyle: 'italic',
    fontSize: 11,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  itemPrice: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  itemQuantity: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 13,
  },
  sellerInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  itemTotal: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
    minWidth: 80,
    paddingLeft: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  totalValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  notesText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 20,
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
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  statusList: {
    maxHeight: 400,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  statusOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  statusLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  statusLabelActive: {
    color: COLORS.primary,
  },
  statusDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: SPACING.sm,
  },
  imageModalContent: {
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  imageModalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.card,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  fullScreenImage: {
    width: '100%',
    height: 400,
    borderRadius: BORDER_RADIUS.md,
  },
  imageModalDate: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  // Verification Styles
  verificationActions: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
  },
  verificationTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  verificationSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  verificationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  verificationButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
    fontSize: 13,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  confirmButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
  },
  // Store Info Styles
  storeInfoContainer: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  storeTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  storeDetails: {
    marginLeft: SPACING.lg,
  },
  storeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  storeDetailLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  storeDetailValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    flex: 2,
    textAlign: 'right',
  },
  bankInfoContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },

  storeOrderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  storeOrderSummaryLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  storeOrderSummaryAmount: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  storeLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  storeLoadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textLight,
    marginLeft: SPACING.sm,
  },

});

export default AdminOrderDetailScreen;