import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { ClientTabsParamList } from './types';
import { HomeScreen } from '../screens/client/HomeScreen';
import { SearchScreen } from '../screens/client/SearchScreen';
import { BookingsScreen } from '../screens/client/BookingsScreen';
import { ChatListScreen } from '../screens/client/ChatListScreen';
import { ClientProfileScreen } from '../screens/client/ProfileScreen';
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator<ClientTabsParamList>();

const ICONS: Record<string, string> = {
  Home: '🏠',
  Search: '🔍',
  Bookings: '📋',
  ChatList: '💬',
  Profile: '👤',
};

export function ClientTabs() {
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Recherche' }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ tabBarLabel: 'Réservations' }} />
      <Tab.Screen name="ChatList" component={ChatListScreen} options={{ tabBarLabel: 'Messages' }} />
      <Tab.Screen name="Profile" component={ClientProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}
