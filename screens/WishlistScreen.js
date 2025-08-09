import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const WishlistScreen = ({ navigation }) => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleRemoveItem = (item) => {
    Alert.alert(
      'Hapus dari Wishlist',
      `Apakah Anda yakin ingin menghapus "${item.name}" dari wishlist?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: () => removeFromWishlist(item.id)
        }
      ]
    );
  };

  const handleClearWishlist = () => {
    Alert.alert(
      'Kosongkan Wishlist',
      'Apakah Anda yakin ingin mengosongkan seluruh wishlist?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Kosongkan', 
          style: 'destructive',
          onPress: clearWishlist
        }
      ]
    );
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    Alert.alert(
      'Berhasil',
      `${item.name} telah ditambahkan ke keranjang`,
      [
        { text: 'OK' },
        { 
          text: 'Lihat Keranjang', 
          onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' })
        }
      ]
    );
  };

  const renderWishlistItem = ({ item }) => (
    <TouchableOpacity
      style={styles.wishlistItem}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image 
        source={{ 
          uri: item.images && item.images.length > 0 
            ? item.images[0] 
            : (item.imageUrl || item.image) 
        }} 
        style={styles.itemImage} 
      />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={14} color={COLORS.rating} />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews} ulasan)</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          {item.originalPrice > item.price && (
            <Text style={styles.originalPrice}>{formatPrice(item.originalPrice)}</Text>
          )}
          {item.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.discount}%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item)}
          >
            <MaterialCommunityIcons name="cart-plus" size={16} color={COLORS.card} />
            <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item)}
          >
            <MaterialCommunityIcons name="heart-off" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyWishlist = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="heart-outline" size={80} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>Wishlist Kosong</Text>
      <Text style={styles.emptySubtitle}>
        Belum ada produk di wishlist Anda.{'\n'}
        Simpan produk favorit untuk dibeli nanti!
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Jelajahi Produk</Text>
      </TouchableOpacity>
    </View>
  );

  if (wishlistItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wishlist</Text>
        </View>
        {renderEmptyWishlist()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <TouchableOpacity onPress={handleClearWishlist}>
          <Text style={styles.clearText}>Kosongkan</Text>
        </TouchableOpacity>
      </View>

      {/* Wishlist Items */}
      <FlatList
        data={wishlistItems}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.wishlistList}
      />

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {wishlistItems.length} produk di wishlist
        </Text>
        <TouchableOpacity
          style={styles.addAllButton}
          onPress={() => {
            wishlistItems.forEach(item => addToCart(item));
            Alert.alert(
              'Berhasil',
              'Semua produk wishlist telah ditambahkan ke keranjang',
              [
                { text: 'OK' },
                { 
                  text: 'Lihat Keranjang', 
                  onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' })
                }
              ]
            );
          }}
        >
          <MaterialCommunityIcons name="cart-plus" size={20} color={COLORS.card} />
          <Text style={styles.addAllButtonText}>Tambah Semua ke Keranjang</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  clearText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.error,
    fontWeight: '600',
  },
  wishlistList: {
    paddingVertical: SPACING.sm,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.sm,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  itemName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  reviewsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  itemPrice: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  originalPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
    marginLeft: SPACING.sm,
  },
  discountBadge: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  discountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: 'bold',
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xs,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  addToCartText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  summaryContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  summaryText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  addAllButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  shopButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
  },
});

export default WishlistScreen;