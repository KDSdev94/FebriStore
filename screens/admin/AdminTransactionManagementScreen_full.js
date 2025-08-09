import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../../utils/constants';
import { transactionService } from '../../services/transactionService';
import { AuthContext } from '../../contexts/AuthContext';

const AdminTransactionManagementScreen = ({ navigation }) => {
  // Safe context usage
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [transactionStats, setTransactionStats] = useState({
    totalPendapatan: 0,
    pendingVerifikasi: 0,
    transaksiSelesai: 0,
    pendingTransfer: 0,
  });
  const [transactions, setTransactions] = useState([]);

  const filters = ['Semua', 'Pending Verifikasi', 'Terverifikasi', 'Pending Transfer Seller', 'Selesai'];

  useEffect(() => {
    loadTransactionData();
  }, []);

  const loadTransactionData = async () => {
    try {
      setLoading(true);
      
      // Load transaction statistics with error handling
      try {
        const statsResult = await transactionService.getTransactionStats();
        if (statsResult?.success) {
          setTransactionStats(statsResult.stats || {
            totalPendapatan: 0,
            pendingVerifikasi: 0,
            transaksiSelesai: 0,
            pendingTransfer: 0,
          });
        }
      } catch (statsError) {
        console.error('Stats loading error:', statsError);
      }
      
      // Load all transactions with error handling
      try {
        const transactionsResult = await transactionService.getAllTransactions();
        if (transactionsResult?.success) {
          setTransactions(transactionsResult.transactions || []);
        }
      } catch (transactionsError) {
        console.error('Transactions loading error:', transactionsError);
      }
    } catch (error) {
      console.error('Error loading transaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactionData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      return `Rp ${amount || 0}`;
    }
  };

  const handleTransferComplete = async (transactionId) => {
    if (!user?.uid) {
      Alert.alert('Error', 'User tidak ditemukan');
      return;
    }

    try {
      Alert.alert(
        'Konfirmasi Transfer',
        'Apakah Anda yakin sudah mentransfer dana ke seller?',
        [
          {
            text: 'Batal',
            style: 'cancel',
          },
          {
            text: 'Ya, Sudah Transfer',
            onPress: async () => {
              try {
                const result = await transactionService.markSellerTransferCompleted(
                  transactionId,
                  user.uid
                );
                
                if (result?.success) {
                  Alert.alert('Berhasil', 'Transfer berhasil ditandai selesai');
                  loadTransactionData(); // Refresh data
                } else {
                  Alert.alert('Error', result?.error || 'Gagal menandai transfer selesai');
                }
              } catch (error) {
                console.error('Transfer complete error:', error);
                Alert.alert('Error', 'Gagal menandai transfer selesai');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error handling transfer complete:', error);
      Alert.alert('Error', 'Gagal menandai transfer selesai');
    }
  };

  const getFilteredTransactions = () => {
    if (!Array.isArray(transactions)) {
      return [];
    }
    if (selectedFilter === 'Semua') {
      return transactions;
    }
    return transactions.filter(transaction => 
      transaction && transaction.filterType === selectedFilter
    );
  };

  // Safe component renders
  const StatsCard = ({ title, value, color }) => {
    if (!title || value === undefined || value === null) {
      return null;
    }
    return (
      <View style={styles.statsCard}>
        <Text style={[styles.statsValue, { color }]}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    );
  };

  const FilterButton = ({ title, isSelected, onPress }) => {
    if (!title) {
      return null;
    }
    return (
      <TouchableOpacity 
        style={[styles.filterButton, isSelected && styles.filterButtonActive]} 
        onPress={onPress}
      >
        <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const TransactionItem = ({ item }) => {
    if (!item) {
      return null;
    }
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionHeader}>
          {item.orderId && (
            <Text style={styles.orderId}>{item.orderId}</Text>
          )}
          {item.amount && (
            <Text style={styles.amountText}>{item.amount}</Text>
          )}
        </View>
        
        <Text style={styles.buyerText}>Pembeli: {item.buyer || 'Unknown'}</Text>
        <Text style={styles.sellerText}>Penjual: {item.seller || 'Unknown'}</Text>
        
        <Text style={[styles.statusText, { color: item.statusColor || COLORS.textSecondary }]}>
          {item.status || 'Unknown'}
        </Text>
        
        <Text style={styles.paymentText}>Pembayaran: {item.payment || 'Unknown'}</Text>
        
        {item.transferNote && (
          <Text style={styles.transferNote}>{item.transferNote}</Text>
        )}
        
        <Text style={styles.dateText}>{item.date || 'N/A'}</Text>
        
        {item.needsTransfer && (
          <TouchableOpacity 
            style={styles.transferButton}
            onPress={() => handleTransferComplete(item.id)}
          >
            <Text style={styles.transferButtonText}>Tandai Sudah Transfer ke Seller</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Early return if context is not available
  if (!authContext) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <MaterialCommunityIcons name="cog" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Management Title */}
        <Text style={styles.managementTitle}>Manajemen Transaksi</Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              title="Total Pendapatan"
              value={formatCurrency(transactionStats.totalPendapatan)}
              color={COLORS.success}
            />
            <StatsCard
              title="Pending Verifikasi"
              value={transactionStats.pendingVerifikasi}
              color={COLORS.warning}
            />
          </View>
          <View style={styles.statsRow}>
            <StatsCard
              title="Transaksi Selesai"
              value={transactionStats.transaksiSelesai}
              color={COLORS.primary}
            />
            <StatsCard
              title="Pending Transfer"
              value={transactionStats.pendingTransfer}
              color={COLORS.error}
            />
          </View>
        </View>

        {/* Filter Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {filters && filters.length > 0 && filters.map((filter) => (
            <FilterButton
              key={filter}
              title={filter}
              isSelected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
            />
          ))}
        </ScrollView>

        {/* Transaction List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat data transaksi...</Text>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {getFilteredTransactions().length > 0 ? (
              getFilteredTransactions().map((transaction) => (
                transaction && transaction.id ? (
                  <TransactionItem key={transaction.id} item={transaction} />
                ) : null
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons 
                  name="receipt-text-outline" 
                  size={64} 
                  color={COLORS.textSecondary} 
                />
                <Text style={styles.emptyText}>
                  {selectedFilter === 'Semua' 
                    ? 'Belum ada transaksi' 
                    : `Tidak ada transaksi dengan filter "${selectedFilter}"`
                  }
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  managementTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsValue: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 4,
  },
  statsTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  filterScrollView: {
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingRight: 16,
  },
  filterButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  transactionList: {
    marginBottom: 24,
  },
  transactionItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    ...TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  buyerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sellerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  statusText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  transferNote: {
    ...TYPOGRAPHY.body2,
    color: COLORS.warning,
    marginBottom: 8,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  amountText: {
    ...TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  transferButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  transferButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default AdminTransactionManagementScreen;