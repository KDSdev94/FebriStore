import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const AdminWelcomeScreen = ({ navigation }) => {
  const handleContinue = () => {
    navigation.replace('Login');
  };

  const InfoCard = ({ icon, title, description, color = COLORS.primary }) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
      </View>
    </View>
  );

  const CredentialCard = ({ title, email, password, role, color }) => (
    <View style={[styles.credentialCard, { borderLeftColor: color }]}>
      <Text style={styles.credentialTitle}>{title}</Text>
      <View style={styles.credentialRow}>
        <MaterialCommunityIcons name="email" size={16} color={COLORS.textSecondary} />
        <Text style={styles.credentialText}>{email}</Text>
      </View>
      <View style={styles.credentialRow}>
        <MaterialCommunityIcons name="key" size={16} color={COLORS.textSecondary} />
        <Text style={styles.credentialText}>{password}</Text>
      </View>
      <View style={styles.credentialRow}>
        <MaterialCommunityIcons name="account-circle" size={16} color={COLORS.textSecondary} />
        <Text style={styles.credentialRole}>{role}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <MaterialCommunityIcons name="check-circle" size={64} color={COLORS.card} />
        <Text style={styles.headerTitle}>Setup Berhasil!</Text>
        <Text style={styles.headerSubtitle}>
          Database dan akun default telah berhasil dibuat
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yang Telah Dibuat</Text>
          
          <InfoCard
            icon="database"
            title="Database Terinitialisasi"
            description="Kategori, status pesanan, dan konfigurasi aplikasi"
            color={COLORS.success}
          />
          
          <InfoCard
            icon="account-cog"
            title="Akun Admin Default"
            description="Akun administrator untuk mengelola sistem"
            color={COLORS.primary}
          />
          
          <InfoCard
            icon="store"
            title="Data Sample"
            description="Akun penjual dan produk sample untuk testing"
            color={COLORS.secondary}
          />
        </View>

        {/* Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akun Default</Text>
          <Text style={styles.sectionDescription}>
            Gunakan akun berikut untuk login pertama kali:
          </Text>
          
          <CredentialCard
            title="👑 Administrator"
            email="admin@febristore.com"
            password="admin123"
            role="Admin - Kelola seluruh sistem"
            color={COLORS.primary}
          />
          
          <CredentialCard
            title="🏪 Penjual Sample"
            email="seller@sample.com"
            password="seller123"
            role="Seller - Kelola produk dan toko"
            color={COLORS.secondary}
          />
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langkah Selanjutnya</Text>
          
          <View style={styles.instructionCard}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Login sebagai Admin</Text>
                <Text style={styles.stepDescription}>
                  Gunakan akun admin untuk mengatur rekening bank, kategori, dan pengaturan lainnya
                </Text>
              </View>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Daftar sebagai Penjual</Text>
                <Text style={styles.stepDescription}>
                  Buat akun penjual baru atau gunakan akun sample untuk menambah produk
                </Text>
              </View>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Daftar sebagai Pembeli</Text>
                <Text style={styles.stepDescription}>
                  Buat akun pembeli untuk mencoba fitur berbelanja dan checkout
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.section}>
          <View style={styles.securityCard}>
            <MaterialCommunityIcons name="shield-alert" size={24} color={COLORS.warning} />
            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>Catatan Keamanan</Text>
              <Text style={styles.securityDescription}>
                Segera ganti password default setelah login pertama kali untuk keamanan yang lebih baik.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Lanjutkan ke Login</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.card} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.card,
    fontWeight: 'bold',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: SPACING.sm,
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
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  infoDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  credentialCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  credentialTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  credentialText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    fontFamily: 'monospace',
  },
  credentialRole: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontStyle: 'italic',
  },
  instructionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  securityCard: {
    backgroundColor: COLORS.warning + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  securityContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  securityTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  securityDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  continueButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    marginRight: SPACING.sm,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});

export default AdminWelcomeScreen;