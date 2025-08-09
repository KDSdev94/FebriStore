import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useOrder } from '../contexts/OrderContext';
import { useCart } from '../contexts/CartContext';
import { imageService } from '../services/imageService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const { orders, getOrdersByUser } = useOrder();
  const { cartItems } = useCart();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userStats, setUserStats] = useState({
    totalOrders: 0,
    totalCartItems: 0,
    completedOrders: 0
  });

  useEffect(() => {
    calculateUserStats();
  }, [orders, cartItems, user]);

  const calculateUserStats = () => {
    if (user?.role !== 'seller') {
      const userOrders = getOrdersByUser(user?.id);
      const completedOrders = userOrders.filter(order => order.status === 'delivered').length;
      const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      setUserStats({
        totalOrders: userOrders.length,
        totalCartItems: totalCartItems,
        completedOrders: completedOrders
      });
    }
  };

  const handleChangeProfilePicture = async () => {
    try {
      setUploadingImage(true);
      const imageUri = await imageService.pickImage();
      
      if (imageUri) {
        // Update user profile with new image URI
        const result = await updateUser({ 
          avatar: imageUri,
          profileImage: imageUri 
        });
        
        if (result.success) {
          Alert.alert('Berhasil', 'Foto profil berhasil diperbarui');
        } else {
          Alert.alert('Error', result.error || 'Gagal memperbarui foto profil');
        }
      }
    } catch (error) {
      console.error('Error changing profile picture:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengubah foto profil');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navigation will be handled automatically by RoleBasedNavigator
          }
        }
      ]
    );
  };

  const getMenuItems = () => {
    const commonItems = [
      {
        id: 'about',
        title: 'Tentang Aplikasi',
        subtitle: 'Informasi aplikasi',
        icon: 'information',
        onPress: () => navigation.navigate('About'),
      },
    ];

    if (user?.role === 'seller') {
      return [
        {
          id: 'products',
          title: 'Kelola Produk',
          subtitle: 'Tambah & edit produk',
          icon: 'package-variant',
          onPress: () => navigation.navigate('ManageProducts'),
        },
        {
          id: 'orders',
          title: 'Pesanan Masuk',
          subtitle: 'Kelola pesanan pelanggan',
          icon: 'clipboard-list',
          onPress: () => navigation.navigate('SellerOrders'),
        },
        {
          id: 'sales',
          title: 'Laporan Penjualan',
          subtitle: 'Lihat statistik penjualan',
          icon: 'chart-line',
          onPress: () => navigation.navigate('SalesReport'),
        },
        {
          id: 'store',
          title: 'Pengaturan Toko',
          subtitle: 'Kelola profil toko',
          icon: 'store-cog',
          onPress: () => navigation.navigate('StoreSettings'),
        },
        {
          id: 'changePassword',
          title: 'Ganti Password',
          subtitle: 'Ubah password akun',
          icon: 'lock-reset',
          onPress: () => navigation.navigate('ChangePassword'),
        },
        ...commonItems,
      ];
    } else {
      return [
        {
          id: 'orders',
          title: 'Pesanan Saya',
          subtitle: 'Lihat riwayat pesanan',
          icon: 'package-variant',
          onPress: () => navigation.navigate('Orders'),
        },
        {
          id: 'addresses',
          title: 'Alamat Pengiriman',
          subtitle: 'Kelola alamat pengiriman',
          icon: 'map-marker',
          onPress: () => navigation.navigate('Addresses'),
        },
        {
          id: 'changePassword',
          title: 'Ganti Password',
          subtitle: 'Ubah password akun',
          icon: 'lock-reset',
          onPress: () => navigation.navigate('ChangePassword'),
        },
        ...commonItems,
      ];
    }
  };

  const menuItems = getMenuItems();

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuIcon}>
        <MaterialCommunityIcons name={item.icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Feather name="edit-2" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ 
                uri: user?.avatar || user?.profileImage || imageService.generatePlaceholderAvatar(user?.name || 'User', user?.role)
              }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleChangeProfilePicture}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={COLORS.card} />
              ) : (
                <MaterialCommunityIcons name="camera" size={16} color={COLORS.card} />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Nama Pengguna'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+62 xxx-xxxx-xxxx'}</Text>
            
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons 
                name={user?.role === 'seller' ? 'store' : 'shopping'} 
                size={16} 
                color={user?.role === 'seller' ? COLORS.success : COLORS.primary} 
              />
              <Text style={[styles.roleText, { color: user?.role === 'seller' ? COLORS.success : COLORS.primary }]}>
                {user?.role === 'seller' ? 'Penjual' : 'Pembeli'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {user?.role === 'seller' ? (
            <>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>25</Text>
                <Text style={styles.statLabel}>Produk</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>142</Text>
                <Text style={styles.statLabel}>Terjual</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Orders')}
              >
                <Text style={styles.statNumber}>{userStats.totalOrders}</Text>
                <Text style={styles.statLabel}>Pesanan</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Cart')}
              >
                <Text style={styles.statNumber}>{userStats.totalCartItems}</Text>
                <Text style={styles.statLabel}>Total Keranjang</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Orders')}
              >
                <Text style={styles.statNumber}>{userStats.completedOrders}</Text>
                <Text style={styles.statLabel}>Selesai</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Versi 1.0.0</Text>
      </ScrollView>
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
  editButton: {
    padding: SPACING.sm,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  userEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  userPhone: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.md,
  },
  menuContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '500',
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    ...TYPOGRAPHY.button,
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
});

export default ProfileScreen;