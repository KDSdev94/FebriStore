import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../utils/constants';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminStoreManagementScreen from '../screens/admin/AdminStoreManagementScreen';
import AdminStoreDetailScreen from '../screens/admin/AdminStoreDetailScreen';
import AdminTransactionManagementScreen from '../screens/admin/AdminTransactionManagementScreen';
import AdminRevenueStatsScreen from '../screens/admin/AdminRevenueStatsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Admin Dashboard Stack
const AdminDashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
    <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
    <Stack.Screen name="AdminRevenueStats" component={AdminRevenueStatsScreen} />
    <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </Stack.Navigator>
);

// Admin Orders Stack
const AdminOrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminOrdersList" component={AdminOrdersScreen} />
    <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
    <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </Stack.Navigator>
);

// Admin Store Management Stack
const AdminStoreManagementStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminStoreManagement" component={AdminStoreManagementScreen} />
    <Stack.Screen name="StoreDetail" component={AdminStoreDetailScreen} />
    <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </Stack.Navigator>
);

// Admin Transaction Management Stack - Simplified
const AdminTransactionManagementStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen 
      name="AdminTransactionManagement" 
      component={AdminTransactionManagementScreen} 
    />
    <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </Stack.Navigator>
);

const AdminStackNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
          } else if (route.name === 'StoreManagement') {
            iconName = focused ? 'store' : 'store-outline';
          } else if (route.name === 'TransactionManagement') {
            iconName = focused ? 'credit-card' : 'credit-card-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.divider,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          ...TYPOGRAPHY.caption,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={AdminOrdersStack}
        options={{
          tabBarLabel: 'Pesanan',
        }}
      />
      <Tab.Screen 
        name="StoreManagement" 
        component={AdminStoreManagementStack}
        options={{
          tabBarLabel: 'Toko',
        }}
      />
      <Tab.Screen 
        name="TransactionManagement" 
        component={AdminTransactionManagementStack}
        options={{
          tabBarLabel: 'Transaksi',
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminStackNavigator;