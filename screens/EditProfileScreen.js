import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { imageService } from '../services/imageService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
  });

  // Update profileData when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user?.name || user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || '',
      });
    }
  }, [user]);

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

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!profileData.name.trim()) {
        Alert.alert('Error', 'Nama tidak boleh kosong');
        return;
      }
      
      if (!profileData.email.trim()) {
        Alert.alert('Error', 'Email tidak boleh kosong');
        return;
      }

      // Ensure both name and fullName are saved for consistency
      const dataToSave = {
        ...profileData,
        fullName: profileData.name, // Save as both name and fullName
      };
      
      const result = await updateUser(dataToSave);
      if (result.success) {
        Alert.alert('Berhasil', 'Profil berhasil diperbarui', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label, value, field, placeholder, multiline = false, keyboardType = 'default') => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={(text) => setProfileData({ ...profileData, [field]: text })}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        placeholderTextColor={COLORS.textLight}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Simpan</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.profilePictureSection}>
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
          <Text style={styles.changePhotoText}>Ketuk untuk mengubah foto</Text>
        </View>

        {/* Profile Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
          
          {renderField('Nama Lengkap *', profileData.name, 'name', 'Masukkan nama lengkap')}
          {renderField('Email *', profileData.email, 'email', 'Masukkan email', false, 'email-address')}
          {renderField('Nomor Telepon', profileData.phone, 'phone', 'Masukkan nomor telepon', false, 'phone-pad')}
          {renderField('Alamat', profileData.address, 'address', 'Masukkan alamat lengkap', true)}
          {renderField('Kota', profileData.city, 'city', 'Masukkan nama kota')}
        </View>

        {/* Account Info */}
        <View style={styles.accountInfoContainer}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tipe Akun</Text>
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

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Bergabung Sejak</Text>
            <Text style={styles.infoValue}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              }) : 'N/A'}
            </Text>
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
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  profilePictureSection: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.card,
  },
  changePhotoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    backgroundColor: COLORS.backgroundSecondary,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  accountInfoContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});

export default EditProfileScreen;