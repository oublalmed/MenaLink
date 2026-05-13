import { create } from 'zustand';
import { api } from '../services/api';
import { Booking, CreateBookingDto, PaginatedResponse } from '../../../shared/types';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  totalPages: number;
  page: number;

  fetchBookings: (page?: number) => Promise<void>;
  fetchBookingById: (id: string) => Promise<void>;
  createBooking: (dto: CreateBookingDto) => Promise<Booking>;
  cancelBooking: (id: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  currentBooking: null,
  isLoading: false,
  totalPages: 1,
  page: 1,

  fetchBookings: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.get<PaginatedResponse<Booking>>(`/bookings?page=${page}&limit=10`);
      set({
        bookings: page === 1 ? response.data.items : [...get().bookings, ...response.data.items],
        totalPages: response.data.totalPages,
        page,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBookingById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get<Booking>(`/bookings/${id}`);
      set({ currentBooking: response.data });
    } finally {
      set({ isLoading: false });
    }
  },

  createBooking: async (dto) => {
    set({ isLoading: true });
    try {
      const response = await api.post<Booking>('/bookings', dto);
      set((state) => ({ bookings: [response.data, ...state.bookings] }));
      return response.data;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelBooking: async (id) => {
    await api.patch(`/bookings/${id}/cancel`);
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'CANCELLED' as const } : b,
      ),
    }));
  },
}));
