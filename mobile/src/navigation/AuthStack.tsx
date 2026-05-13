import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/shared/LoginScreen';
import { RegisterClientScreen } from '../screens/auth/RegisterClientScreen';
import { RegisterProviderScreen } from '../screens/auth/RegisterProviderScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="RegisterClient" component={RegisterClientScreen} />
      <Stack.Screen name="RegisterProvider" component={RegisterProviderScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
