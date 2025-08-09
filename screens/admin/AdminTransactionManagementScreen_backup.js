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

const AdminTransactionManagementScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState({
    totalPendapatan: 0,
    pendingVerifikasi: 0,
    transaksiSelesai: 0,
    pendingTransfer: 0,
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <MaterialCommunityIcons name="cog" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Management Title */}
        <Text style={styles.managementTitle}>Manajemen Transaksi</Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={[styles.statsValue, { color: COLORS.success }]}>
                Rp 0
              </Text>
              <Text style={styles.statsTitle}>Total Pendapatan</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={[styles.statsValue, { color: COLORS.warning }]}>
                0
              </Text>
              <Text style={styles.statsTitle}>Pending Verifikasi</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={[styles.statsValue, { color: COLORS.primary }]}>
                0
              </Text>
              <Text style={styles.statsTitle}>Transaksi Selesai</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={[styles.statsValue, { color: COLORS.error }]}>
                0
              </Text>
              <Text style={styles.statsTitle}>Pending Transfer</Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="receipt-text-outline" 
            size={64} 
            color={COLORS.textSecondary} 
          />
          <Text style={styles.emptyText}>
            Database transaksi berhasil dibuat!
          </Text>
          <Text style={styles.emptySubText}>
            Data transaksi akan muncul ketika ada pesanan yang perlu diverifikasi.
          </Text>
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});

export default AdminTransactionManagementScreen;