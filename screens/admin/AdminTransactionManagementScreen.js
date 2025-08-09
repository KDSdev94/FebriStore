import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Image,
  TextInput,
  Clipboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { transactionService } from '../../services/transactionService';
import * as ImagePicker from 'expo-image-picker';

const AdminTransactionManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Semua');

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transferProofs, setTransferProofs] = useState({}); // Object to store proofs per seller
  const [transferNotes, setTransferNotes] = useState('');
  const [scrollToTransfer, setScrollToTransfer] = useState(false);
  const modalScrollViewRef = useRef(null);
  const transferSectionRef = useRef(null);

  const filters = ['Semua', 'Pending Verifikasi', 'Terverifikasi', 'Pending Transfer Seller', 'Selesai'];

  useEffect(() => {
    loadTransactionData();
  }, []);

  useEffect(() => {
    if (showDetailModal && scrollToTransfer && transferSectionRef.current) {
      // Delay scroll to ensure modal is fully rendered
      setTimeout(() => {
        transferSectionRef.current?.measureLayout(
          modalScrollViewRef.current,
          (x, y) => {
            modalScrollViewRef.current?.scrollTo({ y: y - 50, animated: true });
          },
          () => {}
        );
      }, 500);
    }
  }, [showDetailModal, scrollToTransfer]);

  const loadTransactionData = async () => {
    try {
      setLoading(true);
      
      // Load all transactions
      const transactionsResult = await transactionService.getAllTransactions();
      if (transactionsResult?.success) {
        setTransactions(transactionsResult.transactions || []);
      } else {
        console.error('Error loading transactions:', transactionsResult?.error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transaction data:', error);
      Alert.alert('Error', 'Gagal memuat data transaksi');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactionData();
    setRefreshing(false);
  };

  const openTransactionDetail = (transaction, scrollToTransferSection = false) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
    setTransferProofs({});
    setTransferNotes('');
    setScrollToTransfer(scrollToTransferSection);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTransaction(null);
    setTransferProofs({});
    setTransferNotes('');
    setScrollToTransfer(false);
  };

  const handleImagePicker = async (source, sellerId) => {
    try {
      let permissionResult;
      
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Izin Diperlukan', 
          `Izin akses ${source === 'camera' ? 'kamera' : 'galeri'} diperlukan untuk upload bukti transfer`
        );
        return;
      }

      const imagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: false,
        quality: 0.8,
        // Allow free cropping - no fixed aspect ratio
        exif: false,
        base64: false,
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(imagePickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setTransferProofs(prev => ({
          ...prev,
          [sellerId]: selectedImage
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  const showImagePickerOptionsForSeller = (sellerId, sellerName) => {
    Alert.alert(
      `Pilih Bukti Transfer untuk ${sellerName}`,
      'Pilih dari mana Anda ingin mengambil foto bukti transfer',
      [
        {
          text: 'Kamera',
          onPress: () => handleImagePicker('camera', sellerId),
        },
        {
          text: 'Galeri',
          onPress: () => handleImagePicker('gallery', sellerId),
        },
        {
          text: 'Batal',
          style: 'cancel',
        },
      ]
    );
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} berhasil disalin ke clipboard`);
  };

  // Calculate transfer amount per seller
  const calculateSellerAmount = (sellerInfo, totalAmount, adminFee) => {
    // For COD orders, admin fee is 0
    const actualAdminFee = selectedTransaction?.paymentMethod === 'cod' ? 0 : adminFee;
    
    if (!selectedTransaction?.sellerInfo || selectedTransaction.sellerInfo.length <= 1) {
      // Single seller - return total minus admin fee
      return totalAmount - actualAdminFee;
    }
    
    // Multi-seller - calculate proportionally
    // For now, we'll divide equally among sellers
    // In real implementation, this should be based on actual item amounts per seller
    const sellerCount = selectedTransaction.sellerInfo.length;
    const amountPerSeller = Math.floor((totalAmount - actualAdminFee) / sellerCount);
    return amountPerSeller;
  };

  // Get seller-specific admin fee
  const getSellerAdminFee = (sellerInfo, totalAdminFee) => {
    // For COD orders, admin fee is 0
    if (selectedTransaction?.paymentMethod === 'cod') {
      return 0;
    }
    
    if (!selectedTransaction?.sellerInfo || selectedTransaction.sellerInfo.length <= 1) {
      return totalAdminFee;
    }
    
    const sellerCount = selectedTransaction.sellerInfo.length;
    return Math.floor(totalAdminFee / sellerCount);
  };

  const handleTransferWithProof = async () => {
    if (!selectedTransaction) return;

    // Check if all sellers have transfer proofs
    const requiredSellers = selectedTransaction.sellerInfo || [];
    const missingProofs = requiredSellers.filter(seller => 
      !transferProofs[seller.storeName] // Using storeName as key
    );

    if (missingProofs.length > 0) {
      Alert.alert(
        'Error', 
        `Silakan upload bukti transfer untuk: ${missingProofs.map(s => s.storeName).join(', ')}`
      );
      return;
    }

    try {
      // Convert transfer proofs to URIs (same as payment proof system)
      const proofURIs = {};
      
      console.log('Processing transfer proofs:', transferProofs);
      
      for (const [sellerKey, proofData] of Object.entries(transferProofs)) {
        if (proofData && proofData.uri) {
          proofURIs[sellerKey] = proofData.uri;
          console.log(`Transfer proof URI for ${sellerKey}:`, proofData.uri);
        }
      }
      
      console.log('Final proof URIs to save:', proofURIs);

      const transferData = {
        adminId: user.id,
        sellerAmount: selectedTransaction.sellerAmount,
        adminFee: selectedTransaction.adminFee,
        transferMethod: 'bank_transfer',
        notes: transferNotes || `Transfer untuk pesanan #${selectedTransaction.orderNumber}`,
        sellerInfo: selectedTransaction.sellerInfo || [],
        isMultiSeller: selectedTransaction.isMultiSeller || false,
        transferProofs: proofURIs, // Use URIs directly like payment proof system
        transferProofName: 'multi_seller_transfer_proofs'
      };

      console.log('Transfer data with proof URIs:', transferData);

      const result = await transactionService.transferToSeller(selectedTransaction.id, transferData);
      
      if (result.success) {
        Alert.alert('Berhasil', 'Transfer ke penjual berhasil dicatat');
        closeDetailModal();
        loadTransactionData();
      } else {
        Alert.alert('Error', result.error || 'Gagal melakukan transfer');
      }
    } catch (error) {
      console.error('Error transferring to seller:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat transfer');
    }
  };



  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
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



  const FilterButton = ({ title, isSelected, onPress }) => (
    <TouchableOpacity 
      style={[styles.filterButton, isSelected && styles.filterButtonActive]} 
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const TransactionItem = ({ item }) => {
    if (!item) {
      return null;
    }

    const handleTransferComplete = async (transactionId) => {
      try {
        Alert.alert(
          'Konfirmasi Transfer',
          'Apakah Anda yakin sudah mentransfer dana ke seller?',
          [
            { text: 'Batal', style: 'cancel' },
            { 
              text: 'Ya, Sudah Transfer', 
              onPress: async () => {
                const result = await transactionService.markTransferComplete(transactionId, user?.uid);
                if (result.success) {
                  Alert.alert('Berhasil', 'Status transfer berhasil diperbarui');
                  loadTransactionData();
                } else {
                  Alert.alert('Error', result.error || 'Gagal memperbarui status transfer');
                }
              }
            }
          ]
        );
      } catch (error) {
        console.error('Error handling transfer:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat memproses transfer');
      }
    };

    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => openTransactionDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionHeader}>
          {item.orderId && (
            <Text style={styles.orderId}>{item.orderId}</Text>
          )}
          {item.amount && (
            <Text style={styles.amountText}>{item.amount}</Text>
          )}
        </View>

        <Text style={styles.buyerText}>Pembeli: {item.buyer || 'Unknown'}</Text>
        <View style={styles.sellerContainer}>
          <Text style={styles.sellerLabel}>Penjual:</Text>
          <Text style={styles.sellerText}>{item.seller || 'Unknown'}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: item.statusColor || '#666' }]}>
          <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
        </View>
        
        <Text style={styles.paymentText}>Pembayaran: {item.payment || 'Unknown'}</Text>
        
        {/* Show admin fee and seller amount for transfer-ready orders */}
        {item.needsTransfer && (
          <View style={styles.transferDetails}>
            <Text style={styles.transferDetailText}>
              Admin Fee: {formatCurrency(item.adminFee || 1500)}
            </Text>
            <Text style={styles.transferDetailText}>
              Transfer ke Seller: {formatCurrency(item.sellerAmount || 0)}
            </Text>
          </View>
        )}
        
        {item.transferNote && (
          <Text style={styles.transferNote}>{item.transferNote}</Text>
        )}
        
        <Text style={styles.dateText}>{item.date || 'N/A'}</Text>
        
        {/* Transfer button for orders that need transfer */}
        {item.needsTransfer && (
          <TouchableOpacity 
            style={styles.transferButton}
            onPress={() => openTransactionDetail(item, true)}
          >
            <MaterialCommunityIcons 
              name="bank-transfer" 
              size={16} 
              color={COLORS.white} 
            />
            <Text style={styles.transferButtonText}>
              Transfer ke Penjual
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('AdminSettings')}
        >
          <MaterialCommunityIcons name="cog" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >


        {/* Filter Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((filter) => (
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
                <Text style={styles.emptySubText}>
                  Transaksi akan muncul ketika ada pesanan yang perlu diverifikasi admin
                </Text>
                <TouchableOpacity 
                  style={styles.loadDataButton}
                  onPress={loadTransactionData}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color={COLORS.white} />
                  <Text style={styles.loadDataButtonText}>Muat Data Transaksi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Transaksi</Text>
            <TouchableOpacity onPress={closeDetailModal}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={modalScrollViewRef}
            style={styles.modalContent}
          >
            {selectedTransaction && (
              <>
                {/* Transaction Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ID Pesanan:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.orderId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Amount:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.amount}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: selectedTransaction.statusColor }]}>
                      <Text style={styles.statusText}>{selectedTransaction.status}</Text>
                    </View>
                  </View>
                </View>

                {/* Buyer & Seller Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Pembeli & Penjual</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pembeli:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.buyer}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Penjual:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.seller}</Text>
                  </View>
                </View>

                {/* Seller Store & Bank Info */}
                {selectedTransaction.sellerInfo && selectedTransaction.sellerInfo.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Informasi Toko & Rekening</Text>
                    {selectedTransaction.sellerInfo.map((seller, index) => (
                      <View key={index} style={styles.sellerInfoCard}>
                        <Text style={styles.sellerInfoTitle}>{seller.name}</Text>
                        
                        {/* Store Info */}
                        <View style={styles.infoGroup}>
                          <Text style={styles.infoGroupTitle}>Informasi Toko</Text>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Nama Toko:</Text>
                            <Text style={styles.detailValue}>{seller.storeName}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>No. Telepon:</Text>
                            <Text style={styles.detailValue}>{seller.phone}</Text>
                          </View>
                        </View>

                        {/* Bank Info */}
                        <View style={styles.infoGroup}>
                          <Text style={styles.infoGroupTitle}>Informasi Rekening</Text>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Bank:</Text>
                            <Text style={styles.detailValue}>{seller.bankName}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>No. Rekening:</Text>
                            <View style={styles.accountNumberContainer}>
                              <Text style={[styles.detailValue, styles.accountNumber]}>{seller.accountNumber}</Text>
                              <TouchableOpacity 
                                style={styles.copyButton}
                                onPress={() => copyToClipboard(seller.accountNumber, 'Nomor rekening')}
                              >
                                <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Nama Rekening:</Text>
                            <Text style={styles.detailValue}>{seller.accountName}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}



                {/* Transfer Details */}
                {(selectedTransaction.needsTransfer || selectedTransaction.sellerTransferData || selectedTransaction.sellerInfo) && (
                  <View 
                    ref={transferSectionRef}
                    style={[
                      styles.detailSection,
                      scrollToTransfer && styles.highlightedSection
                    ]}
                  >
                    <Text style={styles.sectionTitle}>Detail Transfer</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Admin Fee:</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(selectedTransaction.adminFee || 1500)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Transfer ke Seller:</Text>
                      <Text style={[styles.detailValue, styles.transferAmount]}>
                        {formatCurrency(selectedTransaction.sellerAmount || 0)}
                      </Text>
                    </View>

                    {/* Transfer Proof Upload per Seller */}
                    <View style={styles.transferProofSection}>
                      <Text style={styles.sectionTitle}>
                        {selectedTransaction.needsTransfer ? 'Bukti Transfer per Seller' : 'Bukti Transfer yang Telah Dikirim'}
                      </Text>
                      
                      {/* Get seller info from current data or transfer data */}
                      {(selectedTransaction.sellerInfo || selectedTransaction.sellerTransferData?.sellerInfo || []).map((seller, index) => {
                        const sellerId = seller.storeName; // Using storeName as unique key
                        const sellerProof = transferProofs[sellerId];
                        
                        // Check if there's existing transfer proof from database
                        const existingProof = selectedTransaction.sellerTransferData?.transferProofs?.[sellerId] || 
                                            selectedTransaction.sellerTransferData?.transferProof || // fallback for single seller
                                            selectedTransaction.transferProof; // another fallback
                        
                        const sellerAmount = calculateSellerAmount(seller, selectedTransaction.totalAmount, selectedTransaction.adminFee);
                        const sellerAdminFee = getSellerAdminFee(seller, selectedTransaction.adminFee);
                        
                        return (
                          <View key={index} style={styles.sellerTransferCard}>
                            <View style={styles.sellerTransferHeader}>
                              <Text style={styles.sellerTransferTitle}>{seller.storeName}</Text>
                              <View style={styles.sellerAmountInfo}>
                                <Text style={styles.sellerAmountLabel}>Transfer:</Text>
                                <Text style={styles.sellerAmountValue}>
                                  {formatCurrency(sellerAmount)}
                                </Text>
                              </View>
                            </View>
                            
                            <View style={styles.sellerBankInfo}>
                              <Text style={styles.bankInfoText}>
                                {seller.bankName} - {seller.accountNumber}
                              </Text>
                              <Text style={styles.accountNameText}>
                                a.n. {seller.accountName}
                              </Text>
                            </View>
                            
                            {/* Show existing proof or new proof or upload button */}
                            {(sellerProof || existingProof) ? (
                              <View style={styles.proofPreview}>
                                <Image 
                                  source={{ uri: sellerProof?.uri || existingProof }} 
                                  style={styles.proofImage} 
                                />
                                
                                {/* Show different actions based on transfer status */}
                                {selectedTransaction.needsTransfer ? (
                                  // Still can edit/delete if transfer not completed
                                  <View style={styles.proofActions}>
                                    <TouchableOpacity 
                                      style={styles.editProofButton}
                                      onPress={() => showImagePickerOptionsForSeller(sellerId, seller.storeName)}
                                    >
                                      <MaterialCommunityIcons name="pencil" size={16} color={COLORS.white} />
                                      <Text style={styles.editProofText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                      style={styles.changeProofButton}
                                      onPress={() => setTransferProofs(prev => {
                                        const newProofs = { ...prev };
                                        delete newProofs[sellerId];
                                        return newProofs;
                                      })}
                                    >
                                      <MaterialCommunityIcons name="delete" size={16} color={COLORS.white} />
                                      <Text style={styles.changeProofText}>Hapus</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  // Read-only view for completed transfers
                                  <View style={styles.proofViewOnly}>
                                    <View style={styles.transferCompletedBadge}>
                                      <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                                      <Text style={styles.transferCompletedText}>Transfer Selesai</Text>
                                    </View>
                                    {selectedTransaction.sellerTransferData?.transferredAt ? (
                                      <Text style={styles.transferDateText}>
                                        {new Date(selectedTransaction.sellerTransferData.transferredAt.seconds * 1000).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </Text>
                                    ) : (
                                      <Text style={styles.transferDateText}>
                                        Status: Sedang diproses
                                      </Text>
                                    )}
                                  </View>
                                )}
                              </View>
                            ) : selectedTransaction.needsTransfer ? (
                              // Show upload button only if transfer is still needed
                              <TouchableOpacity 
                                style={styles.uploadProofButton}
                                onPress={() => showImagePickerOptionsForSeller(sellerId, seller.storeName)}
                              >
                                <MaterialCommunityIcons name="camera-plus" size={24} color={COLORS.primary} />
                                <Text style={styles.uploadProofText}>
                                  Upload Bukti untuk {seller.storeName}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              // No proof available and transfer completed
                              <View style={styles.noProofContainer}>
                                <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.warning} />
                                <Text style={styles.noProofText}>Bukti transfer tidak tersedia</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}

                      {/* Transfer Notes and Button - Only show if transfer is still needed */}
                      {selectedTransaction.needsTransfer && (
                        <>
                          {/* Transfer Notes */}
                          <TextInput
                            style={styles.notesInput}
                            placeholder="Catatan transfer (opsional)"
                            value={transferNotes}
                            onChangeText={setTransferNotes}
                            multiline
                            numberOfLines={3}
                          />

                          {/* Transfer Button */}
                          <TouchableOpacity 
                            style={[
                              styles.confirmTransferButton,
                              (() => {
                                const requiredSellers = selectedTransaction.sellerInfo || [];
                                const allProofsUploaded = requiredSellers.every(seller => 
                                  transferProofs[seller.storeName]
                                );
                                return !allProofsUploaded && styles.confirmTransferButtonDisabled;
                              })()
                            ]}
                            onPress={handleTransferWithProof}
                            disabled={(() => {
                              const requiredSellers = selectedTransaction.sellerInfo || [];
                              return !requiredSellers.every(seller => transferProofs[seller.storeName]);
                            })()}
                          >
                            <MaterialCommunityIcons 
                              name="bank-transfer" 
                              size={20} 
                              color={COLORS.white} 
                            />
                            <Text style={styles.confirmTransferText}>
                              Konfirmasi Transfer ke Semua Penjual
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Transfer Completed Info */}
                      {!selectedTransaction.needsTransfer && (selectedTransaction.sellerTransferData || selectedTransaction.status === 'sedang diproses') && (
                        <View style={styles.transferCompletedInfo}>
                          <View style={styles.transferCompletedHeader}>
                            <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                            <Text style={styles.transferCompletedTitle}>Transfer Telah Selesai</Text>
                          </View>
                          
                          {selectedTransaction.sellerTransferData?.notes && (
                            <View style={styles.transferNotesDisplay}>
                              <Text style={styles.transferNotesLabel}>Catatan Transfer:</Text>
                              <Text style={styles.transferNotesText}>
                                {selectedTransaction.sellerTransferData.notes}
                              </Text>
                            </View>
                          )}
                          
                          {selectedTransaction.sellerTransferData?.transferredAt ? (
                            <Text style={styles.transferCompletedDate}>
                              Ditransfer pada: {new Date(selectedTransaction.sellerTransferData.transferredAt.seconds * 1000).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          ) : (
                            <Text style={styles.transferCompletedDate}>
                              Status: Transfer sedang diproses
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
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
    fontSize: 24,
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
    fontSize: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 12,
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
    fontSize: 14,
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
  transactionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
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
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  loadDataButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  loadDataButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  // TransactionItem styles
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  amountText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  buyerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginBottom: 4,
  },
  sellerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  paymentText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  transferNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  transferButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  transferDetails: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  transferDetailText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginBottom: 4,
    fontWeight: '500',
  },
  sellerContainer: {
    marginBottom: 8,
  },
  sellerLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  sellerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  highlightedSection: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSecondary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  transferAmount: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  transferProofSection: {
    marginTop: 16,
  },
  uploadProofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadProofText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  proofPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  proofImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  proofActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  editProofButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  editProofText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '500',
    marginLeft: 4,
  },
  changeProofButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  changeProofText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '500',
    marginLeft: 4,
  },
  notesInput: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlignVertical: 'top',
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
  },
  confirmTransferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
  },
  confirmTransferButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  confirmTransferText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Seller Info Styles
  sellerInfoCard: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sellerInfoTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    padding: 8,
    borderRadius: 6,
  },
  infoGroup: {
    marginBottom: 12,
  },
  infoGroupTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
  },
  accountNumber: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 4,
  },
  
  // Multi-Seller Transfer Styles
  sellerTransferCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sellerTransferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerTransferTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
    flex: 1,
  },
  sellerAmountInfo: {
    alignItems: 'flex-end',
  },
  sellerAmountLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sellerAmountValue: {
    ...TYPOGRAPHY.body1,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  sellerBankInfo: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  bankInfoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
  },
  accountNameText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  
  // Transfer Status Styles
  proofViewOnly: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  transferCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  transferCompletedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  transferDateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  noProofContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderStyle: 'dashed',
  },
  noProofText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.warning,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Transfer Completed Info Styles
  transferCompletedInfo: {
    backgroundColor: COLORS.success + '10', // Light green background
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  transferCompletedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  transferCompletedTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.success,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  transferNotesDisplay: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  transferNotesLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  transferNotesText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  transferCompletedDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Full Width Stats Card
  fullWidthStatsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Revenue Info Label Styles
  revenueInfoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.info + '08',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.info + '20',
  },
  revenueInfoLabelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    fontSize: 12,
  },
});

export default AdminTransactionManagementScreen;