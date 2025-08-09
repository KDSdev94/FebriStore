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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { imageService } from '../../services/imageService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/constants';

const SellerStoreProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [storeStats, setStoreStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSold: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    completedOrders: 0,
    averageOrderValue: 0,
  });

  const [storeData, setStoreData] = useState({
    storeName: user?.storeName || 'Toko Saya',
    storeDescription: user?.storeDescription || 'Deskripsi toko belum diatur',
    address: user?.address || 'Alamat belum diatur',
    city: user?.city || 'Kota belum diatur',
    phone: user?.phone || 'Nomor telepon belum diatur',
    sellerBankAccount: user?.sellerBankAccount || '',
    sellerAccountName: user?.sellerAccountName || '',
    sellerBankName: user?.sellerBankName || '',
  });

  useEffect(() => {
    loadStoreStats();
  }, [user?.id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const loadStoreStats = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingStats(true);
      
      // Load products count
      const productsResult = await productService.getProductsBySeller(user.id);
      const totalProducts = productsResult.success ? productsResult.products.length : 0;
      
      // Load revenue statistics
      const revenueResult = await orderService.getSellerRevenueStats(user.id);
      let totalOrders = 0;
      let totalSold = 0;
      let pendingOrders = 0;
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let completedOrders = 0;
      let averageOrderValue = 0;
      
      if (revenueResult.success) {
        const stats = revenueResult.stats;
        totalOrders = stats.totalOrders;
        totalSold = stats.totalItemsSold;
        pendingOrders = stats.pendingOrders;
        totalRevenue = stats.totalRevenue;
        monthlyRevenue = stats.monthlyRevenue;
        completedOrders = stats.completedOrders;
        averageOrderValue = stats.averageOrderValue;
      }
      
      setStoreStats({
        totalProducts,
        totalOrders,
        totalSold,
        pendingOrders,
        totalRevenue,
        monthlyRevenue,
        completedOrders,
        averageOrderValue,
      });
    } catch (error) {
      console.error('Error loading store stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleChangeStoreImage = async () => {
    try {
      setUploadingImage(true);
      const imageUri = await imageService.pickStoreImage();
      
      if (imageUri) {
        // Update user profile with new store image URI
        const result = await updateUser({ 
          storeImage: imageUri,
          storeLogo: imageUri
        });
        
        if (result.success) {
          Alert.alert('Berhasil', 'Foto toko berhasil diperbarui');
        } else {
          Alert.alert('Error', result.error || 'Gagal memperbarui foto toko');
        }
      }
    } catch (error) {
      console.error('Error changing store image:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengubah foto toko');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateSellerProducts = async (newStoreData) => {
    try {
      const storeInfo = {
        storeName: newStoreData.storeName || '',
        userName: user?.name || '',
        city: newStoreData.city || '',
        address: newStoreData.address || '',
        phone: newStoreData.phone || ''
      };
      
      const result = await productService.updateSellerStoreInfo(user.id, storeInfo);
      
      if (result.success) {
        console.log(result.message);
      } else {
        console.error('Error updating seller products:', result.error);
      }
    } catch (error) {
      console.error('Error updating seller products:', error);
      // Don't throw error, just log it as this is a background operation
    }
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(storeData);
      if (result.success) {
        // Update products with new store information
        await updateSellerProducts(storeData);
        
        setIsEditing(false);
        Alert.alert('Berhasil', 'Profil toko berhasil diperbarui');
      } else {
        Alert.alert('Error', result.error || 'Gagal memperbarui profil');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memperbarui profil');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navigation will be handled automatically by RoleBasedNavigator
          }
        }
      ]
    );
  };

  const renderStoreStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <View style={styles.statIconContainer}>
          <MaterialCommunityIcons name="package-variant" size={26} color={COLORS.primary} />
        </View>
        {loadingStats ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Text style={styles.statNumber}>{storeStats.totalProducts}</Text>
        )}
        <Text style={styles.statLabel}>Produk</Text>
      </View>
      
      <View style={styles.statItem}>
        <View style={styles.statIconContainer}>
          <MaterialCommunityIcons name="cart-check" size={26} color={COLORS.success} />
        </View>
        {loadingStats ? (
          <ActivityIndicator size="small" color={COLORS.success} />
        ) : (
          <Text style={styles.statNumber}>{storeStats.totalSold}</Text>
        )}
        <Text style={styles.statLabel}>Terjual</Text>
      </View>
      
      <View style={styles.statItem}>
        <View style={styles.statIconContainer}>
          <MaterialCommunityIcons name="receipt" size={26} color={COLORS.info} />
        </View>
        {loadingStats ? (
          <ActivityIndicator size="small" color={COLORS.info} />
        ) : (
          <Text style={styles.statNumber}>{storeStats.totalOrders}</Text>
        )}
        <Text style={styles.statLabel}>Pesanan</Text>
      </View>
      
      <View style={styles.statItem}>
        <View style={styles.statIconContainer}>
          <MaterialCommunityIcons name="clock-outline" size={26} color={COLORS.warning} />
        </View>
        {loadingStats ? (
          <ActivityIndicator size="small" color={COLORS.warning} />
        ) : (
          <Text style={styles.statNumber}>{storeStats.pendingOrders}</Text>
        )}
        <Text style={styles.statLabel}>Pending</Text>
      </View>
    </View>
  );

  const renderRevenueStats = () => (
    <View style={styles.revenueContainer}>
      <View style={styles.revenueHeader}>
        <MaterialCommunityIcons name="cash-multiple" size={24} color={COLORS.success} />
        <Text style={styles.revenueTitle}>Statistik Pendapatan</Text>
      </View>
      
      <View style={styles.revenueStatsGrid}>
        <View style={styles.revenueStatItem}>
          <View style={styles.revenueStatHeader}>
            <MaterialCommunityIcons name="currency-usd" size={20} color={COLORS.success} />
            <Text style={styles.revenueStatLabel}>Total Pendapatan</Text>
          </View>
          {loadingStats ? (
            <ActivityIndicator size="small" color={COLORS.success} />
          ) : (
            <Text style={styles.revenueStatValue}>{formatCurrency(storeStats.totalRevenue)}</Text>
          )}
        </View>
        
        <View style={styles.revenueStatItem}>
          <View style={styles.revenueStatHeader}>
            <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} />
            <Text style={styles.revenueStatLabel}>Pendapatan Bulan Ini</Text>
          </View>
          {loadingStats ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.revenueStatValue}>{formatCurrency(storeStats.monthlyRevenue)}</Text>
          )}
        </View>
        
        <View style={styles.revenueStatItem}>
          <View style={styles.revenueStatHeader}>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.info} />
            <Text style={styles.revenueStatLabel}>Pesanan Selesai</Text>
          </View>
          {loadingStats ? (
            <ActivityIndicator size="small" color={COLORS.info} />
          ) : (
            <Text style={styles.revenueStatNumber}>{storeStats.completedOrders}</Text>
          )}
        </View>
        
        <View style={styles.revenueStatItem}>
          <View style={styles.revenueStatHeader}>
            <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.warning} />
            <Text style={styles.revenueStatLabel}>Rata-rata Nilai Pesanan</Text>
          </View>
          {loadingStats ? (
            <ActivityIndicator size="small" color={COLORS.warning} />
          ) : (
            <Text style={styles.revenueStatValue}>{formatCurrency(storeStats.averageOrderValue)}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.revenueNote}>
        <MaterialCommunityIcons name="information" size={16} color={COLORS.textSecondary} />
        <Text style={styles.revenueNoteText}>
          Pendapatan sudah dikurangi biaya admin (1.5%)
        </Text>
      </View>
    </View>
  );

  const renderEditableField = (label, value, field, multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={(text) => setStoreData({ ...storeData, [field]: text })}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Belum diatur'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Toko</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (isEditing) {
              handleSaveProfile();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <MaterialCommunityIcons 
            name={isEditing ? 'check' : 'pencil'} 
            size={24} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Store Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.storeImageContainer}>
            <Image
              source={{ 
                uri: user?.storeImage || user?.storeLogo || imageService.generatePlaceholderStoreImage(user?.storeName || user?.name || 'Store', 'seller')
              }}
              style={styles.storeImage}
              resizeMode="stretch"
            />
            <TouchableOpacity 
              style={styles.changeImageButton}
              onPress={handleChangeStoreImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={COLORS.card} />
              ) : (
                <MaterialCommunityIcons name="camera" size={20} color={COLORS.card} />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.storeInfo}>
            {renderEditableField('Nama Toko', storeData.storeName, 'storeName')}
            {renderEditableField('Deskripsi', storeData.storeDescription, 'storeDescription', true)}
          </View>
        </View>

        {/* Store Stats */}
        {renderStoreStats()}

        {/* Revenue Stats */}
        {renderRevenueStats()}

        {/* Store Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Informasi Toko</Text>
          
          {renderEditableField('Alamat', storeData.address, 'address', true)}
          {renderEditableField('Kota', storeData.city, 'city')}
          {renderEditableField('Nomor Telepon', storeData.phone, 'phone')}
        </View>

        {/* Bank Account */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Rekening Bank</Text>
          
          {renderEditableField('Nama Bank', storeData.sellerBankName, 'sellerBankName')}
          {renderEditableField('Nomor Rekening', storeData.sellerBankAccount, 'sellerBankAccount')}
          {renderEditableField('Nama Pemilik', storeData.sellerAccountName, 'sellerAccountName')}
        </View>

        {/* Account Settings */}
        <View style={styles.menuCard}>
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <MaterialCommunityIcons name="lock-reset" size={24} color={COLORS.warning} />
            <Text style={styles.menuText}>Ganti Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                // Reset data to original
                setStoreData({
                  storeName: user?.storeName || 'Toko Saya',
                  storeDescription: user?.storeDescription || 'Deskripsi toko belum diatur',
                  address: user?.address || 'Alamat belum diatur',
                  city: user?.city || 'Kota belum diatur',
                  phone: user?.phone || 'Nomor telepon belum diatur',
                  sellerBankAccount: user?.sellerBankAccount || '',
                  sellerAccountName: user?.sellerAccountName || '',
                  sellerBankName: user?.sellerBankName || '',
                });
              }}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
            <Text style={styles.logoutButtonText}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  editButton: {
    padding: SPACING.xs,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  storeImageContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  storeImage: {
    width: 100,
    height: 100,
    borderRadius: 12, // Square with rounded corners
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  storeInfo: {
    width: '100%',
  },
  statsContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.small,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  statIconContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Revenue Stats Styles
  revenueContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  revenueTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  revenueStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  revenueStatItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    minHeight: 80,
  },
  revenueStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  revenueStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  revenueStatValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 18,
  },
  revenueStatNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  revenueNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '10',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.info + '20',
  },
  revenueNoteText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
    fontStyle: 'italic',
  },
  
  detailsCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
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
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  fieldValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  fieldInput: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  menuCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    flex: 1,
    marginLeft: SPACING.md,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});

export default SellerStoreProfileScreen;