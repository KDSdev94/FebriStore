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

const AdminStoreManagementScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const result = await adminService.getAllStores();
      if (result.success) {
        setStores(result.stores);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error loading store data:', error);
      Alert.alert('Error', 'Gagal memuat data toko');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStoreData();
    setRefreshing(false);
  };

  const handleStoreAction = async (action, store) => {
    if (action === 'deactivate') {
      Alert.alert(
        'Konfirmasi',
        `Apakah Anda yakin ingin ${store.isActive ? 'menonaktifkan' : 'mengaktifkan'} toko "${store.name}"?`,
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
                  loadStoreData(); // Refresh data
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
    } else if (action === 'delete') {
      Alert.alert(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus toko "${store.name}"?\n\nTindakan ini akan:\n• Menghapus akun penjual\n• Menghapus semua produk toko (${store.productCount} produk)\n• Tidak dapat dibatalkan`,
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Hapus', 
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await adminService.deleteStore(store.sellerId);
                if (result.success) {
                  Alert.alert('Berhasil', 'Toko dan semua produknya berhasil dihapus');
                  loadStoreData(); // Refresh data
                } else {
                  Alert.alert('Error', result.error);
                }
              } catch (error) {
                console.error('Error deleting store:', error);
                Alert.alert('Error', 'Gagal menghapus toko');
              }
            }
          }
        ]
      );
    } else if (action === 'detail') {
      navigation.navigate('StoreDetail', { store });
    }
  };

  const StoreCard = ({ store }) => (
    <TouchableOpacity 
      style={styles.storeCard}
      onPress={() => handleStoreAction('detail', store)}
      activeOpacity={0.7}
    >
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
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeOwner}>{store.owner}</Text>
          <Text style={styles.storeEmail}>{store.email}</Text>
          <Text style={styles.storeDate}>Dibuat: {store.createdDate}</Text>
          <View style={styles.storeMetrics}>
            <Text style={styles.productCount}>{store.productCount} Produk</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: store.isActive ? COLORS.success : COLORS.error }]} />
            <Text style={[styles.statusText, { color: store.isActive ? COLORS.success : COLORS.error }]}>
              {store.status}
            </Text>
          </View>
        </View>
        <View style={styles.storeActions}>
          <TouchableOpacity 
            style={[styles.actionButton, store.isActive ? styles.deactivateButton : styles.activateButton]}
            onPress={() => handleStoreAction('deactivate', store)}
          >
            <Text style={styles.actionButtonText}>
              {store.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleStoreAction('delete', store)}
          >
            <Text style={styles.deleteButtonText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="store-off" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>Belum Ada Toko</Text>
      <Text style={styles.emptyStateText}>
        Belum ada penjual yang mendaftar di platform ini
      </Text>
    </View>
  );

  const LoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Memuat data toko...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kelola Toko</Text>
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
        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Manajemen Toko</Text>
          {!loading && (
            <Text style={styles.storeCount}>
              {stores.length} Toko Terdaftar
            </Text>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : stores.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.storeList}>
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  storeCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  storeList: {
    marginBottom: 20,
  },
  storeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  storeImageContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  storeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  storeInfo: {
    flex: 1,
    paddingRight: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  storeOwner: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  storeEmail: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  storeDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  storeMetrics: {
    marginBottom: 8,
  },
  productCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  storeActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  deactivateButton: {
    backgroundColor: COLORS.primary,
  },
  activateButton: {
    backgroundColor: COLORS.success,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AdminStoreManagementScreen;