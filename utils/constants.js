import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Colors - Adapted for ecommerce theme
export const COLORS = {
  primary: '#4A90E2',
  primaryDark: '#357ABD',
  primaryLight: '#E3F2FD',
  secondary: '#50C878',
  accent: '#FF6B6B',
  warning: '#FFB347',
  success: '#4CAF50',
  info: '#3182CE',
  background: '#F8FAFC',
  backgroundSecondary: '#EDF2F7',
  card: '#FFFFFF',
  white: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  text: '#2D3748',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  textLight: '#A0AEC0',
  error: '#E53E3E',
  purple: '#9F7AEA',
  divider: '#E2E8F0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  glass: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.25)',
  
  // Ecommerce specific colors
  price: '#E53E3E',
  discount: '#38A169',
  rating: '#F6AD55',
  outOfStock: '#A0AEC0',
  inStock: '#38A169',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
};

// Screen dimensions
export const SCREEN = {
  width,
  height,
  isSmall: width < 375,
  isMedium: width >= 375 && width < 414,
  isLarge: width >= 414,
};

// Border radius
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

// Shadow styles
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Animation durations
export const ANIMATION = {
  fast: 200,
  medium: 300,
  slow: 500,
};

// Note: Categories and Order Status are now managed in database
// Use settingsService.getCategories() and settingsService.getOrderStatuses() instead

// Payment methods
export const PAYMENT_METHODS = [
  { id: 'cod', name: 'Bayar di Tempat (COD)', icon: 'cash' },
  { id: 'bank_transfer', name: 'Transfer Bank', icon: 'bank' },
  { id: 'e_wallet', name: 'E-Wallet', icon: 'wallet' },
  { id: 'credit_card', name: 'Kartu Kredit', icon: 'credit-card' },
];

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SCREEN,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
  PAYMENT_METHODS,
};