import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../../utils/constants';
import { adminService } from '../../services/adminService';
import { imageService } from '../../services/imageService';

const AdminStoreDetailScreen = ({ navigation, route }) => {
  const { store: initialStore } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(initialStore);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (initialStore?.sellerId) {
      loadStoreDetail();
    } else {
      setLoading(false);
    }
  }, []);

  const loadStoreDetail = async () => {
    try {
      setLoading(true);
      const result = await adminService.getStoreDetail(initialStore.sellerId);
      if (result.success) {
        setStore(result.store);
        setProducts(result.store.products);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error loading store detail:', error);
      Alert.alert('Error', 'Gagal memuat detail toko');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStoreDetail();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeactivateStore = () => {
    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin ${store.isActive ? 'menonaktifkan' : 'mengaktifkan'} toko "${store?.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: store.isActive ? 'Nonaktifkan' : 'Aktifkan', 
          style: store.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const result = await adminService.updateStoreStatus(store.sellerId, !store.isActive);
              if (result.success) {
                Alert.alert('Berhasil', `Toko berhasil ${store.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
                // Update local state
                setStore(prev => ({ ...prev, isActive: !prev.isActive, status: !prev.isActive ? 'Aktif' : 'Nonaktif' }));
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              console.error('Error updating store status:', error);
              Alert.alert('Error', 'Gagal memperbarui status toko');
            }
          }
        }
      ]
    );
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin menghapus produk "${product.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await adminService.deleteProduct(product.id);
              if (result.success) {
                Alert.alert('Berhasil', 'Produk berhasil dihapus');
                // Remove product from local state
                setProducts(prev => prev.filter(p => p.id !== product.id));
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Gagal menghapus produk');
            }
          }
        }
      ]
    );
  };

  const ProductCard = ({ product }) => (
    <View style={styles.productCard}>
      <View style={styles.productImage}>
        {product.images && product.images.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.productImageStyle} />
        ) : (
          <MaterialCommunityIcons name="image" size={40} color="#ccc" />
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
        <Text style={styles.productStock}>Stok: {product.stock || 0}</Text>
        {product.category && (
          <Text style={styles.productCategory}>Kategori: {product.category}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.deleteProductButton}
        onPress={() => handleDeleteProduct(product)}
      >
        <Text style={styles.deleteProductText}>Hapus</Text>
      </TouchableOpacity>
    </View>
  );

  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Memuat detail toko...</Text>
    </View>
  );

  const EmptyProducts = () => (
    <View style={styles.emptyProducts}>
      <MaterialCommunityIcons name="package-variant-closed" size={48} color="#ccc" />
      <Text style={styles.emptyProductsText}>Belum ada produk di toko ini</Text>
    </View>
  );

  if (!initialStore) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Toko</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Data toko tidak ditemukan</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Toko</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <LoadingState />
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Store Info Card */}
          <View style={styles.storeInfoCard}>
            <View style={styles.storeHeader}>
              <View style={styles.storeImageContainer}>
                <Image
                  source={{ 
                    uri: store.storeImage || store.avatar || store.profileImage || imageService.generatePlaceholderStoreImage(store.name || 'Store', 'seller')
                  }}
                  style={styles.storeImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.storeDetails}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeOwner}>Pemilik: {store.owner}</Text>
                <View style={[styles.statusBadge, { backgroundColor: store.isActive ? COLORS.success : COLORS.error }]}>
                  <Text style={styles.statusBadgeText}>{store.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.storeContactInfo}>
              <Text style={styles.contactLabel}>Email: {store.email}</Text>
              <Text style={styles.contactLabel}>Telepon: {store.phone}</Text>
              <Text style={styles.contactLabel}>Bergabung: {store.createdDate}</Text>
            </View>

            <Text style={styles.storeDescription}>
              {store.description || 'Tidak ada deskripsi toko'}
            </Text>

            <TouchableOpacity 
              style={[styles.deactivateStoreButton, { 
                borderColor: store.isActive ? COLORS.primary : COLORS.success,
              }]}
              onPress={handleDeactivateStore}
            >
              <Text style={[styles.deactivateStoreText, { 
                color: store.isActive ? COLORS.primary : COLORS.success 
              }]}>
                {store.isActive ? 'Nonaktifkan Toko' : 'Aktifkan Toko'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Products Section */}
          <View style={styles.productsSection}>
            <View style={styles.productsSectionHeader}>
              <Text style={styles.productsSectionTitle}>Produk Toko</Text>
              <Text style={styles.productsCount}>{products.length} Produk</Text>
            </View>

            {products.length === 0 ? (
              <EmptyProducts />
            ) : (
              <View style={styles.productsList}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  storeInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  storeImageContainer: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  storeOwner: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  storeContactInfo: {
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  deactivateStoreButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deactivateStoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productsSection: {
    marginBottom: 20,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImageStyle: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#888',
  },
  deleteProductButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteProductText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  emptyProductsText: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AdminStoreDetailScreen;