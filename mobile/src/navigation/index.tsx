import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { ClientTabs } from './ClientTabs';
import { ProviderTabs } from './ProviderTabs';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import { ActivityIndicator, View } from 'react-native';

const Root = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuthStore();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {user == null ? (
          <Root.Screen name="Auth" component={AuthStack} />
        ) : user.role === 'PROVIDER' ? (
          <Root.Screen name="ProviderTabs" component={ProviderTabs} />
        ) : (
          <Root.Screen name="ClientTabs" component={ClientTabs} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
