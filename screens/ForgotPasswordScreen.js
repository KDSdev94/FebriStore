import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: password
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [displayedCode, setDisplayedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);
  
  const { requestPasswordReset, verifyResetCode, resetPasswordWithCode } = useAuth();

  // Step 1: Request reset code
  const handleRequestResetCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Mohon masukkan email Anda');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    try {
      setLoading(true);
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        Alert.alert('Berhasil', result.message);
        if (result.resetCode) {
          setDisplayedCode(result.resetCode);
        }
        setStep(2);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memproses permintaan');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify reset code
  const handleVerifyCode = async () => {
    if (!resetCode) {
      Alert.alert('Error', 'Mohon masukkan kode reset');
      return;
    }

    if (resetCode.length !== 6) {
      Alert.alert('Error', 'Kode reset harus 6 digit');
      return;
    }

    try {
      setLoading(true);
      const result = await verifyResetCode(email, resetCode);
      
      if (result.success) {
        Alert.alert('Berhasil', 'Kode verifikasi valid');
        setStep(3);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memverifikasi kode');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Mohon isi semua field password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak sesuai');
      return;
    }

    try {
      setLoading(true);
      const result = await resetPasswordWithCode(email, resetCode, newPassword);
      
      if (result.success) {
        Alert.alert(
          'Berhasil', 
          'Password berhasil direset! Silakan login dengan password baru Anda.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat mereset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep = (targetStep) => {
    setStep(targetStep);
  };

  // Step indicator component
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
        <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text>
      </View>
      <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
      <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
        <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text>
      </View>
      <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
      <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
        <Text style={[styles.stepText, step >= 3 && styles.stepTextActive]}>3</Text>
      </View>
    </View>
  );

  // Step 1: Email input
  const renderEmailStep = () => (
    <View style={styles.formContainer}>
      <View style={styles.iconContainer}>
        <Feather name="mail" size={40} color={COLORS.primary} />
      </View>
      
      <Text style={styles.title}>Lupa Password?</Text>
      <Text style={styles.subtitle}>
        Masukkan email Anda untuk mendapatkan kode reset password
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Feather name="mail" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Masukkan email Anda"
            placeholderTextColor={COLORS.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.resetButton, loading && styles.resetButtonDisabled]}
        onPress={handleRequestResetCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.card} />
        ) : (
          <Text style={styles.resetButtonText}>Kirim Kode Reset</Text>
        )}
      </TouchableOpacity>

      <View style={styles.backContainer}>
        <Text style={styles.backText}>Ingat password Anda? </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 2: Code verification
  const renderCodeStep = () => (
    <View style={styles.formContainer}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="key" size={40} color={COLORS.primary} />
      </View>
      
      <Text style={styles.title}>Verifikasi Kode</Text>
      <Text style={styles.subtitle}>
        Masukkan 6 digit kode yang telah dikirim ke email Anda
      </Text>

      {displayedCode && (
        <View style={styles.codeDisplayContainer}>
          <Text style={styles.codeDisplayLabel}>Kode Reset Anda:</Text>
          <Text style={styles.codeDisplayText}>{displayedCode}</Text>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => {
              setResetCode(displayedCode);
              Alert.alert('Info', 'Kode telah disalin ke input field');
            }}
          >
            <Text style={styles.copyButtonText}>Salin Kode</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="key" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Masukkan kode 6 digit"
            placeholderTextColor={COLORS.textLight}
            value={resetCode}
            onChangeText={setResetCode}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.resetButton, loading && styles.resetButtonDisabled]}
        onPress={handleVerifyCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.card} />
        ) : (
          <Text style={styles.resetButtonText}>Verifikasi Kode</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => handleBackToStep(1)}
      >
        <Text style={styles.backButtonText}>Kembali ke Email</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 3: New password
  const renderPasswordStep = () => (
    <View style={styles.formContainer}>
      <View style={styles.iconContainer}>
        <Feather name="lock" size={40} color={COLORS.primary} />
      </View>
      
      <Text style={styles.title}>Password Baru</Text>
      <Text style={styles.subtitle}>
        Masukkan password baru untuk akun Anda
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Masukkan password baru"
            placeholderTextColor={COLORS.textLight}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={obscurePassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setObscurePassword(!obscurePassword)}
          >
            <Feather 
              name={obscurePassword ? "eye-off" : "eye"} 
              size={20} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Konfirmasi password baru"
            placeholderTextColor={COLORS.textLight}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={obscureConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setObscureConfirmPassword(!obscureConfirmPassword)}
          >
            <Feather 
              name={obscureConfirmPassword ? "eye-off" : "eye"} 
              size={20} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.resetButton, loading && styles.resetButtonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.card} />
        ) : (
          <Text style={styles.resetButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => handleBackToStep(2)}
      >
        <Text style={styles.backButtonText}>Kembali ke Verifikasi</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepIndicator()}
        
        {step === 1 && renderEmailStep()}
        {step === 2 && renderCodeStep()}
        {step === 3 && renderPasswordStep()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {step === 1 && "Pastikan email yang Anda masukkan sudah terdaftar di sistem"}
            {step === 2 && "Kode akan kadaluarsa dalam 30 menit"}
            {step === 3 && "Password minimal 6 karakter"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  
  // Step Indicator Styles
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.divider,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  stepTextActive: {
    color: COLORS.card,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.sm,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  
  // Form Container
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.large,
    marginBottom: SPACING.lg,
  },
  
  // Icon Container
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  // Typography
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  
  // Code Display (Demo)
  codeDisplayContainer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
    alignItems: 'center',
  },
  codeDisplayLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  codeDisplayText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: SPACING.sm,
  },
  copyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  copyButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
  },
  
  // Input Styles
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 50,
    position: 'relative',
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: SPACING.xs,
    position: 'absolute',
    right: SPACING.sm,
  },
  
  // Button Styles
  resetButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  backButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  
  // Navigation Links
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  backText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  backLink: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ForgotPasswordScreen;