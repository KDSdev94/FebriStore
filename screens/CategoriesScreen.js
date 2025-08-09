import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { productService } from '../services/productService';

const CategoriesScreen = ({ navigation, route }) => {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(route?.params?.selectedCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchQuery, products]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load products
      const productsResult = await productService.getAllProducts();
      if (productsResult.success) {
        setProducts(productsResult.products);
      } else {
        setError(productsResult.error || 'Gagal memuat produk');
        setProducts([]);
      }

      // Load categories
      const categoriesResult = await productService.getCategories();
      if (categoriesResult.success) {
        // Convert array to object format for compatibility
        const categoriesData = categoriesResult.categories.map((category, index) => ({
          id: category.toLowerCase().replace(/\s+/g, '_'),
          name: category,
          icon: getCategoryIcon(category)
        }));
        setCategories([{ id: 'all', name: 'Semua', icon: 'apps' }, ...categoriesData]);
      } else {
        console.error('Error loading categories:', categoriesResult.error);
        setCategories([{ id: 'all', name: 'Semua', icon: 'apps' }]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Terjadi kesalahan saat memuat data');
      setProducts([]);
      setCategories([{ id: 'all', name: 'Semua', icon: 'apps' }]);
    } finally {
      setLoading(false);
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
      'Mainan & Hobi': 'toy-brick',
      'Otomotif': 'car',
      'Pertanian': 'sprout'
    };
    return iconMap[categoryName] || 'tag';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      // Find category name by ID
      const categoryObj = categories.find(cat => cat.id === selectedCategory);
      const categoryName = categoryObj ? categoryObj.name : selectedCategory;
      
      console.log('Filtering by category:', {
        selectedCategory,
        categoryName,
        totalProducts: products.length
      });
      
      filtered = filtered.filter(product => {
        const matches = product.category === categoryName || product.category === selectedCategory;
        if (matches) {
          console.log('Product matches category:', product.name, 'category:', product.category);
        }
        return matches;
      });
      
      console.log('Filtered products count:', filtered.length);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderCategory = ({ item }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={20}
          color={isSelected ? COLORS.card : COLORS.primary}
        />
        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <View style={styles.productImageContainer}>
        <Image 
          source={{ 
            uri: item.images && item.images.length > 0 
              ? item.images[0] 
              : (item.imageUrl || item.image) 
          }} 
          style={styles.productImage} 
        />
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

        {/* Store Name */}
        {item.storeName && (
          <View style={styles.storeInfoCard}>
            <MaterialCommunityIcons name="store" size={12} color={COLORS.textSecondary} />
            <Text style={styles.storeNameCard} numberOfLines={1}>{item.storeName}</Text>
          </View>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => addToCart(item)}
        >
          <MaterialCommunityIcons name="cart-plus" size={16} color={COLORS.card} />
          <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Categories are now loaded from database and already include 'all' option

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Produk</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat produk...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Produk</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produk</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={COLORS.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari produk..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products */}
      <View style={styles.productsContainer}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} produk ditemukan
        </Text>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>
              {products.length === 0 ? 'Belum ada produk tersedia' : 'Tidak ada produk yang sesuai dengan pencarian'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
            columnWrapperStyle={styles.productRow}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
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
    paddingBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
  categoriesContainer: {
    backgroundColor: COLORS.card,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  categoriesList: {
    paddingHorizontal: SPACING.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
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
  categoryChipText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: COLORS.card,
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  resultsText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  productsList: {
    paddingBottom: SPACING.xl,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },

  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 2, // Reduced margin to bring store name closer
    lineHeight: 16,
    minHeight: 32, // Reduced height to make room for store name
  },

  storeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm, // Increased margin to give space before price
  },
  storeNameCard: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontSize: 10,
    fontWeight: '500',
  },

  priceContainer: {
    marginBottom: SPACING.md,
  },
  price: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xs,
    paddingVertical: SPACING.sm,
  },
  addToCartText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
  },
  
  // Empty state styles
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl * 3,
    paddingBottom: SPACING.xl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default CategoriesScreen;