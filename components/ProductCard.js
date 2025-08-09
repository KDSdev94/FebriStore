import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const ProductCard = ({ product, onPress, style }) => {
  const { addToCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress && onPress(product)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.imageUrl || product.image }} style={styles.image} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        
        {/* Store Info */}
        {product.storeName && (
          <View style={styles.storeInfo}>
            <MaterialCommunityIcons name="store" size={12} color={COLORS.textLight} />
            <Text style={styles.storeName} numberOfLines={1}>{product.storeName}</Text>
          </View>
        )}
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <MaterialCommunityIcons name="cart-plus" size={16} color={COLORS.card} />
          <Text style={styles.addToCartText}>Tambah</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },

  content: {
    padding: SPACING.sm,
  },
  name: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 2, // Reduced margin to bring store name closer
    minHeight: 36,
  },

  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm, // Increased margin to give space before price
  },
  storeName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: SPACING.xs,
  },
  addToCartText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});

export default ProductCard;