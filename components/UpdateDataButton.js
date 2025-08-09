import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { updateProductStoreNames } from '../scripts/updateProductStoreNames';
import { updateOrderStoreNames } from '../scripts/updateOrderStoreNames';
import { clearOrdersWithSummary } from '../scripts/clearOrderData';
import { useOrder } from '../contexts/OrderContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../utils/constants';

const UpdateDataButton = () => {
  const [updating, setUpdating] = useState(false);
  const { clearAllOrders, orders } = useOrder();

  const handleUpdateProducts = async () => {
    setUpdating(true);
    try {
      const result = await updateProductStoreNames();
      
      if (result.success) {
        Alert.alert(
          'Update Produk Berhasil',
          `${result.message}\n\nProduk yang diupdate: ${result.updatedCount || 0}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Gagal update produk');
      }
    } catch (error) {
      console.error('Error updating products:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat update produk');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateOrders = async () => {
    setUpdating(true);
    try {
      const result = await updateOrderStoreNames();
      
      if (result.success) {
        Alert.alert(
          'Update Order Berhasil',
          `${result.message}\n\nOrder yang diupdate: ${result.updatedCount || 0}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Gagal update order');
      }
    } catch (error) {
      console.error('Error updating orders:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearOrders = async () => {
    const currentOrderCount = orders.length;
    
    Alert.alert(
      'Hapus Semua Pesanan',
      `Apakah Anda yakin ingin menghapus SEMUA ${currentOrderCount} pesanan? Tindakan ini tidak dapat dibatalkan!`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const result = await clearAllOrders();
              
              if (result.success) {
                Alert.alert(
                  'Penghapusan Berhasil',
                  `${currentOrderCount} pesanan berhasil dihapus!\n\nSistem sekarang bersih dari data pesanan lama.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', result.error || 'Gagal menghapus data pesanan');
              }
            } catch (error) {
              console.error('Error clearing orders:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat menghapus data pesanan');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateAll = async () => {
    Alert.alert(
      'Update Semua Data',
      'Apakah Anda yakin ingin memperbarui semua data produk dan order?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Update',
          onPress: async () => {
            setUpdating(true);
            try {
              // Update products first
              console.log('Updating products...');
              const productResult = await updateProductStoreNames();
              
              // Then update orders
              console.log('Updating orders...');
              const orderResult = await updateOrderStoreNames();
              
              const message = `Update Selesai!\n\nProduk: ${productResult.message || 'Error'}\nOrder: ${orderResult.message || 'Error'}`;
              
              Alert.alert('Update Selesai', message, [{ text: 'OK' }]);
            } catch (error) {
              console.error('Error updating all data:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat update data');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Data Toko</Text>
      <Text style={styles.subtitle}>
        Perbaiki nama toko pada produk dan pesanan yang sudah ada
      </Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          📊 Pesanan saat ini: {orders.length} pesanan
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.productButton]}
        onPress={handleUpdateProducts}
        disabled={updating}
      >
        <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.card} />
        <Text style={styles.buttonText}>Update Produk</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.orderButton]}
        onPress={handleUpdateOrders}
        disabled={updating}
      >
        <MaterialCommunityIcons name="receipt" size={20} color={COLORS.card} />
        <Text style={styles.buttonText}>Update Pesanan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={handleClearOrders}
        disabled={updating}
      >
        <MaterialCommunityIcons name="delete-sweep" size={20} color={COLORS.card} />
        <Text style={styles.buttonText}>Hapus Semua Pesanan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.allButton]}
        onPress={handleUpdateAll}
        disabled={updating}
      >
        <MaterialCommunityIcons name="update" size={20} color={COLORS.card} />
        <Text style={styles.buttonText}>
          {updating ? 'Memperbarui...' : 'Update Semua'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        💡 Tip: Jalankan update ini setelah ada perubahan sistem nama toko
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  infoContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  infoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  productButton: {
    backgroundColor: COLORS.primary,
  },
  orderButton: {
    backgroundColor: COLORS.success,
  },
  clearButton: {
    backgroundColor: COLORS.error,
  },
  allButton: {
    backgroundColor: COLORS.warning,
  },
  buttonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  note: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
});

export default UpdateDataButton;