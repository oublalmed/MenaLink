import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { ProviderTabsParamList } from './types';
import { DashboardScreen } from '../screens/provider/DashboardScreen';
import { RequestsScreen } from '../screens/provider/RequestsScreen';
import { CalendarScreen } from '../screens/provider/CalendarScreen';
import { EarningsScreen } from '../screens/provider/EarningsScreen';
import { ProviderProfileScreen } from '../screens/provider/ProfileScreen';
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator<ProviderTabsParamList>();

const ICONS: Record<string, string> = {
  Dashboard: '📊',
  Requests: '📨',
  Calendar: '📅',
  Earnings: '💰',
  Profile: '👤',
};

export function ProviderTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>{ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Tableau de bord' }} />
      <Tab.Screen name="Requests" component={RequestsScreen} options={{ tabBarLabel: 'Demandes' }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: 'Calendrier' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ tabBarLabel: 'Revenus' }} />
      <Tab.Screen name="Profile" component={ProviderProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}
