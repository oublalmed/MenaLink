import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock the api service before importing the hook
// ---------------------------------------------------------------------------
jest.mock('../../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock Toast to prevent side-effect warnings in test output
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

import { api } from '../../../services/api';
import {
  useBookings,
  useBooking,
  useCreateBooking,
  useCancelBooking,
  BookingData,
  CreateBookingInput,
} from '../../../hooks/api/useBookings';

const mockedApi = api as jest.Mocked<typeof api>;

// ---------------------------------------------------------------------------
// Test wrapper factory
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const mockBookingData: BookingData = {
  id: 'b1',
  providerId: 'p1',
  providerName: 'Fatima Zahra',
  clientId: 'c1',
  serviceType: 'Ménage',
  scheduledDate: '2024-06-15',
  scheduledTime: '09:00',
  durationHours: 3,
  totalAmount: 180,
  commission: 18,
  providerAmount: 162,
  paymentMethod: 'CASH',
  paymentStatus: 'PENDING',
  status: 'CONFIRMED',
  createdAt: '2024-06-01T10:00:00.000Z',
};

const mockPageResponse = {
  items: [mockBookingData],
  total: 1,
  page: 1,
  totalPages: 1,
};

// ---------------------------------------------------------------------------
// useBookings (infinite query)
// ---------------------------------------------------------------------------

describe('useBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in loading state', () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPageResponse });
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data after successful fetch', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPageResponse });
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pages[0].items).toHaveLength(1);
    expect(result.current.data?.pages[0].items[0].id).toBe('b1');
  });

  it('returns error state when api fails', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('passes status filter in query string when status is provided', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPageResponse });
    const { result } = renderHook(() => useBookings('CONFIRMED'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('status=CONFIRMED'),
    );
  });

  it('does not include status in query string when status is "ALL"', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPageResponse });
    const { result } = renderHook(() => useBookings('ALL'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.not.stringContaining('status=ALL'),
    );
  });

  it('getNextPageParam returns undefined when on last page', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPageResponse }); // page 1 of 1
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('getNextPageParam returns next page when more pages exist', async () => {
    const multiPageResponse = { ...mockPageResponse, page: 1, totalPages: 3 };
    mockedApi.get.mockResolvedValueOnce({ data: multiPageResponse });
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useBooking (single booking query)
// ---------------------------------------------------------------------------

describe('useBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in loading state when bookingId is provided', () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockBookingData });
    const { result } = renderHook(() => useBooking('b1'), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns booking data on success', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockBookingData });
    const { result } = renderHook(() => useBooking('b1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBookingData);
    expect(result.current.data?.id).toBe('b1');
  });

  it('returns error state when api fails', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Not found'));
    const { result } = renderHook(() => useBooking('missing'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('is disabled and does not fetch when bookingId is empty string', () => {
    const { result } = renderHook(() => useBooking(''), {
      wrapper: createWrapper(),
    });
    // enabled=false means no pending/loading state
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('calls correct API endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockBookingData });
    const { result } = renderHook(() => useBooking('b42'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/bookings/b42');
  });
});

// ---------------------------------------------------------------------------
// useCreateBooking mutation
// ---------------------------------------------------------------------------

describe('useCreateBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is idle initially', () => {
    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('returns created booking on success', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: mockBookingData });
    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: createWrapper(),
    });

    const input: CreateBookingInput = {
      providerId: 'p1',
      serviceType: 'Ménage',
      scheduledDate: '2024-07-01',
      scheduledTime: '10:00',
      durationHours: 2,
      paymentMethod: 'CASH',
    };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(mockedApi.post).toHaveBeenCalledWith('/bookings', input);
  });

  it('sets error state when mutation fails', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('Server error'));
    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          providerId: 'p1',
          serviceType: 'Ménage',
          scheduledDate: '2024-07-01',
          scheduledTime: '10:00',
          durationHours: 2,
          paymentMethod: 'CASH',
        });
      } catch {
        // expected error
      }
    });

    expect(result.current.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useCancelBooking mutation
// ---------------------------------------------------------------------------

describe('useCancelBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is idle initially', () => {
    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(false);
  });

  it('calls correct PATCH endpoint', async () => {
    mockedApi.patch.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('booking-42');
    });

    expect(mockedApi.patch).toHaveBeenCalledWith('/bookings/booking-42/cancel');
  });

  it('sets success state after cancellation', async () => {
    mockedApi.patch.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('booking-1');
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('sets error state when cancellation api fails', async () => {
    mockedApi.patch.mockRejectedValueOnce(new Error('Cannot cancel'));
    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('booking-1');
      } catch {
        // expected
      }
    });

    expect(result.current.isError).toBe(true);
  });
});
