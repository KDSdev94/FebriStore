import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Linking,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { imageService } from '../../services/imageService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/constants';

const { width } = Dimensions.get('window');

const SellerOrderDetailScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const [expandedItems, setExpandedItems] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isCODShipping, setIsCODShipping] = useState(false);

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current seller's transfer data
  const getCurrentSellerTransferData = () => {
    const transferData = order.originalOrder?.sellerTransferData;
    if (!transferData) return null;

    // Get current seller ID from order items
    const currentSellerId = order.items[0]?.sellerId;
    if (!currentSellerId) return null;

    // If single seller, return main transfer data
    if (!transferData.isMultiSeller) {
      return {
        transferProof: transferData.transferProof,
        transferredAt: transferData.transferredAt,
        notes: transferData.notes,
        sellerAmount: transferData.sellerAmount,
        adminFee: transferData.adminFee,
        sellerInfo: transferData.sellerInfo?.[0]
      };
    }

    // For multi-seller, find specific seller's transfer data
    // In multi-seller scenario, each seller should have separate transfer records
    // For now, we'll calculate the amount for current seller's items
    const currentSellerItems = order.items.filter(item => item.sellerId === currentSellerId);
    const currentSellerAmount = currentSellerItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Find seller info for current seller
    const currentSellerInfo = transferData.sellerInfo?.find(info => 
      info.storeName === currentSellerItems[0]?.storeName
    );

    return {
      transferProof: transferData.transferProof, // For now, same proof (should be separate in real implementation)
      transferredAt: transferData.transferredAt,
      notes: transferData.notes,
      sellerAmount: currentSellerAmount,
      adminFee: Math.round(currentSellerAmount * 0.015), // 1.5% admin fee
      sellerInfo: currentSellerInfo
    };
  };

  // Debug current seller transfer data and order status
  React.useEffect(() => {
    const sellerData = getCurrentSellerTransferData();
    console.log('=== SELLER ORDER DEBUG ===');
    console.log('Order Status:', order.status);
    console.log('Order Status Text:', order.statusText);
    console.log('Seller Data:', sellerData);
    console.log('Current Seller ID:', order.items[0]?.sellerId);
    console.log('Current Store Name:', order.items[0]?.storeName);
    console.log('Is Multi Seller:', order.originalOrder?.sellerTransferData?.isMultiSeller);
    console.log('Order Object:', order);
    console.log('========================');
  }, [order]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_verification': return COLORS.warning;
      case 'pending': return COLORS.warning;
      case 'processing': return COLORS.info;
      case 'shipped': return COLORS.primary;
      case 'delivered': return COLORS.success;
      case 'cancelled': return COLORS.error;
      // COD Status Colors
      case 'cod_confirmed': return COLORS.info;
      case 'cod_processing': return COLORS.primary;
      case 'cod_shipped': return COLORS.success;
      case 'cod_delivered': return COLORS.success;
      default: return COLORS.textLight;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_verification': return 'clock-outline';
      case 'pending': return 'clock-outline';
      case 'processing': return 'package-variant';
      case 'shipped': return 'truck-delivery';
      case 'delivered': return 'check-circle';
      case 'cancelled': return 'close-circle';
      // COD Status Icons
      case 'cod_confirmed': return 'cash-check';
      case 'cod_processing': return 'package-variant';
      case 'cod_shipped': return 'truck-delivery';
      case 'cod_delivered': return 'cash-check';
      default: return 'help-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_verification': return 'Menunggu Verifikasi';
      case 'pending': return 'Menunggu Pembayaran';
      case 'processing': return 'Sedang Diproses';
      case 'shipped': return 'Dalam Pengiriman';
      case 'delivered': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      // COD Status Text
      case 'cod_confirmed': return 'COD Dikonfirmasi';
      case 'cod_processing': return 'COD Diproses';
      case 'cod_shipped': return 'COD Dikirim';
      case 'cod_delivered': return 'COD Selesai';
      default: return 'Status Tidak Dikenal';
    }
  };

  const handleCallCustomer = () => {
    // Prioritize updated customer phone from user data
    const phoneNumber = order.userPhone || order.customerPhone || order.shippingAddress?.phone || order.originalOrder?.shippingAddress?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Error', 'Nomor telepon tidak tersedia');
    }
  };

  const handleWhatsAppCustomer = () => {
    // Prioritize updated customer phone from user data
    const phoneNumber = order.userPhone || order.customerPhone || order.shippingAddress?.phone || order.originalOrder?.shippingAddress?.phone;
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      const waNumber = cleanNumber.startsWith('0') ? '62' + cleanNumber.slice(1) : cleanNumber;
      Linking.openURL(`https://wa.me/${waNumber}`);
    } else {
      Alert.alert('Error', 'Nomor telepon tidak tersedia');
    }
  };

  const handleUpdateStatus = () => {
    Alert.alert(
      'Update Status',
      'Fitur update status akan segera tersedia',
      [{ text: 'OK' }]
    );
  };

  const handleVerifyOrder = async () => {
    Alert.alert(
      'Verifikasi Pesanan',
      'Apakah Anda yakin ingin memverifikasi pesanan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Verifikasi',
          onPress: async () => {
            try {
              const { orderService } = require('../../services/orderService');
              const result = await orderService.updateOrderStatus(order.id, 'processing');
              
              if (result.success) {
                Alert.alert(
                  'Berhasil',
                  'Pesanan berhasil diverifikasi dan status diubah ke "Sedang Diproses"',
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      // Update the order object and replace current screen
                      const updatedOrder = { ...order, status: 'processing', updatedAt: new Date() };
                      navigation.replace('SellerOrderDetail', { order: updatedOrder });
                    }
                  }]
                );
              } else {
                Alert.alert('Error', result.error || 'Gagal memverifikasi pesanan');
              }
            } catch (error) {
              console.error('Error verifying order:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat memverifikasi pesanan');
            }
          }
        }
      ]
    );
  };

  const handleShipOrder = () => {
    console.log('handleShipOrder called');
    setTrackingNumber('');
    setIsCODShipping(false);
    setShowTrackingModal(true);
  };

  const handleSubmitTracking = async () => {
    console.log('Tracking number entered:', trackingNumber);
    if (trackingNumber && trackingNumber.trim()) {
      try {
        setShowTrackingModal(false);
        const { orderService } = require('../../services/orderService');
        
        // Add tracking number
        const result = await orderService.addTrackingNumber(order.id, trackingNumber.trim());
        
        if (result.success) {
          // Update status to shipped
          const statusResult = await orderService.updateOrderStatus(order.id, 'shipped');
          
          if (statusResult.success) {
            Alert.alert(
              'Berhasil',
              'Pesanan berhasil dikirim dengan nomor resi: ' + trackingNumber.trim(),
              [{ 
                text: 'OK', 
                onPress: () => {
                  // Update the order object and replace current screen
                  const updatedOrder = { 
                    ...order, 
                    status: 'shipped', 
                    trackingNumber: trackingNumber.trim(),
                    shippedAt: new Date(),
                    updatedAt: new Date() 
                  };
                  navigation.replace('SellerOrderDetail', { order: updatedOrder });
                }
              }]
            );
          } else {
            Alert.alert('Error', 'Gagal mengupdate status pesanan');
          }
        } else {
          Alert.alert('Error', 'Gagal menambahkan nomor resi');
        }
      } catch (error) {
        console.error('Error shipping order:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat mengirim pesanan');
      }
    } else {
      Alert.alert('Error', 'Nomor resi tidak boleh kosong');
    }
  };
  };

  const handleCompleteOrder = async () => {
    Alert.alert(
      'Selesaikan Pesanan',
      'Apakah Anda yakin pesanan ini sudah selesai?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Selesai',
          onPress: async () => {
            try {
              const { orderService } = require('../../services/orderService');
              const result = await orderService.updateOrderStatus(order.id, 'delivered');
              
              if (result.success) {
                Alert.alert(
                  'Berhasil',
                  'Pesanan berhasil diselesaikan',
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      // Update the order object and replace current screen
                      const updatedOrder = { 
                        ...order, 
                        status: 'delivered', 
                        deliveredAt: new Date(),
                        updatedAt: new Date() 
                      };
                      navigation.replace('SellerOrderDetail', { order: updatedOrder });
                    }
                  }]
                );
              } else {
                Alert.alert('Error', 'Gagal menyelesaikan pesanan');
              }
            } catch (error) {
              console.error('Error completing order:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat menyelesaikan pesanan');
            }
          }
        }
      ]
    );
  };

  // COD Specific Handlers
  const handleProcessCODOrder = async () => {
    Alert.alert(
      'Proses Pesanan COD',
      'Mulai memproses pesanan COD ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Proses',
          onPress: async () => {
            try {
              const { orderService } = require('../../services/orderService');
              const result = await orderService.updateOrderStatus(order.id, 'cod_processing');
              
              if (result.success) {
                Alert.alert(
                  'Berhasil',
                  'Pesanan COD mulai diproses',
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      // Update the order object and replace current screen
                      const updatedOrder = { 
                        ...order, 
                        status: 'cod_processing', 
                        updatedAt: new Date() 
                      };
                      navigation.replace('SellerOrderDetail', { order: updatedOrder });
                    }
                  }]
                );
              } else {
                Alert.alert('Error', 'Gagal memproses pesanan COD');
              }
            } catch (error) {
              console.error('Error processing COD order:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat memproses pesanan COD');
            }
          }
        }
      ]
    );
  };

  const handleShipCODOrder = () => {
    setTrackingNumber('');
    setIsCODShipping(true);
    setShowTrackingModal(true);
  };

  const handleSubmitCODTracking = async () => {
    console.log('COD Tracking number entered:', trackingNumber);
    if (trackingNumber && trackingNumber.trim()) {
      try {
        setShowTrackingModal(false);
        const { orderService } = require('../../services/orderService');
        
        // Add tracking number
        const result = await orderService.addTrackingNumber(order.id, trackingNumber.trim());
        
        if (result.success) {
          // Update status to cod_shipped
          const statusResult = await orderService.updateOrderStatus(order.id, 'cod_shipped');
          
          if (statusResult.success) {
            Alert.alert(
              'Berhasil',
              'Pesanan COD berhasil dikirim dengan nomor resi: ' + trackingNumber.trim(),
              [{ 
                text: 'OK', 
                onPress: () => {
                  // Update the order object and replace current screen
                  const updatedOrder = { 
                    ...order, 
                    status: 'cod_shipped', 
                    trackingNumber: trackingNumber.trim(),
                    shippedAt: new Date(),
                    updatedAt: new Date() 
                  };
                  navigation.replace('SellerOrderDetail', { order: updatedOrder });
                }
              }]
            );
          } else {
            Alert.alert('Error', 'Gagal mengupdate status pesanan COD');
          }
        } else {
          Alert.alert('Error', 'Gagal menambahkan nomor resi');
        }
      } catch (error) {
        console.error('Error shipping COD order:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat mengirim pesanan COD');
      }
    } else {
      Alert.alert('Error', 'Nomor resi tidak boleh kosong');
    }
  };

  const handleCompleteCODOrder = async () => {
    Alert.alert(
      'Konfirmasi Pembayaran COD',
      'Apakah pembeli sudah membayar saat menerima barang?',
      [
        { text: 'Belum', style: 'cancel' },
        {
          text: 'Sudah Bayar',
          onPress: async () => {
            try {
              const { orderService } = require('../../services/orderService');
              const result = await orderService.updateOrderStatus(order.id, 'cod_delivered');
              
              if (result.success) {
                Alert.alert(
                  'Berhasil',
                  'Pesanan COD berhasil diselesaikan. Pembayaran telah dikonfirmasi.',
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      // Update the order object and replace current screen
                      const updatedOrder = { 
                        ...order, 
                        status: 'cod_delivered', 
                        deliveredAt: new Date(),
                        updatedAt: new Date() 
                      };
                      navigation.replace('SellerOrderDetail', { order: updatedOrder });
                    }
                  }]
                );
              } else {
                Alert.alert('Error', 'Gagal menyelesaikan pesanan COD');
              }
            } catch (error) {
              console.error('Error completing COD order:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat menyelesaikan pesanan COD');
            }
          }
        }
      ]
    );
  };

  const handleViewTransferProof = (imageUri) => {
    Alert.alert(
      'Bukti Transfer Admin',
      'Pilih aksi untuk bukti transfer',
      [
        {
          text: 'Lihat Gambar',
          onPress: () => {
            // For now, just show the image in a simple modal
            // You can implement a proper image viewer later
            Alert.alert('Info', 'Gambar bukti transfer tersedia. Fitur viewer akan segera ditambahkan.');
          }
        },
        {
          text: 'Batal',
          style: 'cancel'
        }
      ]
    );
  };

  const handleVerifyTransfer = (isVerified) => {
    const actionText = isVerified ? 'mengkonfirmasi' : 'melaporkan masalah';
    const confirmText = isVerified ? 'Dana Sudah Diterima' : 'Ada Masalah dengan Transfer';
    
    Alert.alert(
      'Konfirmasi Verifikasi',
      `Apakah Anda yakin ingin ${actionText} transfer ini?`,
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: confirmText,
          onPress: async () => {
            try {
              // Import transaction service
              const { transactionService } = require('../../services/transactionService');
              
              const verificationData = {
                isVerified: isVerified,
                verifiedAt: new Date(),
                verifiedBy: order.items[0]?.sellerId, // Current seller ID
                sellerStoreName: order.items[0]?.storeName,
                notes: isVerified ? 'Transfer dikonfirmasi oleh seller' : 'Seller melaporkan masalah dengan transfer'
              };

              // Update transaction with verification
              await transactionService.verifySellerTransfer(
                order.originalOrder?.id || order.id, 
                verificationData
              );

              Alert.alert(
                'Berhasil',
                isVerified 
                  ? 'Transfer berhasil diverifikasi. Status pesanan akan diperbarui.'
                  : 'Masalah transfer telah dilaporkan. Admin akan meninjau kembali.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Refresh the screen or navigate back
                      navigation.goBack();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error verifying transfer:', error);
              Alert.alert(
                'Error',
                'Gagal memverifikasi transfer. Silakan coba lagi.'
              );
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <TouchableOpacity style={styles.headerAction}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.orderIdSection}>
              <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.primary} />
              <View style={styles.orderIdInfo}>
                <Text style={styles.orderIdLabel}>ID Pesanan</Text>
                <Text style={styles.orderId}>#{order.orderNumber || order.id}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <MaterialCommunityIcons 
                name={getStatusIcon(order.status)} 
                size={14} 
                color={COLORS.card} 
              />
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
          </View>
          
          <View style={styles.orderMetaInfo}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar" size={16} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatDate(order.date)}</Text>
            </View>
            <View style={styles.paymentMethodInfo}>
              <MaterialCommunityIcons 
                name={order.paymentMethod === 'cod' ? 'cash' : 'bank-transfer'} 
                size={16} 
                color={order.paymentMethod === 'cod' ? COLORS.success : COLORS.info} 
              />
              <Text style={[styles.paymentMethodText, { 
                color: order.paymentMethod === 'cod' ? COLORS.success : COLORS.info,
              }]}>
                {order.paymentMethod === 'cod' ? 'COD' : 'Transfer'}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Informasi Pembeli</Text>
          </View>
          
          <View style={styles.customerCard}>
            <View style={styles.customerMainInfo}>
              <View style={styles.customerAvatarContainer}>
                <Image
                  source={{ 
                    uri: order.userAvatar || order.userProfileImage || imageService.generatePlaceholderAvatar(
                      order.userName || order.customerName || order.shippingAddress?.name || 'Customer', 
                      'buyer'
                    )
                  }}
                  style={styles.customerAvatar}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                  {order.userName || order.customerName || order.shippingAddress?.name || 'Customer'}
                </Text>
                <Text style={styles.customerEmail}>
                  {order.userEmail || order.customerEmail || 'No email'}
                </Text>
              </View>
            </View>
            
            <View style={styles.contactActions}>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleCallCustomer}
              >
                <MaterialCommunityIcons name="phone" size={16} color={COLORS.success} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleWhatsAppCustomer}
              >
                <MaterialCommunityIcons name="whatsapp" size={16} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
          </View>
          
          <View style={styles.addressCard}>
            {typeof order.shippingAddress === 'object' ? (
              <>
                <View style={styles.addressHeader}>
                  <Text style={styles.recipientName}>{order.shippingAddress.name}</Text>
                  <Text style={styles.recipientPhone}>{order.shippingAddress.phone}</Text>
                </View>
                <Text style={styles.addressText}>{order.shippingAddress.address}</Text>
                <Text style={styles.cityText}>{order.shippingAddress.city} {order.shippingAddress.postalCode}</Text>
                
                {order.shippingAddress.latitude && order.shippingAddress.longitude && (
                  <View style={styles.gpsInfo}>
                    <MaterialCommunityIcons name="map-marker-check" size={16} color={COLORS.success} />
                    <Text style={styles.gpsText}>Lokasi GPS tersedia</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.addressText}>{order.shippingAddress}</Text>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="package-variant" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Produk Pesanan ({order.items.length} item)</Text>
          </View>
          
          <View style={styles.itemsContainer}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemImageContainer}>
                  {(item.image || item.productImage) ? (
                    <Image 
                      source={{ uri: item.image || item.productImage }} 
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <MaterialCommunityIcons name="image" size={24} color={COLORS.textLight} />
                    </View>
                  )}
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name || item.productName}
                  </Text>
                  {(item.variant || item.selectedVariant?.name) && (
                    <Text style={styles.itemVariant}>
                      Varian: {item.variant || item.selectedVariant?.name}
                    </Text>
                  )}
                  {item.storeName && (
                    <Text style={styles.itemStore}>
                      Toko: {item.storeName}
                    </Text>
                  )}
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                </View>
                
                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tracking Information */}
        {order.trackingNumber && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="truck-delivery" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Informasi Pengiriman</Text>
            </View>
            
            <View style={styles.trackingCard}>
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingLabel}>Nomor Resi:</Text>
                <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
              </View>
              <TouchableOpacity style={styles.trackButton}>
                <Text style={styles.trackButtonText}>Lacak Paket</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calculator" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({order.items.length} item)</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(order.subtotal || (order.totalAmount - (order.adminFee || 0)))}
              </Text>
            </View>
            
            {order.adminFee && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Biaya Admin</Text>
                <Text style={styles.summaryValue}>{formatPrice(order.adminFee)}</Text>
              </View>
            )}
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total Pembayaran</Text>
              <Text style={styles.summaryTotalValue}>
                {formatPrice(order.totalAmount || order.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Admin Transfer Proof */}
        {(() => {
          const sellerTransferData = getCurrentSellerTransferData();
          return sellerTransferData && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="bank-transfer" size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Bukti Transfer Admin</Text>
              </View>
              
              <View style={styles.transferProofCard}>
                <View style={styles.transferProofHeader}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
                  <Text style={styles.transferProofStatus}>Transfer Berhasil</Text>
                  {sellerTransferData.transferredAt && (
                    <Text style={styles.transferDate}>
                      {formatDate(new Date(sellerTransferData.transferredAt.seconds * 1000).toISOString())}
                    </Text>
                  )}
                </View>

                {/* Seller Bank Info */}
                {sellerTransferData.sellerInfo && (
                  <View style={styles.sellerBankInfo}>
                    <Text style={styles.sellerBankTitle}>Transfer ke Rekening:</Text>
                    <View style={styles.bankDetails}>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Bank:</Text>
                        <Text style={styles.bankValue}>{sellerTransferData.sellerInfo.bankName}</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>No. Rekening:</Text>
                        <Text style={styles.bankValue}>{sellerTransferData.sellerInfo.accountNumber}</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Nama Pemilik:</Text>
                        <Text style={styles.bankValue}>{sellerTransferData.sellerInfo.accountName}</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.transferProofImageContainer}
                  onPress={() => handleViewTransferProof(sellerTransferData.transferProof)}
                >
                  <Image 
                    source={{ uri: sellerTransferData.transferProof }} 
                    style={styles.transferProofImage}
                    resizeMode="cover"
                  />
                  <View style={styles.transferProofOverlay}>
                    <MaterialCommunityIcons name="eye" size={24} color={COLORS.white} />
                    <Text style={styles.transferProofOverlayText}>Lihat Bukti</Text>
                  </View>
                </TouchableOpacity>
                
                {sellerTransferData.notes && (
                  <View style={styles.transferNotesContainer}>
                    <Text style={styles.transferNotesLabel}>Catatan Transfer:</Text>
                    <Text style={styles.transferNotesText}>
                      {sellerTransferData.notes}
                    </Text>
                  </View>
                )}
                
                <View style={styles.transferAmountInfo}>
                  <View style={styles.transferAmountRow}>
                    <Text style={styles.transferAmountLabel}>Jumlah Transfer:</Text>
                    <Text style={styles.transferAmountValue}>
                      {formatPrice(sellerTransferData.sellerAmount)}
                    </Text>
                  </View>
                  <View style={styles.transferAmountRow}>
                    <Text style={styles.transferAmountLabel}>Biaya Admin:</Text>
                    <Text style={styles.transferAmountValue}>
                      {formatPrice(sellerTransferData.adminFee)}
                    </Text>
                  </View>
                  <View style={styles.transferAmountRow}>
                    <Text style={styles.transferAmountLabel}>Diterima Seller:</Text>
                    <Text style={[styles.transferAmountValue, styles.receivedAmount]}>
                      {formatPrice(sellerTransferData.sellerAmount - sellerTransferData.adminFee)}
                    </Text>
                  </View>
                </View>

                {/* Transfer Verification */}
                <View style={styles.transferVerificationSection}>
                  {order.status === 'processing' && !sellerTransferData.isVerified && sellerTransferData.verificationStatus !== 'verified' ? (
                    <View style={styles.verificationPending}>
                      <View style={styles.verificationHeader}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.warning} />
                        <Text style={styles.verificationTitle}>Menunggu Verifikasi</Text>
                      </View>
                      <Text style={styles.verificationDescription}>
                        Silakan periksa bukti transfer di atas dan konfirmasi jika dana sudah diterima.
                      </Text>
                      <View style={styles.verificationActions}>
                        <TouchableOpacity 
                          style={styles.verifyTransferButton}
                          onPress={() => handleVerifyTransfer(true)}
                        >
                          <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.white} />
                          <Text style={styles.verifyTransferText}>Dana Sudah Diterima</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.rejectTransferButton}
                          onPress={() => handleVerifyTransfer(false)}
                        >
                          <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.white} />
                          <Text style={styles.rejectTransferText}>Ada Masalah</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (sellerTransferData.isVerified || sellerTransferData.verificationStatus === 'verified') ? (
                    <View style={styles.verificationCompleted}>
                      <View style={styles.verificationCompletedHeader}>
                        <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
                        <Text style={styles.verificationCompletedTitle}>Transfer Terverifikasi</Text>
                      </View>
                      <Text style={styles.verificationCompletedDescription}>
                        Anda telah mengkonfirmasi bahwa dana transfer sudah diterima.
                      </Text>
                      {sellerTransferData.verifiedAt && (
                        <Text style={styles.verificationDate}>
                          Diverifikasi pada: {formatDate(new Date(sellerTransferData.verifiedAt.seconds * 1000).toISOString())}
                        </Text>
                      )}
                    </View>
                  ) : sellerTransferData.verificationStatus === 'rejected' ? (
                    <View style={styles.verificationRejected}>
                      <View style={styles.verificationRejectedHeader}>
                        <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.error} />
                        <Text style={styles.verificationRejectedTitle}>Masalah Transfer Dilaporkan</Text>
                      </View>
                      <Text style={styles.verificationRejectedDescription}>
                        Anda telah melaporkan masalah dengan transfer ini. Admin akan meninjau kembali.
                      </Text>
                      {sellerTransferData.verifiedAt && (
                        <Text style={styles.verificationDate}>
                          Dilaporkan pada: {formatDate(new Date(sellerTransferData.verifiedAt.seconds * 1000).toISOString())}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.verificationInfo}>
                      <MaterialCommunityIcons name="information" size={20} color={COLORS.info} />
                      <Text style={styles.verificationInfoText}>
                        Transfer akan perlu diverifikasi setelah status berubah ke "sedang diproses"
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="note-text" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Catatan</Text>
            </View>
            
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {order.status === 'pending_verification' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.verifyButton]}
            onPress={handleVerifyOrder}
          >
            <MaterialCommunityIcons name="check" size={20} color={COLORS.card} />
            <Text style={styles.actionButtonText}>Verifikasi Pesanan</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'processing' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.shipButton]}
            onPress={handleShipOrder}
          >
            <MaterialCommunityIcons name="truck-delivery" size={20} color={COLORS.card} />
            <Text style={styles.actionButtonText}>Kirim Pesanan</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'shipped' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteOrder}
          >
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.card} />
            <Text style={styles.actionButtonText}>Selesaikan Pesanan</Text>
          </TouchableOpacity>
        )}

        {/* COD Specific Actions */}
        {order.status === 'cod_confirmed' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.processButton]}
            onPress={handleProcessCODOrder}
          >
            <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.card} />
            <Text style={styles.actionButtonText}>Proses Pesanan COD</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'cod_processing' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.shipButton]}
            onPress={handleShipCODOrder}
          >
            <MaterialCommunityIcons name="truck-delivery" size={20} color={COLORS.card} />
            <Text style={styles.actionButtonText}>Kirim Pesanan COD</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'cod_shipped' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteCODOrder}
          >
            <MaterialCommunityIcons name="cash-check" size={20} color={COLORS.card} />
            <Text style={styles.actionButtonText}>Konfirmasi Pembayaran COD</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tracking Number Modal */}
      <Modal
        visible={showTrackingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTrackingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCODShipping ? 'Kirim Pesanan COD' : 'Masukkan Nomor Resi'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowTrackingModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Masukkan nomor resi pengiriman untuk pesanan {isCODShipping ? 'COD ' : ''}ini
            </Text>
            
            <TextInput
              style={styles.trackingInput}
              placeholder="Contoh: JNE123456789"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={isCODShipping ? handleSubmitCODTracking : handleSubmitTracking}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowTrackingModal(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSubmitButton}
                onPress={isCODShipping ? handleSubmitCODTracking : handleSubmitTracking}
              >
                <MaterialCommunityIcons name="truck-delivery" size={18} color={COLORS.card} />
                <Text style={styles.modalSubmitText}>
                  {isCODShipping ? 'Kirim COD' : 'Kirim Pesanan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerAction: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  
  // Status Card
  statusCard: {
    backgroundColor: COLORS.card,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  orderIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  orderIdInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  orderIdLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 11,
  },
  orderId: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  orderMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.small,
  },
  paymentMethodText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  
  // Section Styles
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  
  // Customer Card
  customerCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  customerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  customerAvatar: {
    width: '100%',
    height: '100%',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButton: {
    backgroundColor: COLORS.success + '20',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Address Card
  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  recipientName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  recipientPhone: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
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
    marginBottom: SPACING.sm,
  },
  gpsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  gpsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  
  // Items Container
  itemsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemImageContainer: {
    marginRight: SPACING.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  itemVariant: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemStore: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  itemQuantity: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalPrice: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  
  // Tracking Card
  trackingCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  trackingNumber: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  trackButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: 'bold',
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
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
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  summaryTotalLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  
  // Notes Card
  notesCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  notesText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // Bottom Actions
  bottomSpacing: {
    height: SPACING.xl,
  },
  bottomActions: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  verifyButton: {
    backgroundColor: COLORS.warning,
  },
  shipButton: {
    backgroundColor: COLORS.info,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  processButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    marginLeft: SPACING.sm,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
  },
  itemPrice: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  itemQuantity: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
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
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
  summaryTotalLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  bottomActions: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  updateButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    fontWeight: '600',
  },
  
  // Transfer Proof Styles
  transferProofCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  transferProofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  transferProofStatus: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  transferDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  transferProofImageContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  transferProofImage: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  transferProofOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  transferProofOverlayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  transferNotesContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  transferNotesLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  transferNotesText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  transferAmountInfo: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
  transferAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  transferAmountLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  transferAmountValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  receivedAmount: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Seller Bank Info Styles
  sellerBankInfo: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  sellerBankTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  bankDetails: {
    gap: SPACING.xs,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    flex: 1,
  },
  bankValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  
  // Transfer Verification Styles
  transferVerificationSection: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
  verificationPending: {
    backgroundColor: COLORS.warning + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  verificationTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.warning,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  verificationDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  verifyTransferButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  verifyTransferText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  rejectTransferButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  rejectTransferText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  verificationCompleted: {
    backgroundColor: COLORS.success + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  verificationCompletedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  verificationCompletedTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.success,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  verificationCompletedDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  verificationDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  verificationRejected: {
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  verificationRejectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  verificationRejectedTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.error,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  verificationRejectedDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  verificationInfo: {
    backgroundColor: COLORS.info + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.info + '30',
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationInfoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.info,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
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
    lineHeight: 20,
  },
  trackingInput: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
  },
  modalCancelText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textSecondary,
  },
  modalSubmitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    gap: SPACING.xs,
  },
  modalSubmitText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    fontWeight: 'bold',
  },
});

export default SellerOrderDetailScreen;