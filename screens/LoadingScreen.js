import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const LoadingScreen = ({ navigation }) => {
  const { user, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [loadingStatus, setLoadingStatus] = useState('Memuat aplikasi...');

  useEffect(() => {
    // Animasi fade in dan scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Simple loading process
    const initializeApp = async () => {
      setLoadingStatus('Memuat aplikasi...');
      
      // Wait a bit then navigate
      setTimeout(() => {
        setLoadingStatus('Siap digunakan!');
        
        setTimeout(() => {
          if (!loading) {
            if (user) {
              navigation.replace('Main');
            } else {
              // Langsung ke login tanpa halaman welcome
              navigation.replace('Login');
            }
          }
        }, 500);
      }, 1500);
    };

    const timer = setTimeout(() => {
      initializeApp();
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, loading, navigation, fadeAnim, scaleAnim]);

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo */}
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* App Name */}
        <Text style={styles.appName}>Febri Store</Text>
        <Text style={styles.tagline}>Belanja Online Terpercaya</Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.card} />
          <Text style={styles.loadingText}>{loadingStatus}</Text>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Febri Store</Text>
        <Text style={styles.versionText}>Versi 1.0.0</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: SPACING.xl,
  },
  appName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.card,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  tagline: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.card,
    marginTop: SPACING.md,
    opacity: 0.8,
  },
  footer: {
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    opacity: 0.7,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    opacity: 0.5,
    marginTop: SPACING.xs,
  },
});

export default LoadingScreen;