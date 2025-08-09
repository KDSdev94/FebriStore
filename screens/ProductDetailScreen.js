import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { productService } from '../services/productService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { product: initialProduct } = route.params;
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);

  // Load fresh product data with updated store information
  useEffect(() => {
    const loadFreshProductData = async () => {
      if (initialProduct?.id) {
        setLoading(true);
        try {
          const result = await productService.getProductWithSellerInfo(initialProduct.id);
          if (result.success) {
            setProduct(result.product);
          }
        } catch (error) {
          console.error('Error loading fresh product data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadFreshProductData();
  }, [initialProduct?.id]);

  // Validasi data produk
  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Produk tidak ditemukan</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get product images from the images array or fallback to single image
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.imageUrl || product.image || 'https://via.placeholder.com/300x200/E0E0E0/757575?text=No+Image'];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    // Ensure seller information exists
    const productWithSeller = {
      ...product,
      sellerId: product.sellerId || product.storeId || `seller-${Math.floor(Math.random() * 100) + 1}`,
      sellerName: product.sellerName || product.storeName || `Toko ${product.name?.split(' ')[0] || 'Elektronik'}`,
      storeName: product.storeName || product.sellerName || `Toko ${product.name?.split(' ')[0] || 'Elektronik'}`,
    };
    
    console.log('Adding to cart with seller info:', {
      productName: productWithSeller.name,
      sellerId: productWithSeller.sellerId,
      sellerName: productWithSeller.sellerName,
      storeName: productWithSeller.storeName
    });
    
    addToCart(productWithSeller, quantity);
    
    Alert.alert(
      'Berhasil',
      `${quantity} ${product.name} telah ditambahkan ke keranjang`,
      [
        { text: 'OK' },
        { 
          text: 'Lihat Keranjang', 
          onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' })
        }
      ]
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigation.navigate('MainTabs', { screen: 'Cart' });
  };

  const incrementQuantity = () => {
    const maxStock = product.stock || 999;
    if (quantity < maxStock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
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
        <Text style={styles.headerTitle}>Detail Produk</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {productImages.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.productImage}
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {productImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name || 'Nama Produk'}</Text>
          
          {/* Store Info - Moved above price */}
          {product.storeName && (
            <View style={styles.storeInfo}>
              <MaterialCommunityIcons name="store" size={16} color={COLORS.textSecondary} />
              <Text style={styles.storeName}>{product.storeName}</Text>
              {product.storeCity && (
                <Text style={styles.storeLocation}> • {product.storeCity}</Text>
              )}
              {loading && (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
              )}
            </View>
          )}
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(product.price || 0)}</Text>
          </View>
          
          {/* Stock Info */}
          <View style={styles.stockInfo}>
            <Text style={styles.stockText}>
              Stok: {product.stock || 0} tersedia
            </Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Jumlah:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Feather name="minus" size={16} color={quantity <= 1 ? COLORS.textLight : COLORS.primary} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity
                style={[
                  styles.quantityButton, 
                  quantity >= (product.stock || 999) && styles.quantityButtonDisabled
                ]}
                onPress={incrementQuantity}
                disabled={quantity >= (product.stock || 999)}
              >
                <Feather 
                  name="plus" 
                  size={16} 
                  color={quantity >= (product.stock || 999) ? COLORS.textLight : COLORS.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
            <Text style={styles.description}>
              {product.description || `${product.name || 'Produk ini'} adalah produk berkualitas tinggi dengan fitur-fitur terdepan. Dirancang khusus untuk memenuhi kebutuhan Anda dengan performa yang optimal dan daya tahan yang luar biasa.`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>{formatPrice(product.price * quantity)}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <MaterialCommunityIcons name="cart-plus" size={20} color={COLORS.primary} />
            <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.buyNowButton}
            onPress={handleBuyNow}
          >
            <Text style={styles.buyNowText}>Beli Sekarang</Text>
          </TouchableOpacity>
        </View>
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
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: COLORS.card,
  },
  productImage: {
    width: width,
    height: width,
    resizeMode: 'cover',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.xs,
  },
  activeIndicator: {
    backgroundColor: COLORS.primary,
  },
  productInfo: {
    backgroundColor: COLORS.card,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
  },
  productName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  priceContainer: {
    marginBottom: SPACING.lg,
  },
  price: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  quantityLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '500',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  quantityButton: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quantityButtonDisabled: {
    backgroundColor: COLORS.divider,
  },
  quantityText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginHorizontal: SPACING.md,
    minWidth: 30,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  description: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  bottomActions: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },
  totalPrice: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addToCartText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  buyNowButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  buyNowText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  backButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  storeName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  storeLocation: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  stockInfo: {
    marginBottom: SPACING.md,
  },
  stockText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
    fontWeight: '500',
  },
});

export default ProductDetailScreen;