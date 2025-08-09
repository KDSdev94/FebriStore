import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { addressService } from '../services/addressService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const AddressesScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    recipientName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    latitude: null,
    longitude: null,
    isDefault: false,
  });

  useEffect(() => {
    loadAddresses();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Aplikasi memerlukan izin lokasi untuk fitur alamat otomatis',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      if (!user?.id) return;
      
      const userAddresses = await addressService.getAddresses(user.id);
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Gagal memuat alamat');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Izin lokasi diperlukan untuk menggunakan fitur ini');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocoding untuk mendapatkan alamat
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const fullAddress = `${address.street || ''} ${address.streetNumber || ''}, ${address.subregion || ''}, ${address.district || ''}`.trim();
        
        setFormData(prev => ({
          ...prev,
          address: fullAddress,
          city: `${address.city || address.subregion || ''}, ${address.region || ''}`,
          postalCode: address.postalCode || '',
          latitude,
          longitude,
        }));

        Alert.alert('Berhasil', 'Lokasi saat ini berhasil diambil');
      } else {
        // Jika reverse geocoding gagal, tetap simpan koordinat
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
        }));
        Alert.alert('Berhasil', 'Koordinat lokasi berhasil diambil. Silakan lengkapi alamat secara manual.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Gagal mendapatkan lokasi saat ini. Pastikan GPS aktif dan izin lokasi telah diberikan.');
    } finally {
      setLoadingLocation(false);
    }
  };



  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({
      label: '',
      recipientName: user?.fullName || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      postalCode: '',
      latitude: null,
      longitude: null,
      isDefault: false,
    });
    setModalVisible(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData(address);
    setModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.label || !formData.recipientName || !formData.phone || !formData.address || !formData.city || !formData.postalCode) {
      Alert.alert('Error', 'Mohon lengkapi semua field yang diperlukan');
      return;
    }

    try {
      if (editingAddress) {
        // Update existing address
        await addressService.updateAddress(user.id, editingAddress.id, formData);
        Alert.alert('Berhasil', 'Alamat berhasil diperbarui');
      } else {
        // Add new address
        await addressService.addAddress(user.id, formData);
        Alert.alert('Berhasil', 'Alamat berhasil ditambahkan');
      }

      // Reload addresses
      await loadAddresses();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Gagal menyimpan alamat');
    }
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Hapus Alamat',
      'Apakah Anda yakin ingin menghapus alamat ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressService.deleteAddress(user.id, addressId);
              await loadAddresses();
              Alert.alert('Berhasil', 'Alamat berhasil dihapus');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Gagal menghapus alamat');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (addressId) => {
    try {
      await addressService.setDefaultAddress(user.id, addressId);
      await loadAddresses();
      Alert.alert('Berhasil', 'Alamat utama berhasil diubah');
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Gagal mengubah alamat utama');
    }
  };

  const renderAddressItem = (address) => (
    <View key={address.id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressLabelContainer}>
          <MaterialCommunityIcons 
            name={address.label === 'Rumah' ? 'home' : address.label === 'Kantor' ? 'office-building' : 'map-marker'} 
            size={20} 
            color={COLORS.primary} 
          />
          <Text style={styles.addressLabel}>{address.label}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Utama</Text>
            </View>
          )}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAddress(address)}
          >
            <Feather name="edit-2" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(address.id)}
          >
            <Feather name="trash-2" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressContent}>
        <Text style={styles.recipientName}>{address.recipientName}</Text>
        <Text style={styles.recipientPhone}>{address.phone}</Text>
        <Text style={styles.addressText}>{address.address}</Text>
        <Text style={styles.cityText}>{address.city} {address.postalCode}</Text>
      </View>

      {!address.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={() => handleSetDefault(address.id)}
        >
          <Text style={styles.setDefaultText}>Jadikan Alamat Utama</Text>
        </TouchableOpacity>
      )}
    </View>
  );



  const renderAddressModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <Feather name="x" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingAddress ? 'Edit Alamat' : 'Tambah Alamat'}
          </Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleSaveAddress}
          >
            <Text style={styles.modalSaveText}>Simpan</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Label Alamat *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.label}
              onChangeText={(text) => setFormData({...formData, label: text})}
              placeholder="Contoh: Rumah, Kantor, Kos"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Penerima *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.recipientName}
              onChangeText={(text) => setFormData({...formData, recipientName: text})}
              placeholder="Nama lengkap penerima"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nomor Telepon *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder="+62 xxx-xxxx-xxxx"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Alamat Lengkap *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => setFormData({...formData, address: text})}
              placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />
            
            {/* Location Buttons */}
            <View style={styles.locationButtons}>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.primary} />
                )}
                <Text style={styles.locationButtonText}>Gunakan Lokasi Saat Ini</Text>
              </TouchableOpacity>
            </View>
            
            {formData.latitude && formData.longitude && (
              <View style={styles.coordinateInfo}>
                <MaterialCommunityIcons name="map-marker-check" size={16} color={COLORS.success} />
                <Text style={styles.coordinateText}>
                  Koordinat: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kota *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.city}
              onChangeText={(text) => setFormData({...formData, city: text})}
              placeholder="Nama kota"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kode Pos *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.postalCode}
              onChangeText={(text) => setFormData({...formData, postalCode: text})}
              placeholder="12345"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={styles.defaultCheckbox}
            onPress={() => setFormData({...formData, isDefault: !formData.isDefault})}
          >
            <MaterialCommunityIcons
              name={formData.isDefault ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={formData.isDefault ? COLORS.primary : COLORS.textLight}
            />
            <Text style={styles.defaultCheckboxText}>Jadikan sebagai alamat utama</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Alamat Pengiriman</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddAddress}
        >
          <Feather name="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="map-marker-off" size={80} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Belum Ada Alamat</Text>
            <Text style={styles.emptySubtitle}>
              Tambahkan alamat pengiriman untuk memudahkan proses checkout
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddAddress}
            >
              <Text style={styles.addFirstButtonText}>Tambah Alamat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressesList}>
            {addresses.map(renderAddressItem)}
          </View>
        )}
      </ScrollView>

      {renderAddressModal()}
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
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  addressesList: {
    padding: SPACING.lg,
  },
  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  defaultText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: 'bold',
    fontSize: 10,
  },
  addressActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  addressContent: {
    marginBottom: SPACING.md,
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
    marginBottom: SPACING.sm,
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
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  setDefaultText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
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
  addFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addFirstButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    fontWeight: '600',
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
  modalSaveButton: {
    padding: SPACING.sm,
  },
  modalSaveText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  inputGroup: {
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
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  defaultCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  defaultCheckboxText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  // Location Buttons Styles
  locationButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  locationButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  coordinateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.success + '10',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  coordinateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontFamily: 'monospace',
  },

});

export default AddressesScreen;