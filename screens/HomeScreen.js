import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { productService } from '../services/productService';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Sample data - in real app, this would come from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load products
      const productsResult = await productService.getAllProducts();
      if (productsResult.success) {
        // Ambil 10 produk pertama sebagai featured products
        const featured = productsResult.products.slice(0, 10);
        setFeaturedProducts(featured);
      } else {
        console.error('Error loading products:', productsResult.error);
        setFeaturedProducts([]);
      }

      // Load categories
      const categoriesResult = await productService.getCategories();
      if (categoriesResult.success) {
        // Convert array to object format for compatibility
        const categoriesData = categoriesResult.categories.map((category, index) => ({
          id: index.toString(),
          name: category,
          icon: getCategoryIcon(category)
        }));
        setCategories(categoriesData);
      } else {
        console.error('Error loading categories:', categoriesResult.error);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setFeaturedProducts([]);
      setCategories([]);
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => navigation.navigate('Categories', { selectedCategory: item.id })}
    >
      <View style={styles.categoryIcon}>
        <MaterialCommunityIcons name={item.icon} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => {
        console.log('Navigating to ProductDetail with:', item);
        navigation.navigate('ProductDetail', { product: item });
      }}
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
          <Text style={styles.addToCartText}>Tambah</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Selamat datang,</Text>
            <Text style={styles.userName}>{user?.fullName || 'Pengguna'}</Text>
            <View style={styles.roleIndicator}>
              <MaterialCommunityIcons 
                name={user?.role === 'seller' ? 'store' : 'shopping'} 
                size={16} 
                color={COLORS.card} 
              />
              <Text style={styles.roleText}>
                {user?.role === 'seller' ? 'Penjual' : 'Pembeli'}
              </Text>
            </View>
          </View>

        </View>

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
          </View>
        </View>
      </LinearGradient>

      {/* Seller Dashboard */}
      {user?.role === 'seller' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard Penjual</Text>
          <View style={styles.sellerDashboard}>
            <TouchableOpacity style={styles.dashboardCard}>
              <MaterialCommunityIcons name="package-variant" size={32} color={COLORS.primary} />
              <Text style={styles.dashboardCardTitle}>Kelola Produk</Text>
              <Text style={styles.dashboardCardSubtitle}>Tambah & edit produk</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dashboardCard}>
              <MaterialCommunityIcons name="chart-line" size={32} color={COLORS.success} />
              <Text style={styles.dashboardCardTitle}>Penjualan</Text>
              <Text style={styles.dashboardCardSubtitle}>Lihat laporan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dashboardCard}>
              <MaterialCommunityIcons name="clipboard-list" size={32} color={COLORS.warning} />
              <Text style={styles.dashboardCardTitle}>Pesanan</Text>
              <Text style={styles.dashboardCardSubtitle}>Kelola pesanan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dashboardCard}>
              <MaterialCommunityIcons name="store-cog" size={32} color={COLORS.info} />
              <Text style={styles.dashboardCardTitle}>Toko</Text>
              <Text style={styles.dashboardCardSubtitle}>Pengaturan toko</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content for Buyers */}
      {user?.role !== 'seller' && (
        <>
          {/* Categories */}
          <View style={[styles.section, { marginTop: SPACING.xl }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kategori</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories.slice(0, 8)}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              numColumns={4}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesGrid}
              columnWrapperStyle={styles.categoryRow}
            />
          </View>

          {/* Featured Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Produk Unggulan</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    opacity: 0.9,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.card,
    fontWeight: 'bold',
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  searchContainer: {
    marginTop: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  seeAllText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sellerDashboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  },
  dashboardCard: {
    width: (width - SPACING.lg * 3) / 2,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  dashboardCardTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  dashboardCardSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  categoriesGrid: {
    paddingHorizontal: SPACING.lg,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: (width - SPACING.lg * 2 - SPACING.md * 3) / 4,
  },
  categoryIcon: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
  },
  productsList: {
    paddingHorizontal: SPACING.lg,
  },
  productCard: {
    width: 160,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    ...SHADOWS.small,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
    paddingVertical: SPACING.xs,
  },
  addToCartText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});

export default HomeScreen;