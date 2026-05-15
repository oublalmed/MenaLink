// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum ServiceType {
  CLEANING = 'CLEANING',
  IRONING = 'IRONING',
  DEEP_CLEANING = 'DEEP_CLEANING',
  POST_CONSTRUCTION = 'POST_CONSTRUCTION',
  COOKING = 'COOKING',
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  BOOKING_NEW = 'BOOKING_NEW',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
}

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  district?: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  bio?: string;
  hourlyRateMin: number;
  hourlyRateMax: number;
  isVerified: boolean;
  isAvailable: boolean;
  isOnline: boolean;
  averageRating: number;
  totalReviews: number;
  totalMissions: number;
  serviceRadiusKm: number;
  lat?: number;
  lng?: number;
  user?: User;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  basePrice: number;
  durationHours: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  addressId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  totalAmount: number;
  commission: number;
  providerAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  clientNotes?: string;
  cancellationReason?: string;
  startedAt?: string;
  completedAt?: string;
  client?: User;
  provider?: ProviderProfile;
  address?: Address;
  review?: Review;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  rating: number;
  comment?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  providerId: string;
  amount: number;
  bankAccountRib: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

// ─── API DTOs ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBookingDto {
  providerId: string;
  addressId: string;
  serviceType: ServiceType;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  paymentMethod: PaymentMethod;
  clientNotes?: string;
}

export interface UpdateBookingStatusDto {
  status: BookingStatus;
  reason?: string;
}

export interface CreateReviewDto {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole.CLIENT | UserRole.PROVIDER;
}

// ─── Firebase Realtime DB ─────────────────────────────────────────────────────

export interface FirebaseBookingUpdate {
  bookingId: string;
  status: BookingStatus;
  updatedAt: number;
}

export interface FirebaseChatRoom {
  bookingId: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: number;
}
