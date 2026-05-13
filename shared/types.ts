// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
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
  STANDARD = 'STANDARD',
  DEEP_CLEAN = 'DEEP_CLEAN',
  MOVE_IN_OUT = 'MOVE_IN_OUT',
  OFFICE = 'OFFICE',
  POST_CONSTRUCTION = 'POST_CONSTRUCTION',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
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
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface Provider extends User {
  bio?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  servicesOffered: ServiceType[];
  pricePerHour: number;
  coverageRadius: number;
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
  serviceId: string;
  addressId: string;
  status: BookingStatus;
  scheduledAt: string;
  durationHours: number;
  totalPrice: number;
  notes?: string;
  client?: User;
  provider?: Provider;
  service?: Service;
  address?: Address;
  payment?: Payment;
  review?: Review;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  youcanPayOrderId?: string;
  youcanPayTransactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  rating: number;
  comment?: string;
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
  serviceId: string;
  providerId: string;
  addressId: string;
  scheduledAt: string;
  durationHours: number;
  notes?: string;
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
