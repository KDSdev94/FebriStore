import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const AboutScreen = ({ navigation }) => {
  const appVersion = '1.0.0';
  const buildNumber = '100';
  const releaseDate = 'Januari 2025';

  const handleContactSupport = () => {
    const email = 'support@febristore.com';
    const subject = 'Dukungan Aplikasi Febri Store';
    const body = 'Halo tim support, saya membutuhkan bantuan dengan aplikasi Febri Store.';
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl).catch(() => {
      // Fallback jika tidak ada email client
      Linking.openURL(`https://wa.me/6281234567890?text=${encodeURIComponent('Halo, saya membutuhkan bantuan dengan aplikasi Febri Store.')}`);
    });
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://febristore.com');
  };

  const handleRateApp = () => {
    // Link ke Play Store atau App Store
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.febristore.app';
    Linking.openURL(playStoreUrl);
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://febristore.com/privacy-policy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://febristore.com/terms-of-service');
  };

  const features = [
    {
      icon: 'shopping',
      title: 'Belanja Mudah',
      description: 'Temukan ribuan produk berkualitas dengan harga terbaik'
    },
    {
      icon: 'store',
      title: 'Jual Produk',
      description: 'Buka toko online dan jual produk Anda dengan mudah'
    },
    {
      icon: 'truck-delivery',
      title: 'Pengiriman Cepat',
      description: 'Pengiriman ke seluruh Indonesia dengan berbagai pilihan kurir'
    },
    {
      icon: 'shield-check',
      title: 'Pembayaran Aman',
      description: 'Berbagai metode pembayaran yang aman dan terpercaya'
    },
    {
      icon: 'headset',
      title: 'Customer Service',
      description: 'Tim support yang siap membantu Anda 24/7'
    },
    {
      icon: 'star',
      title: 'Review & Rating',
      description: 'Sistem review yang membantu Anda memilih produk terbaik'
    }
  ];

  const teamMembers = [
    {
      name: 'Febriani Nabila',
      role: 'Founder & CEO',
      description: 'Visioner di balik Febri Store dengan pengalaman 5+ tahun di e-commerce'
    },
    {
      name: 'Tim Development',
      role: 'Tech Team',
      description: 'Tim developer berpengalaman yang membangun aplikasi ini'
    },
    {
      name: 'Tim Customer Service',
      role: 'Support Team',
      description: 'Tim yang siap membantu Anda dengan layanan terbaik'
    }
  ];

  const renderFeatureItem = (feature, index) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <MaterialCommunityIcons name={feature.icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  const renderTeamMember = (member, index) => (
    <View key={index} style={styles.teamMember}>
      <View style={styles.memberAvatar}>
        <MaterialCommunityIcons name="account" size={32} color={COLORS.primary} />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{member.role}</Text>
        <Text style={styles.memberDescription}>{member.description}</Text>
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
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tentang Aplikasi</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.appInfoCard}>
          <View style={styles.appLogo}>
            <MaterialCommunityIcons name="shopping" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>Febri Store</Text>
          <Text style={styles.appTagline}>Platform E-commerce Terpercaya</Text>
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Versi {appVersion} (Build {buildNumber})</Text>
            <Text style={styles.releaseText}>Rilis {releaseDate}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tentang Febri Store</Text>
          <Text style={styles.description}>
            Febri Store adalah platform e-commerce yang menghubungkan pembeli dan penjual di seluruh Indonesia. 
            Kami berkomitmen untuk memberikan pengalaman berbelanja online yang aman, mudah, dan menyenangkan.
            {'\n\n'}
            Dengan ribuan produk berkualitas dari berbagai kategori, Febri Store menjadi pilihan utama untuk 
            memenuhi kebutuhan belanja online Anda. Dari fashion, elektronik, hingga kebutuhan sehari-hari, 
            semuanya tersedia di sini.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitur Unggulan</Text>
          <View style={styles.featuresContainer}>
            {features.map(renderFeatureItem)}
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tim Kami</Text>
          <View style={styles.teamContainer}>
            {teamMembers.map(renderTeamMember)}
          </View>
        </View>

        {/* Contact & Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hubungi Kami</Text>
          
          <TouchableOpacity style={styles.linkItem} onPress={handleContactSupport}>
            <MaterialCommunityIcons name="email" size={24} color={COLORS.primary} />
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Customer Support</Text>
              <Text style={styles.linkSubtitle}>support@febristore.com</Text>
            </View>
            <Feather name="external-link" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem} onPress={handleVisitWebsite}>
            <MaterialCommunityIcons name="web" size={24} color={COLORS.primary} />
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Website</Text>
              <Text style={styles.linkSubtitle}>www.febristore.com</Text>
            </View>
            <Feather name="external-link" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem} onPress={handleRateApp}>
            <MaterialCommunityIcons name="star" size={24} color={COLORS.primary} />
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Beri Rating</Text>
              <Text style={styles.linkSubtitle}>Bantu kami dengan memberikan rating</Text>
            </View>
            <Feather name="external-link" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity style={styles.linkItem} onPress={handlePrivacyPolicy}>
            <MaterialCommunityIcons name="shield-account" size={24} color={COLORS.primary} />
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Kebijakan Privasi</Text>
              <Text style={styles.linkSubtitle}>Pelajari bagaimana kami melindungi data Anda</Text>
            </View>
            <Feather name="external-link" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem} onPress={handleTermsOfService}>
            <MaterialCommunityIcons name="file-document" size={24} color={COLORS.primary} />
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Syarat & Ketentuan</Text>
              <Text style={styles.linkSubtitle}>Ketentuan penggunaan aplikasi</Text>
            </View>
            <Feather name="external-link" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>
            © 2025 Febri Store. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ in Indonesia
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  appInfoCard: {
    backgroundColor: COLORS.card,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  appLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  appName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  appTagline: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  versionInfo: {
    alignItems: 'center',
  },
  versionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  releaseText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  section: {
    margin: SPACING.lg,
    marginTop: 0,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  description: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'justify',
  },
  featuresContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  teamContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  memberRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  memberDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  linkContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  linkTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  linkSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  copyrightContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  copyrightText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  copyrightSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
});

export default AboutScreen;