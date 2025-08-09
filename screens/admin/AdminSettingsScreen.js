import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { settingsService } from '../../services/settingsService';

const AdminSettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [bankAccount, setBankAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load bank account
      const bankResult = await settingsService.getAdminBankAccount();
      if (bankResult.success && bankResult.bankAccount) {
        setBankAccount(bankResult.bankAccount);
      }

      // Load categories
      const categoriesResult = await settingsService.getCategories();
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!bankAccount.bankName.trim() || !bankAccount.accountNumber.trim() || !bankAccount.accountHolderName.trim()) {
      Alert.alert('Error', 'Semua field rekening bank harus diisi');
      return;
    }

    try {
      const result = await settingsService.updateAdminBankAccount(bankAccount);
      if (result.success) {
        Alert.alert('Berhasil', 'Rekening bank berhasil disimpan');
        setShowBankModal(false);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan rekening bank');
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      Alert.alert('Error', 'Nama kategori tidak boleh kosong');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      Alert.alert('Error', 'Kategori sudah ada');
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    setNewCategory('');
  };

  const handleRemoveCategory = (categoryToRemove) => {
    Alert.alert(
      'Hapus Kategori',
      `Apakah Anda yakin ingin menghapus kategori "${categoryToRemove}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
            setCategories(updatedCategories);
          }
        }
      ]
    );
  };

  const handleSaveCategories = async () => {
    try {
      const result = await settingsService.updateCategories(categories);
      if (result.success) {
        Alert.alert('Berhasil', 'Kategori berhasil disimpan');
        setShowCategoriesModal(false);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error saving categories:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan kategori');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navigation will be handled automatically by RoleBasedNavigator
          }
        }
      ]
    );
  };

  const SettingItem = ({ title, description, icon, onPress, rightComponent }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingIcon}>
        <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {rightComponent || (
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <View style={styles.categoryItem}>
      <Text style={styles.categoryItemText}>{item}</Text>
      <TouchableOpacity
        style={styles.removeCategoryButton}
        onPress={() => handleRemoveCategory(item)}
      >
        <MaterialCommunityIcons name="close" size={16} color={COLORS.error} />
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Pengaturan Admin</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat pengaturan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Admin</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil Admin</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons name="account-circle" size={48} color={COLORS.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileRole}>Administrator</Text>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan Aplikasi</Text>
          
          <SettingItem
            title="Rekening Bank Admin"
            description={bankAccount.bankName ? `${bankAccount.bankName} - ${bankAccount.accountNumber}` : 'Belum diatur'}
            icon="bank"
            onPress={() => setShowBankModal(true)}
          />
          
          <SettingItem
            title="Kelola Kategori"
            description={`${categories.length} kategori tersedia`}
            icon="tag-multiple"
            onPress={() => setShowCategoriesModal(true)}
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akun</Text>
          
          <SettingItem
            title="Ganti Password"
            description="Ubah password admin"
            icon="lock-reset"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          
          <SettingItem
            title="Logout"
            description="Keluar dari akun admin"
            icon="logout"
            onPress={handleLogout}
            rightComponent={
              <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
            }
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bank Account Modal */}
      <Modal
        visible={showBankModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rekening Bank Admin</Text>
              <TouchableOpacity
                onPress={() => setShowBankModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nama Bank *</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankAccount.bankName}
                  onChangeText={(text) => setBankAccount({...bankAccount, bankName: text})}
                  placeholder="Contoh: Bank BCA"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nomor Rekening *</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankAccount.accountNumber}
                  onChangeText={(text) => setBankAccount({...bankAccount, accountNumber: text})}
                  placeholder="Contoh: 1234567890"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nama Pemilik Rekening *</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankAccount.accountHolderName}
                  onChangeText={(text) => setBankAccount({...bankAccount, accountHolderName: text})}
                  placeholder="Contoh: PT. Febri Store"
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveBankAccount}>
                <Text style={styles.saveButtonText}>Simpan Rekening</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Categories Modal */}
      <Modal
        visible={showCategoriesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoriesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kelola Kategori</Text>
              <TouchableOpacity
                onPress={() => setShowCategoriesModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Add Category */}
              <View style={styles.addCategoryContainer}>
                <TextInput
                  style={styles.addCategoryInput}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Nama kategori baru"
                />
                <TouchableOpacity style={styles.addCategoryButton} onPress={handleAddCategory}>
                  <MaterialCommunityIcons name="plus" size={20} color={COLORS.card} />
                </TouchableOpacity>
              </View>

              {/* Categories List */}
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.categoriesList}
                showsVerticalScrollIndicator={false}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategories}>
                <Text style={styles.saveButtonText}>Simpan Kategori</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  profileIcon: {
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  profileEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  profileRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  settingItem: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  settingDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  textInput: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    fontWeight: '600',
  },
  addCategoryContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  addCategoryInput: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  addCategoryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    maxHeight: 200,
    marginBottom: SPACING.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryItemText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    flex: 1,
  },
  removeCategoryButton: {
    padding: SPACING.xs,
  },
});

export default AdminSettingsScreen;