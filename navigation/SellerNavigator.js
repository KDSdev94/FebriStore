import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import Seller Screens
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerStoreProfileScreen from '../screens/seller/SellerStoreProfileScreen';

import { COLORS, TYPOGRAPHY, SPACING } from '../utils/constants';

const Tab = createBottomTabNavigator();

const TabBarBadge = ({ count }) => {
  if (count <= 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

const SellerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = MaterialCommunityIcons;

          if (route.name === 'Products') {
            iconName = focused ? 'package-variant' : 'package-variant-closed';
          } else if (route.name === 'SellerOrders') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
          } else if (route.name === 'StoreProfile') {
            iconName = focused ? 'store' : 'store-outline';
          }

          return (
            <View style={styles.tabIconContainer}>
              <IconComponent name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.divider,
          paddingBottom: SPACING.xs,
          paddingTop: SPACING.xs,
          height: 60,
        },
        tabBarLabelStyle: {
          ...TYPOGRAPHY.caption,
          fontWeight: '500',
          marginTop: SPACING.xs,
        },
      })}
    >
      <Tab.Screen 
        name="Products" 
        component={SellerProductsScreen}
        options={{
          tabBarLabel: 'Produk',
        }}
      />
      <Tab.Screen 
        name="SellerOrders" 
        component={SellerOrdersScreen}
        options={{
          tabBarLabel: 'Pesanan',
        }}
      />
      <Tab.Screen 
        name="StoreProfile" 
        component={SellerStoreProfileScreen}
        options={{
          tabBarLabel: 'Toko',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  badgeText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SellerNavigator;