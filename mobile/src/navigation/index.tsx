import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { ClientTabs } from './ClientTabs';
import { ProviderTabs } from './ProviderTabs';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';

// Client screens
import { ProviderDetailScreen } from '../screens/client/ProviderDetailScreen';
import { BookingScreen } from '../screens/client/BookingScreen';
import { BookingDetailScreen } from '../screens/client/BookingDetailScreen';
import { LiveTrackingScreen } from '../screens/client/LiveTrackingScreen';
import { ChatScreen } from '../screens/client/ChatScreen';
import { ReviewScreen } from '../screens/client/ReviewScreen';

// Provider screens
import { ActiveMissionScreen } from '../screens/provider/ActiveMissionScreen';
import { ProviderBookingDetailScreen } from '../screens/provider/ProviderBookingDetailScreen';
import { WithdrawalScreen } from '../screens/provider/WithdrawalScreen';
import { ProviderChatScreen } from '../screens/provider/ProviderChatScreen';

const Root = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isInitialized } = useAuthStore();
  const { colors } = useTheme();

  if (!isInitialized) {
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
          <>
            <Root.Screen name="ProviderTabs" component={ProviderTabs} />
            <Root.Screen name="ActiveMission" component={ActiveMissionScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
            <Root.Screen name="ProviderBookingDetail" component={ProviderBookingDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="Withdrawal" component={WithdrawalScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Root.Screen name="ProviderChat" component={ProviderChatScreen} options={{ animation: 'slide_from_right' }} />
          </>
        ) : (
          <>
            <Root.Screen name="ClientTabs" component={ClientTabs} />
            <Root.Screen name="ProviderDetail" component={ProviderDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="Booking" component={BookingScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Root.Screen name="BookingDetail" component={BookingDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
            <Root.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="Review" component={ReviewScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
          </>
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
