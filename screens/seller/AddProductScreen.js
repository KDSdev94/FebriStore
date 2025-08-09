import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
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

const AddProductScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    images: [], // Changed from imageUrl to images array
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

      const newProductData = {
        name: productData.name.trim(),
        description: productData.description.trim() || 'Tidak ada deskripsi',
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        category: productData.category,
        images: productData.images.length > 0 ? productData.images : ['https://via.placeholder.com/300x200/E0E0E0/757575?text=No+Image']
      };

      const result = await productService.addProduct(
        newProductData, 
        user.id, 
        storeInfo
      );

      if (result.success) {
        Alert.alert(
          'Berhasil',
          'Produk berhasil ditambahkan',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Gagal menambahkan produk');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menambahkan produk');
    } finally {
      setLoading(false);
    }
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

  const pickImageFromCamera = async (allowsEditing = true) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: allowsEditing,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...productData.images, result.assets[0].uri];
        setProductData({ 
          ...productData, 
          images: newImages
        });
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Gagal mengambil foto dari kamera');
    }
  };

  const pickImageFromGallery = async (allowsEditing = true) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: allowsEditing,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...productData.images, result.assets[0].uri];
        setProductData({ 
          ...productData, 
          images: newImages
        });
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Gagal mengambil foto dari galeri');
    }
  };

  const handleAddImage = () => {
    if (productData.images.length >= 5) {
      Alert.alert('Batas Maksimal', 'Maksimal 5 gambar per produk');
      return;
    }
    
    Alert.alert(
      'Pilih Foto Produk',
      'Pilih sumber gambar untuk produk Anda',
      [
        { 
          text: 'Kamera', 
          onPress: () => pickImageFromCamera(true)
        },
        { 
          text: 'Galeri', 
          onPress: () => pickImageFromGallery(true)
        },
        { text: 'Batal', style: 'cancel' }
      ]
    );
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
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Produk</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSaveProduct}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
        >
        {/* Product Images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Foto Produk</Text>
            <Text style={styles.imageCounter}>
              {productData.images.length}/5 gambar
            </Text>
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

        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Produk</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nama Produk *</Text>
            <TextInput
              style={styles.textInput}
              value={productData.name}
              onChangeText={(text) => setProductData({ ...productData, name: text })}
              placeholder="Masukkan nama produk"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Deskripsi</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={productData.description}
              onChangeText={(text) => setProductData({ ...productData, description: text })}
              placeholder="Masukkan deskripsi produk"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
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
        </View>

        {/* Pricing & Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Harga & Stok</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: SPACING.sm }]}>
              <Text style={styles.inputLabel}>Harga *</Text>
              <TextInput
                style={styles.textInput}
                value={productData.price}
                onChangeText={(text) => setProductData({ ...productData, price: text })}
                placeholder="0"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputContainer, { flex: 1, marginLeft: SPACING.sm }]}>
              <Text style={styles.inputLabel}>Stok *</Text>
              <TextInput
                style={styles.textInput}
                value={productData.stock}
                onChangeText={(text) => setProductData({ ...productData, stock: text })}
                placeholder="0"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

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
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  section: {
    backgroundColor: COLORS.card,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
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
    fontWeight: '600',
  },

  imagePreviewContainer: {
    marginRight: SPACING.sm,
    position: 'relative',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  productImage: {
    width: 280,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    resizeMode: 'cover', // Agar gambar menyesuaikan container
    ...SHADOWS.small,
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
    marginTop: SPACING.md,
  },
  changeImageText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  imagePlaceholder: {
    width: 280,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.divider,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  placeholderText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  placeholderSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  imagePlaceholderDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.backgroundSecondary,
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
  bottomSpacing: {
    height: SPACING.xl,
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
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
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
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs,
  },
  categoryChip: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
  },
  categoryTextSelected: {
    color: COLORS.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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

export default AddProductScreen;