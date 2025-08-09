import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { productService } from '../../services/productService';

const EditProductScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const { user } = useAuth();
  const [productData, setProductData] = useState({
    name: product.name,
    description: product.description || 'Dada ayam fillet dibalut tepung roti, digoreng renyah keemasan. Gurih, renyah di luar, lembut di dalam. Nikmat disantap dengan saus katsu atau nasi hangat!',
    price: product.price.toString(),
    stock: product.stock.toString(),
    category: product.category,
    images: product.images || (product.imageUrl ? [product.imageUrl] : (product.image ? [product.image] : [])),
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const result = await productService.getCategories();
      if (result.success) {
        // Convert array to object format for compatibility
        const categoriesData = result.categories.map((category, index) => ({
          id: index.toString(),
          name: category,
          icon: getCategoryIcon(category)
        }));
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Makanan & Minuman': 'food',
      'Elektronik': 'laptop',
      'Fashion': 'tshirt-crew',
      'Kesehatan & Kecantikan': 'heart-pulse',
      'Rumah Tangga': 'home',
      'Olahraga': 'basketball',
      'Buku & Alat Tulis': 'book',
      'Mainan & Hobi': 'toy-brick'
    };
    return iconMap[categoryName] || 'tag';
  };

  const handleSaveProduct = async () => {
    if (!productData.name.trim()) {
      Alert.alert('Error', 'Nama produk tidak boleh kosong');
      return;
    }
    
    if (!productData.category) {
      Alert.alert('Error', 'Silakan pilih kategori produk');
      return;
    }
    
    if (!productData.price.trim() || isNaN(productData.price)) {
      Alert.alert('Error', 'Harga produk harus berupa angka');
      return;
    }
    
    if (!productData.stock.trim() || isNaN(productData.stock)) {
      Alert.alert('Error', 'Stok produk harus berupa angka');
      return;
    }

    setLoading(true);
    
    try {
      const storeInfo = {
        storeName: user?.storeName || '',
        userName: user?.name || '',
        city: user?.city || '',
        address: user?.address || '',
        phone: user?.phone || ''
      };

      const updatedProductData = {
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        category: productData.category,
        images: productData.images,
        imageUrl: productData.images && productData.images.length > 0 ? productData.images[0] : null
      };

      const result = await productService.updateProduct(
        product.id, 
        updatedProductData, 
        storeInfo
      );

      if (result.success) {
        Alert.alert(
          'Berhasil',
          'Produk berhasil diperbarui',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Gagal memperbarui produk');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memperbarui produk');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Hapus Produk',
      'Apakah Anda yakin ingin menghapus produk ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await productService.deleteProduct(product.id);
              
              if (result.success) {
                Alert.alert(
                  'Berhasil', 
                  'Produk berhasil dihapus',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'Gagal menghapus produk');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat menghapus produk');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Izin Diperlukan',
        'Aplikasi memerlukan izin untuk mengakses kamera dan galeri foto.'
      );
      return false;
    }
    return true;
  };

  const handleAddImage = () => {
    if (productData.images.length >= 5) {
      Alert.alert('Maksimal Gambar', 'Anda hanya bisa menambahkan maksimal 5 gambar');
      return;
    }

    Alert.alert(
      'Tambah Foto Produk',
      'Pilih sumber gambar untuk produk Anda',
      [
        { 
          text: 'Kamera', 
          onPress: () => pickImageFromCamera()
        },
        { 
          text: 'Galeri', 
          onPress: () => pickImageFromGallery()
        },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...productData.images, result.assets[0].uri];
        setProductData({ ...productData, images: newImages });
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Gagal mengambil foto dari kamera');
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...productData.images, result.assets[0].uri];
        setProductData({ ...productData, images: newImages });
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Gagal mengambil foto dari galeri');
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = productData.images.filter((_, i) => i !== index);
    setProductData({ ...productData, images: newImages });
  };

  const handleReplaceImage = (index) => {
    Alert.alert(
      'Ganti Foto',
      'Pilih sumber gambar baru',
      [
        { 
          text: 'Kamera', 
          onPress: () => replaceImageFromCamera(index)
        },
        { 
          text: 'Galeri', 
          onPress: () => replaceImageFromGallery(index)
        },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  const replaceImageFromCamera = async (index) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...productData.images];
        newImages[index] = result.assets[0].uri;
        setProductData({ ...productData, images: newImages });
      }
    } catch (error) {
      console.error('Error replacing image from camera:', error);
      Alert.alert('Error', 'Gagal mengganti foto dari kamera');
    }
  };

  const replaceImageFromGallery = async (index) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...productData.images];
        newImages[index] = result.assets[0].uri;
        setProductData({ ...productData, images: newImages });
      }
    } catch (error) {
      console.error('Error replacing image from gallery:', error);
      Alert.alert('Error', 'Gagal mengganti foto dari galeri');
    }
  };

  const handleSelectCategory = (category) => {
    setProductData({ ...productData, category: category.name });
    setShowCategoryModal(false);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleSelectCategory(item)}
    >
      <MaterialCommunityIcons name={item.icon} size={24} color={COLORS.primary} />
      <Text style={styles.categoryItemText}>{item.name}</Text>
      {productData.category === item.name && (
        <MaterialCommunityIcons name="check" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={COLORS.card} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Produk</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Product Images */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Foto Produk</Text>
              <Text style={styles.imageCounter}>{productData.images.length}/5 gambar</Text>
            </View>
            
            {productData.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                {productData.images.map((imageUri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <TouchableOpacity onPress={() => handleReplaceImage(index)}>
                      <Image source={{ uri: imageUri }} style={styles.productImagePreview} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.removeImageButton} 
                      onPress={() => handleRemoveImage(index)}
                    >
                      <MaterialCommunityIcons name="close" size={16} color={COLORS.card} />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.primaryImageBadge}>
                        <Text style={styles.primaryImageText}>Utama</Text>
                      </View>
                    )}
                  </View>
                ))}
                
                {productData.images.length < 5 && (
                  <TouchableOpacity style={styles.addImageButtonSmall} onPress={handleAddImage}>
                    <MaterialCommunityIcons name="plus" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
            
            {productData.images.length === 0 && (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={handleAddImage}>
                <MaterialCommunityIcons name="camera-plus" size={48} color={COLORS.textLight} />
                <Text style={styles.placeholderText}>Tambah Foto Produk</Text>
                <Text style={styles.placeholderSubtext}>Minimal 1 gambar, maksimal 5 gambar</Text>
              </TouchableOpacity>
            )}
          </View>

        {/* Product Info Section */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Produk</Text>
            <TextInput
              style={styles.textInput}
              value={productData.name}
              onChangeText={(text) => setProductData({ ...productData, name: text })}
              placeholder="Masukkan nama produk"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.categorySelectorText}>
                {productData.category || 'Pilih Kategori'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Deskripsi Produk</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={productData.description}
              onChangeText={(text) => setProductData({ ...productData, description: text })}
              placeholder="Masukkan deskripsi produk"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.priceStockRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.inputLabel}>Harga</Text>
              <TextInput
                style={styles.textInput}
                value={productData.price}
                onChangeText={(text) => setProductData({ ...productData, price: text })}
                keyboardType="numeric"
                placeholder="Rp 0"
              />
            </View>

            <View style={styles.stockContainer}>
              <Text style={styles.inputLabel}>Stok</Text>
              <TextInput
                style={styles.textInput}
                value={productData.stock}
                onChangeText={(text) => setProductData({ ...productData, stock: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>

          {/* Bottom spacing for buttons */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.disabledButton]}
          onPress={handleDeleteProduct}
          disabled={loading}
        >
          <MaterialCommunityIcons name="delete" size={20} color={COLORS.card} />
          <Text style={styles.deleteButtonText}>HAPUS</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSaveProduct}
          disabled={loading}
        >
          {loading ? (
            <MaterialCommunityIcons name="loading" size={20} color={COLORS.card} />
          ) : (
            <MaterialCommunityIcons name="content-save" size={20} color={COLORS.card} />
          )}
          <Text style={styles.saveButtonText}>
            {loading ? 'MENYIMPAN...' : 'SIMPAN'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {loadingCategories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Memuat kategori...</Text>
              </View>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            )}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.card,
    fontWeight: '600',
    fontSize: 18,
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageSection: {
    backgroundColor: COLORS.card,
    marginTop: 0,
    marginBottom: SPACING.xs,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
  },
  imageContainer: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  productImage: {
    width: 280,
    height: 180,
    backgroundColor: COLORS.backgroundSecondary,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    minWidth: 140,
  },
  changeImageText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  formSection: {
    backgroundColor: COLORS.card,
    marginBottom: SPACING.xs,
    padding: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  textInput: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    fontSize: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  categorySelectorText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontSize: 16,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  priceContainer: {
    flex: 1,
  },
  stockContainer: {
    flex: 1,
  },
  bottomSpacing: {
    height: 80,
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  deleteButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
  },
  noImageText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.card,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  imageCounter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  imagesScrollView: {
    paddingVertical: SPACING.xs,
  },
  imagePreviewContainer: {
    marginRight: SPACING.sm,
    position: 'relative',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  productImagePreview: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.card,
    ...SHADOWS.medium,
    elevation: 5,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryImageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  primaryImageText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontSize: 10,
    fontWeight: 'bold',
  },
  addImageButtonSmall: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    marginRight: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  imagePlaceholder: {
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  placeholderText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  placeholderSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundSecondary,
  },
  categoryItemText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
    fontSize: 16,
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
});

export default EditProductScreen;