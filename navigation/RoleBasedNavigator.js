import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AppStackNavigator from './AppStackNavigator';
import SellerStackNavigator from './SellerStackNavigator';
import AdminStackNavigator from './AdminStackNavigator';

const RoleBasedNavigator = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  // Debug log untuk melihat user data
  console.log('RoleBasedNavigator - User data:', user);
  console.log('RoleBasedNavigator - User role:', user?.role);

  // Handle logout - redirect to login when user becomes null
  useEffect(() => {
    if (user === null) {
      console.log('User logged out, redirecting to Login');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [user, navigation]);

  // If user is null (logged out), don't render anything
  // The useEffect above will handle navigation
  if (user === null) {
    return null;
  }

  // Jika user adalah admin, gunakan AdminStackNavigator
  if (user?.role === 'admin') {
    console.log('Loading AdminStackNavigator for admin');
    return <AdminStackNavigator />;
  }

  // Jika user adalah seller, gunakan SellerStackNavigator
  if (user?.role === 'seller') {
    console.log('Loading SellerStackNavigator for seller');
    return <SellerStackNavigator />;
  }

  // Default untuk buyer/customer
  console.log('Loading AppStackNavigator for buyer/default');
  return <AppStackNavigator />;
};

export default RoleBasedNavigator;