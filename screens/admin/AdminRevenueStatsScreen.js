import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/constants';
import { adminService } from '../../services/adminService';

const { width } = Dimensions.get('window');

const AdminRevenueStatsScreen = ({ navigation }) => {
  const [revenueStats, setRevenueStats] = useState({
    totalAdminRevenue: 0,
    monthlyAdminRevenue: 0,
    weeklyAdminRevenue: 0,
    dailyAdminRevenue: 0,
    totalTransactionValue: 0,
    completedTransactions: 0,
    averageAdminFeePerTransaction: 0,
    revenueByMonth: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRevenueStats();
  }, []);

  const loadRevenueStats = async () => {
    try {
      setLoading(true);
      const result = await adminService.getAdminRevenueStats();
      
      if (result.success) {
        setRevenueStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading revenue stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRevenueStats();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const RevenueCard = ({ title, value, color, icon, subtitle }) => (
    <View style={styles.revenueCard}>
      <View style={styles.revenueCardHeader}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text style={styles.revenueCardTitle}>{title}</Text>
      </View>
      <Text style={[styles.revenueCardValue, { color }]}>
        {formatCurrency(value)}
      </Text>
      {subtitle && (
        <Text style={styles.revenueCardSubtitle}>{subtitle}</Text>
      )}
    </View>
  );

  const StatCard = ({ title, value, color, icon, isRevenue = false }) => (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <Text style={[styles.statCardValue, { color }]}>
        {isRevenue ? formatCurrency(value) : value.toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistik Pendapatan</Text>
          <View style={styles.headerAction} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat statistik pendapatan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistik Pendapatan</Text>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={onRefresh}
        >
          <MaterialCommunityIcons name="refresh" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Main Revenue Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pendapatan Admin</Text>
          
          <RevenueCard
            title="Total Pendapatan Admin"
            value={revenueStats.totalAdminRevenue}
            color={COLORS.success}
            icon="cash-multiple"
            subtitle="Dari biaya admin 1.5% per transaksi"
          />
          
          <View style={styles.periodRevenueGrid}>
            <RevenueCard
              title="Bulan Ini"
              value={revenueStats.monthlyAdminRevenue}
              color={COLORS.primary}
              icon="calendar-month"
            />
            <RevenueCard
              title="Minggu Ini"
              value={revenueStats.weeklyAdminRevenue}
              color={COLORS.info}
              icon="calendar-week"
            />
          </View>
          
          <RevenueCard
            title="Hari Ini"
            value={revenueStats.dailyAdminRevenue}
            color={COLORS.warning}
            icon="calendar-today"
          />
        </View>

        {/* Transaction Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistik Transaksi</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Nilai Transaksi"
              value={revenueStats.totalTransactionValue}
              color={COLORS.info}
              icon="chart-line"
              isRevenue={true}
            />
            <StatCard
              title="Transaksi Selesai"
              value={revenueStats.completedTransactions}
              color={COLORS.success}
              icon="check-circle"
            />
          </View>
          
          <StatCard
            title="Rata-rata Biaya Admin per Transaksi"
            value={revenueStats.averageAdminFeePerTransaction}
            color={COLORS.primary}
            icon="calculator"
            isRevenue={true}
          />
        </View>

        {/* Monthly Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pendapatan 12 Bulan Terakhir</Text>
          
          <View style={styles.chartContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chartContent}>
                {revenueStats.revenueByMonth.map((monthData, index) => {
                  const maxRevenue = Math.max(...revenueStats.revenueByMonth.map(m => m.revenue));
                  const barHeight = maxRevenue > 0 ? (monthData.revenue / maxRevenue) * 120 : 0;
                  
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar, 
                            { 
                              height: barHeight,
                              backgroundColor: monthData.revenue > 0 ? COLORS.primary : COLORS.divider
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.barLabel}>{monthData.month}</Text>
                      <Text style={styles.barValue}>
                        {formatCurrency(monthData.revenue)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Revenue Info */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information" size={24} color={COLORS.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Informasi Pendapatan</Text>
              <Text style={styles.infoText}>
                • Pendapatan admin berasal dari biaya admin sebesar 1.5% dari setiap transaksi yang selesai{'\n'}
                • Biaya admin dipotong dari total pembayaran customer{'\n'}
                • Seller menerima pembayaran setelah dikurangi biaya admin{'\n'}
                • Statistik hanya menghitung transaksi yang sudah selesai/delivered
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.white,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  section: {
    margin: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  revenueCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  revenueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  revenueCardTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  revenueCardValue: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  revenueCardSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  periodRevenueGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flex: 1,
    ...SHADOWS.small,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statCardTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  statCardValue: {
    ...TYPOGRAPHY.h4,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: SPACING.md,
  },
  chartBar: {
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    minWidth: 60,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  bar: {
    width: 24,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 2,
  },
  barLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  barValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.info + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.info + '30',
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.info,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});

export default AdminRevenueStatsScreen;