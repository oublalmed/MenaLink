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
  BookingDetail: { bookingId: string };
  ProviderDetail: { providerId: string };
  Payment: { bookingId: string; amount: number };
  Chat: { bookingId: string; participantName: string };
};
