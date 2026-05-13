import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  LoginScreen: undefined;
  RegisterClient: undefined;
  RegisterProvider: undefined;
  OTPVerification: { phone: string; mode: 'register' | 'forgot' };
  ForgotPassword: undefined;
};

export type ClientTabsParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  ChatList: undefined;
  Profile: undefined;
};

export type ProviderTabsParamList = {
  Dashboard: undefined;
  Requests: undefined;
  Calendar: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  ClientTabs: NavigatorScreenParams<ClientTabsParamList>;
  ProviderTabs: NavigatorScreenParams<ProviderTabsParamList>;
  // Client modals / stack screens
  ProviderDetail: { providerId: string };
  Booking: { providerId: string; providerName: string; hourlyRateMin: number };
  BookingDetail: { bookingId: string };
  LiveTracking: { bookingId: string };
  Chat: { bookingId: string; participantName: string; participantId: string; participantAvatarUrl?: string };
  Review: { bookingId: string; providerName: string; providerAvatarUrl?: string };
  Payment: { bookingId: string; amount: number; paymentUrl: string };
};
