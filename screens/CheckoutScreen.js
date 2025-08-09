import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrder } from '../contexts/OrderContext';
import { addressService } from '../services/addressService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrder();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, [user?.id]);

  const loadAddresses = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingAddresses(true);
      const userAddresses = await addressService.getAddresses(user.id);
      setAddresses(userAddresses);
      
      // Set default address as selected
      const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
      setSelectedAddress(defaultAddress);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Gagal memuat alamat pengiriman');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Check if all cart items are from the same store
  const checkSameStore = () => {
    if (cartItems.length === 0) return false;
    
    // Get the first store ID as reference
    const firstStoreId = cartItems[0].sellerId || cartItems[0].storeId;
    if (!firstStoreId) return false;
    
    // Check if all items have the same store ID
    return cartItems.every(item => {
      const itemStoreId = item.sellerId || item.storeId;
      return itemStoreId === firstStoreId;
    });
  };
  
  const isSameStore = checkSameStore();
  
  // Auto-select transfer if COD is not available and current payment is COD
  useEffect(() => {
    if (!isSameStore && paymentMethod === 'cod') {
      setPaymentMethod('transfer');
    }
  }, [isSameStore, paymentMethod]);

  const adminFee = paymentMethod === 'cod' ? 0 : 1500; // No admin fee for COD
  const totalAmount = getCartTotal() + adminFee;

  const handlePlaceOrder = async () => {
    // Validate user is logged in
    if (!user || !user.id) {
      Alert.alert('Error', 'Anda harus login terlebih dahulu');
      navigation.navigate('Login');
      return;
    }

    // Validate selected address
    if (!selectedAddress) {
      Alert.alert('Error', 'Mohon pilih alamat pengiriman');
      return;
    }

    setLoading(true);
    
    try {
      // Debug user data
      console.log('User data at checkout:', {
        userId: user?.id,
        userName: user?.name,
        userFullName: user?.fullName,
        userEmail: user?.email,
        userPhone: user?.phone,
        addressPhone: selectedAddress?.phone
      });

      // Prepare order data
      const orderData = {
        userId: user?.id || '',
        userEmail: user?.email || '',
        userName: user?.name || user?.fullName || 'Customer',
        userPhone: user?.phone || selectedAddress?.phone || '',
        items: cartItems.map((item, index) => {
          // Ensure we have valid sellerId - if not, log warning
          const sellerId = item.sellerId || item.storeId;
          if (!sellerId) {
            console.warn(`Product ${item.name} missing sellerId - this may cause issues with transaction display`);
          }
          
          const storeName = item.storeName || item.sellerName || `Toko ${item.name?.split(' ')[0] || 'Elektronik'}`;
          const sellerName = storeName; // Keep sellerName for backward compatibility
          
          console.log(`Order item ${index + 1}:`, {
            productName: item.name,
            sellerId: sellerId || 'MISSING_SELLER_ID',
            storeName,
            sellerName
          });
          
          return {
            id: item.id || '', // Product ID
            productId: item.id || '',
            name: item.name || '', // Product name for display
            productName: item.name || '', // Backward compatibility
            image: item.images && item.images.length > 0 ? item.images[0] : (item.imageUrl || item.image || ''),
            images: item.images || [item.imageUrl || item.image].filter(Boolean),
            productImage: item.images && item.images.length > 0 ? item.images[0] : (item.imageUrl || item.image || ''),
            selectedVariant: item.selectedVariant || null,
            variant: item.selectedVariant?.name || '', // Variant name for display
            quantity: item.quantity || 1,
            price: item.selectedVariant ? item.selectedVariant.price : (item.price || 0),
            totalPrice: (item.selectedVariant ? item.selectedVariant.price : (item.price || 0)) * (item.quantity || 1),
            sellerId: sellerId || '',
            storeId: sellerId || '', // Alternative field name
            sellerName: sellerName || '',
            storeName: storeName || '',
            category: item.category || '',
            description: item.description || '',
          };
        }),
        shippingAddress: {
          name: selectedAddress.recipientName || '',
          phone: selectedAddress.phone || '',
          address: selectedAddress.address || '',
          city: selectedAddress.city || '',
          postalCode: selectedAddress.postalCode || '',
          label: selectedAddress.label || '',
          latitude: selectedAddress.latitude || null,
          longitude: selectedAddress.longitude || null,
        },
        paymentMethod: paymentMethod || 'transfer',
        notes: notes || '',
        subtotal: getCartTotal() || 0,
        adminFee: adminFee || 0,
        totalAmount: totalAmount || 0,
        itemCount: cartItems.length || 0,
      };

      // Create order
      const result = await createOrder(orderData);
      
      if (result.success) {
        // Clear cart after successful order
        clearCart();
        
        Alert.alert(
          'Pesanan Berhasil',
          `Pesanan Anda telah berhasil dibuat dengan nomor ${result.order.orderNumber}. Silakan lakukan pembayaran sesuai instruksi.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to main screen
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Terjadi kesalahan saat membuat pesanan');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
      {cartItems.map((item) => {
        const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;
        return (
          <View key={item.cartId} style={styles.orderItem}>
            <Image 
              source={{ 
                uri: item.images && item.images.length > 0 
                  ? item.images[0] 
                  : (item.imageUrl || item.image) 
              }} 
              style={styles.orderItemImage} 
            />
            <View style={styles.orderItemDetails}>
              <Text style={styles.orderItemName} numberOfLines={2}>{item.name}</Text>
              
              {/* Store Name */}
              {item.storeName && (
                <View style={styles.storeInfoCheckout}>
                  <MaterialCommunityIcons name="store" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.storeNameCheckout}>{item.storeName}</Text>
                </View>
              )}
              
              {item.selectedVariant && (
                <Text style={styles.orderItemVariant}>Varian: {item.selectedVariant.name}</Text>
              )}
              <Text style={styles.orderItemPrice}>
                {item.quantity}x {formatPrice(itemPrice)}
              </Text>
            </View>
            <Text style={styles.orderItemTotal}>
              {formatPrice(itemPrice * item.quantity)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderShippingAddress = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
        <TouchableOpacity
          style={styles.changeAddressButton}
          onPress={() => setShowAddressModal(true)}
        >
          <Text style={styles.changeAddressText}>Ubah</Text>
        </TouchableOpacity>
      </View>
      
      {loadingAddresses ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat alamat...</Text>
        </View>
      ) : selectedAddress ? (
        <View style={styles.selectedAddressContainer}>
          <View style={styles.addressHeader}>
            <View style={styles.addressLabelContainer}>
              <MaterialCommunityIcons 
                name={selectedAddress.label === 'Rumah' ? 'home' : selectedAddress.label === 'Kantor' ? 'office-building' : 'map-marker'} 
                size={16} 
                color={COLORS.primary} 
              />
              <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
              {selectedAddress.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Utama</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.recipientName}>{selectedAddress.recipientName}</Text>
          <Text style={styles.recipientPhone}>{selectedAddress.phone}</Text>
          <Text style={styles.addressText}>{selectedAddress.address}</Text>
          <Text style={styles.cityText}>{selectedAddress.city} {selectedAddress.postalCode}</Text>
          
          {selectedAddress.latitude && selectedAddress.longitude && (
            <View style={styles.coordinateContainer}>
              <MaterialCommunityIcons name="map-marker-check" size={14} color={COLORS.success} />
              <Text style={styles.coordinateText}>Lokasi GPS tersedia</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noAddressContainer}>
          <MaterialCommunityIcons name="map-marker-off" size={48} color={COLORS.textLight} />
          <Text style={styles.noAddressText}>Belum ada alamat pengiriman</Text>
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => navigation.navigate('Addresses')}
          >
            <Text style={styles.addAddressButtonText}>Tambah Alamat</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPaymentMethod = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
      
      {/* Transfer Bank - Always Available */}
      <TouchableOpacity
        style={[styles.paymentOption, paymentMethod === 'transfer' && styles.paymentOptionSelected]}
        onPress={() => setPaymentMethod('transfer')}
      >
        <MaterialCommunityIcons 
          name="bank-transfer" 
          size={24} 
          color={paymentMethod === 'transfer' ? COLORS.primary : COLORS.textSecondary} 
        />
        <View style={styles.paymentOptionContent}>
          <Text style={[styles.paymentOptionTitle, paymentMethod === 'transfer' && styles.paymentOptionTitleSelected]}>
            Transfer Bank
          </Text>
          <Text style={styles.paymentOptionSubtitle}>
            Transfer ke rekening admin + biaya admin Rp 1.500
          </Text>
        </View>
        <MaterialCommunityIcons 
          name={paymentMethod === 'transfer' ? 'radiobox-marked' : 'radiobox-blank'} 
          size={20} 
          color={paymentMethod === 'transfer' ? COLORS.primary : COLORS.textSecondary} 
        />
      </TouchableOpacity>

      {/* COD - Only available when all items are from the same store */}
      {isSameStore ? (
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
          onPress={() => setPaymentMethod('cod')}
        >
          <MaterialCommunityIcons 
            name="cash" 
            size={24} 
            color={paymentMethod === 'cod' ? COLORS.primary : COLORS.textSecondary} 
          />
          <View style={styles.paymentOptionContent}>
            <Text style={[styles.paymentOptionTitle, paymentMethod === 'cod' && styles.paymentOptionTitleSelected]}>
              Bayar di Tempat (COD)
            </Text>
            <Text style={styles.paymentOptionSubtitle}>
              Bayar langsung ke penjual (GRATIS biaya admin)
            </Text>
          </View>
          <MaterialCommunityIcons 
            name={paymentMethod === 'cod' ? 'radiobox-marked' : 'radiobox-blank'} 
            size={20} 
            color={paymentMethod === 'cod' ? COLORS.primary : COLORS.textSecondary} 
          />
        </TouchableOpacity>
      ) : (
        /* Show info why COD is not available */
        <View style={[styles.paymentOption, styles.paymentOptionDisabled]}>
          <MaterialCommunityIcons 
            name="cash-off" 
            size={24} 
            color={COLORS.textLight} 
          />
          <View style={styles.paymentOptionContent}>
            <Text style={[styles.paymentOptionTitle, styles.paymentOptionTitleDisabled]}>
              Bayar di Tempat (COD)
            </Text>
            <Text style={styles.paymentOptionSubtitleDisabled}>
              Tidak tersedia untuk pesanan dari toko yang berbeda
            </Text>
          </View>
          <MaterialCommunityIcons 
            name="information" 
            size={20} 
            color={COLORS.textLight} 
          />
        </View>
      )}
    </View>
  );

  const renderNotes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Catatan (Opsional)</Text>
      <TextInput
        style={[styles.textInput, styles.multilineInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Tambahkan catatan untuk penjual..."
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderPriceSummary = () => (
    <View style={styles.priceSummary}>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Subtotal ({cartItems.length} item)</Text>
        <Text style={styles.priceValue}>{formatPrice(getCartTotal())}</Text>
      </View>
      
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>
          Biaya Admin {paymentMethod === 'cod' ? '(Gratis untuk COD)' : ''}
        </Text>
        <Text style={[styles.priceValue, paymentMethod === 'cod' && styles.freePrice]}>
          {paymentMethod === 'cod' ? 'GRATIS' : formatPrice(adminFee)}
        </Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.priceRow}>
        <Text style={styles.totalLabel}>Total Pembayaran</Text>
        <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOrderSummary()}
        {renderShippingAddress()}
        {renderPaymentMethod()}
        {renderNotes()}
        {renderPriceSummary()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.placeOrderButtonText}>Memproses...</Text>
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.card} />
              <Text style={styles.placeOrderButtonText}>Buat Pesanan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddressModal(false)}
            >
              <Feather name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pilih Alamat Pengiriman</Text>
            <TouchableOpacity
              style={styles.addNewAddressButton}
              onPress={() => {
                setShowAddressModal(false);
                navigation.navigate('Addresses');
              }}
            >
              <Feather name="plus" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressOption,
                  selectedAddress?.id === address.id && styles.addressOptionSelected
                ]}
                onPress={() => {
                  setSelectedAddress(address);
                  setShowAddressModal(false);
                }}
              >
                <View style={styles.addressOptionHeader}>
                  <View style={styles.addressLabelContainer}>
                    <MaterialCommunityIcons 
                      name={address.label === 'Rumah' ? 'home' : address.label === 'Kantor' ? 'office-building' : 'map-marker'} 
                      size={16} 
                      color={COLORS.primary} 
                    />
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Utama</Text>
                      </View>
                    )}
                  </View>
                  {selectedAddress?.id === address.id && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
                  )}
                </View>
                
                <Text style={styles.recipientName}>{address.recipientName}</Text>
                <Text style={styles.recipientPhone}>{address.phone}</Text>
                <Text style={styles.addressText}>{address.address}</Text>
                <Text style={styles.cityText}>{address.city} {address.postalCode}</Text>
                
                {address.latitude && address.longitude && (
                  <View style={styles.coordinateContainer}>
                    <MaterialCommunityIcons name="map-marker-check" size={14} color={COLORS.success} />
                    <Text style={styles.coordinateText}>Lokasi GPS tersedia</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            {addresses.length === 0 && (
              <View style={styles.noAddressContainer}>
                <MaterialCommunityIcons name="map-marker-off" size={48} color={COLORS.textLight} />
                <Text style={styles.noAddressText}>Belum ada alamat tersimpan</Text>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => {
                    setShowAddressModal(false);
                    navigation.navigate('Addresses');
                  }}
                >
                  <Text style={styles.addAddressButtonText}>Tambah Alamat Baru</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
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
  placeholder: {
    width: 40,
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
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  orderItemName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  storeInfoCheckout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  storeNameCheckout: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontSize: 10,
    fontWeight: '500',
  },
  orderItemVariant: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  orderItemPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  orderItemTotal: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  textInput: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: SPACING.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  paymentOptionContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  paymentOptionTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  paymentOptionTitleSelected: {
    color: COLORS.primary,
  },
  paymentOptionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  paymentOptionDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.backgroundSecondary,
  },
  paymentOptionTitleDisabled: {
    color: COLORS.textLight,
  },
  paymentOptionSubtitleDisabled: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  priceSummary: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  priceValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
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
  freePrice: {
    color: COLORS.success,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    marginLeft: SPACING.sm,
  },
  bottomSpacing: {
    height: SPACING.lg,
  },
  // Address Selection Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  changeAddressButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  changeAddressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  selectedAddressContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  defaultBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    marginLeft: SPACING.xs,
  },
  defaultBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontSize: 10,
    fontWeight: '600',
  },
  recipientName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  recipientPhone: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  addressText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  cityText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  coordinateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  coordinateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontStyle: 'italic',
  },
  noAddressContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noAddressText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textLight,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  addAddressButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addAddressButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.small,
  },
  modalCloseButton: {
    padding: SPACING.sm,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addNewAddressButton: {
    padding: SPACING.sm,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  addressOption: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  addressOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  addressOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
});

export default CheckoutScreen;