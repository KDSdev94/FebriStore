import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const ChangePasswordScreen = ({ navigation }) => {
  const { user, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      Alert.alert('Error', 'Password saat ini harus diisi');
      return false;
    }

    if (!formData.newPassword.trim()) {
      Alert.alert('Error', 'Password baru harus diisi');
      return false;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'Password baru minimal 6 karakter');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak sesuai');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Error', 'Password baru harus berbeda dengan password saat ini');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const result = await changePassword(formData.currentPassword, formData.newPassword);

      if (result.success) {
        Alert.alert(
          'Berhasil',
          'Password berhasil diubah',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Gagal mengubah password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    label,
    field,
    placeholder,
    showPasswordKey
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          placeholder={placeholder}
          secureTextEntry={!showPasswords[showPasswordKey]}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => togglePasswordVisibility(showPasswordKey)}
        >
          <MaterialCommunityIcons
            name={showPasswords[showPasswordKey] ? 'eye-off' : 'eye'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Ganti Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color={COLORS.info} />
          <Text style={styles.infoText}>
            Pastikan password baru Anda aman dan mudah diingat. Password minimal 6 karakter.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {renderPasswordInput(
            'Password Saat Ini *',
            'currentPassword',
            'Masukkan password saat ini',
            'current'
          )}

          {renderPasswordInput(
            'Password Baru *',
            'newPassword',
            'Masukkan password baru',
            'new'
          )}

          {renderPasswordInput(
            'Konfirmasi Password Baru *',
            'confirmPassword',
            'Konfirmasi password baru',
            'confirm'
          )}

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Syarat Password:</Text>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={16} 
                color={formData.newPassword.length >= 6 ? COLORS.success : COLORS.textSecondary} 
              />
              <Text style={[
                styles.requirementText,
                { color: formData.newPassword.length >= 6 ? COLORS.success : COLORS.textSecondary }
              ]}>
                Minimal 6 karakter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={16} 
                color={formData.newPassword && formData.newPassword !== formData.currentPassword ? COLORS.success : COLORS.textSecondary} 
              />
              <Text style={[
                styles.requirementText,
                { color: formData.newPassword && formData.newPassword !== formData.currentPassword ? COLORS.success : COLORS.textSecondary }
              ]}>
                Berbeda dengan password saat ini
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={16} 
                color={formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword ? COLORS.success : COLORS.textSecondary} 
              />
              <Text style={[
                styles.requirementText,
                { color: formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword ? COLORS.success : COLORS.textSecondary }
              ]}>
                Konfirmasi password sesuai
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Simpan</Text>
              </>
            )}
          </TouchableOpacity>
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
    padding: SPACING.lg,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  infoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
  eyeButton: {
    padding: SPACING.sm,
  },
  requirementsContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
  },
  requirementsTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  requirementText: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});

export default ChangePasswordScreen;