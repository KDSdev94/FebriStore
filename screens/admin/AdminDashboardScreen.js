import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/adminService';

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingVerification: 0,
    sentOrders: 0,
    completedOrders: 0,
    totalStores: 0,
    activeStores: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactionValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get dashboard stats from adminService
      const dashboardResult = await adminService.getDashboardStats();
      
      // Get stores data
      const storesResult = await adminService.getAllStores();
      
      if (dashboardResult.success) {
        const dashboardStats = dashboardResult.stats;
        
        // Calculate active stores
        let activeStoresCount = 0;
        if (storesResult.success) {
          activeStoresCount = storesResult.stores.filter(store => store.isActive).length;
        }
        
        // Map the data to match our UI structure
        setStats({
          totalOrders: dashboardStats.totalOrders,
          pendingVerification: dashboardStats.pendingVerifications,
          sentOrders: dashboardStats.shippedOrders,
          completedOrders: dashboardStats.completedOrders,
          totalStores: dashboardStats.totalSellers,
          activeStores: activeStoresCount,
          totalRevenue: dashboardStats.totalRevenue, // Admin revenue from fees
          monthlyRevenue: dashboardStats.monthlyRevenue, // Monthly admin revenue
          totalTransactionValue: dashboardStats.totalTransactionValue, // Total transaction value
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const StatCard = ({ title, value, color, isRevenue = false, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.statValue, { color }]}>
        {isRevenue ? formatCurrency(value) : value}
      </Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Memuat dashboard...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('AdminSettings')}
        >
          <MaterialCommunityIcons name="cog" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState />
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >


          {/* Statistik Pesanan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistik Pesanan</Text>
            
            <View style={styles.statsRow}>
              <StatCard
                title="Total Pesanan"
                value={stats.totalOrders}
                color={COLORS.primary}
                onPress={() => navigation.navigate('Orders')}
              />
              <StatCard
                title="Menunggu Verifikasi"
                value={stats.pendingVerification}
                color={COLORS.warning}
                onPress={() => navigation.navigate('Orders', { filter: 'pending_verification' })}
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                title="Dikirim"
                value={stats.sentOrders}
                color={COLORS.info}
                onPress={() => navigation.navigate('Orders', { filter: 'sent' })}
              />
              <StatCard
                title="Selesai"
                value={stats.completedOrders}
                color={COLORS.success}
                onPress={() => navigation.navigate('Orders', { filter: 'completed' })}
              />
            </View>
          </View>

          {/* Statistik Toko */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistik Toko</Text>
            
            <View style={styles.statsRow}>
              <StatCard
                title="Total Toko"
                value={stats.totalStores}
                color={COLORS.primary}
                onPress={() => navigation.navigate('StoreManagement')}
              />
              <StatCard
                title="Toko Aktif"
                value={stats.activeStores}
                color={COLORS.success}
                onPress={() => navigation.navigate('StoreManagement')}
              />
            </View>
          </View>

          {/* Statistik Pendapatan Admin */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistik Pendapatan Admin</Text>
            
            <View style={styles.statsRow}>
              <StatCard
                title="Total Pendapatan Admin"
                value={stats.totalRevenue}
                color={COLORS.success}
                isRevenue={true}
                onPress={() => navigation.navigate('AdminRevenueStats')}
              />
              <StatCard
                title="Pendapatan Bulan Ini"
                value={stats.monthlyRevenue}
                color={COLORS.primary}
                isRevenue={true}
                onPress={() => navigation.navigate('AdminRevenueStats')}
              />
            </View>
            
            {/* Full Width Total Transaction Value */}
            <TouchableOpacity 
              style={styles.fullWidthStatCard}
              onPress={() => navigation.navigate('AdminRevenueStats')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statValue, { color: COLORS.info }]}>
                {formatCurrency(stats.totalTransactionValue)}
              </Text>
              <Text style={styles.statTitle}>Total Nilai Transaksi</Text>
            </TouchableOpacity>
            
            {/* Revenue Info Label */}
            <TouchableOpacity 
              style={styles.revenueInfoLabel}
              onPress={() => navigation.navigate('AdminRevenueStats')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.revenueInfoLabelText}>
                Pendapatan admin berasal dari biaya admin 1.5% per transaksi yang selesai
              </Text>
            </TouchableOpacity>
          </View>

          {/* Menu Aksi Cepat */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Menu Aksi Cepat</Text>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Orders')}
              >
                <MaterialCommunityIcons name="clipboard-list" size={32} color={COLORS.primary} />
                <Text style={styles.quickActionText}>Kelola Pesanan</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('StoreManagement')}
              >
                <MaterialCommunityIcons name="store" size={32} color={COLORS.secondary} />
                <Text style={styles.quickActionText}>Kelola Toko</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('TransactionManagement')}
              >
                <MaterialCommunityIcons name="credit-card" size={32} color={COLORS.success} />
                <Text style={styles.quickActionText}>Transaksi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('AdminSettings')}
              >
                <MaterialCommunityIcons name="cog" size={32} color={COLORS.warning} />
                <Text style={styles.quickActionText}>Pengaturan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    flex: 0.48,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
  fullWidthStatCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8,
  },
  revenueInfoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.info + '08',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.info + '20',
  },
  revenueInfoLabelText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;