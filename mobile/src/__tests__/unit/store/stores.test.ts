import { act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mock firebase/auth before importing authStore
// ---------------------------------------------------------------------------
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

// Mock the firebase service so the module resolves without native modules
jest.mock('../../../services/firebase', () => ({
  firebaseAuth: {},
}));

// Mock the api service
jest.mock('../../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import { useAuthStore } from '../../../store/authStore';
import { useBookingStore } from '../../../store/bookingStore';
import { useSearchStore } from '../../../store/searchStore';
import { api } from '../../../services/api';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const mockedApi = api as jest.Mocked<typeof api>;
const mockedSignIn = signInWithEmailAndPassword as jest.Mock;
const mockedCreateUser = createUserWithEmailAndPassword as jest.Mock;
const mockedSignOut = signOut as jest.Mock;

// ---------------------------------------------------------------------------
// searchStore
// ---------------------------------------------------------------------------

describe('searchStore', () => {
  beforeEach(() => {
    act(() => {
      useSearchStore.setState({
        query: '',
        filters: {
          serviceTypes: [],
          minPrice: 0,
          maxPrice: 500,
          minRating: 0,
          verifiedOnly: false,
          availableDate: null,
          radiusKm: 20,
        },
        viewMode: 'list',
        activeFilterCount: 0,
      });
    });
  });

  it('has correct initial state', () => {
    const { query, filters, viewMode, activeFilterCount } = useSearchStore.getState();
    expect(query).toBe('');
    expect(filters.maxPrice).toBe(500);
    expect(viewMode).toBe('list');
    expect(activeFilterCount).toBe(0);
  });

  it('setQuery updates the query string', () => {
    act(() => {
      useSearchStore.getState().setQuery('nettoyage');
    });
    expect(useSearchStore.getState().query).toBe('nettoyage');
  });

  it('setQuery with empty string clears the query', () => {
    act(() => {
      useSearchStore.getState().setQuery('test');
    });
    act(() => {
      useSearchStore.getState().setQuery('');
    });
    expect(useSearchStore.getState().query).toBe('');
  });

  it('setFilters merges partial filters', () => {
    act(() => {
      useSearchStore.getState().setFilters({ minRating: 4 });
    });
    expect(useSearchStore.getState().filters.minRating).toBe(4);
    // Other filters unchanged
    expect(useSearchStore.getState().filters.maxPrice).toBe(500);
  });

  it('setFilters increments activeFilterCount for minRating > 0', () => {
    act(() => {
      useSearchStore.getState().setFilters({ minRating: 3 });
    });
    expect(useSearchStore.getState().activeFilterCount).toBeGreaterThan(0);
  });

  it('setFilters counts verifiedOnly as active filter', () => {
    act(() => {
      useSearchStore.getState().setFilters({ verifiedOnly: true });
    });
    expect(useSearchStore.getState().activeFilterCount).toBeGreaterThanOrEqual(1);
  });

  it('setFilters counts serviceTypes as active filter when non-empty', () => {
    act(() => {
      useSearchStore.getState().setFilters({ serviceTypes: ['Ménage', 'Repassage'] });
    });
    expect(useSearchStore.getState().activeFilterCount).toBeGreaterThanOrEqual(1);
  });

  it('resetFilters restores default filters', () => {
    act(() => {
      useSearchStore.getState().setFilters({ minRating: 4, verifiedOnly: true });
    });
    act(() => {
      useSearchStore.getState().resetFilters();
    });
    const { filters, activeFilterCount } = useSearchStore.getState();
    expect(filters.minRating).toBe(0);
    expect(filters.verifiedOnly).toBe(false);
    expect(activeFilterCount).toBe(0);
  });

  it('setViewMode switches to "map"', () => {
    act(() => {
      useSearchStore.getState().setViewMode('map');
    });
    expect(useSearchStore.getState().viewMode).toBe('map');
  });

  it('setViewMode switches back to "list"', () => {
    act(() => {
      useSearchStore.getState().setViewMode('map');
    });
    act(() => {
      useSearchStore.getState().setViewMode('list');
    });
    expect(useSearchStore.getState().viewMode).toBe('list');
  });

  it('non-default radiusKm counts as active filter', () => {
    act(() => {
      useSearchStore.getState().setFilters({ radiusKm: 5 });
    });
    expect(useSearchStore.getState().activeFilterCount).toBeGreaterThanOrEqual(1);
  });

  it('price range outside default counts as active filter', () => {
    act(() => {
      useSearchStore.getState().setFilters({ maxPrice: 200 });
    });
    expect(useSearchStore.getState().activeFilterCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// bookingStore
// ---------------------------------------------------------------------------

describe('bookingStore', () => {
  const initialState = {
    bookings: [],
    currentBooking: null,
    isLoading: false,
    totalPages: 1,
    page: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useBookingStore.setState(initialState);
    });
  });

  it('has correct initial state', () => {
    const { bookings, currentBooking, isLoading, totalPages, page } =
      useBookingStore.getState();
    expect(bookings).toEqual([]);
    expect(currentBooking).toBeNull();
    expect(isLoading).toBe(false);
    expect(totalPages).toBe(1);
    expect(page).toBe(1);
  });

  it('fetchBookings sets bookings from api response', async () => {
    const items = [
      {
        id: 'b1',
        providerId: 'p1',
        providerName: 'Fatima',
        serviceType: 'Ménage',
        scheduledDate: '2024-06-01',
        scheduledTime: '10:00',
        durationHours: 2,
        totalAmount: 100,
        status: 'CONFIRMED',
      },
    ];
    mockedApi.get.mockResolvedValueOnce({
      data: { items, totalPages: 3 },
    });

    await act(async () => {
      await useBookingStore.getState().fetchBookings(1);
    });

    expect(useBookingStore.getState().bookings).toEqual(items);
    expect(useBookingStore.getState().totalPages).toBe(3);
    expect(useBookingStore.getState().page).toBe(1);
    expect(useBookingStore.getState().isLoading).toBe(false);
  });

  it('fetchBookings appends items when page > 1', async () => {
    const firstItem = { id: 'b1' };
    const secondItem = { id: 'b2' };

    act(() => {
      useBookingStore.setState({ bookings: [firstItem] as any });
    });

    mockedApi.get.mockResolvedValueOnce({
      data: { items: [secondItem], totalPages: 2 },
    });

    await act(async () => {
      await useBookingStore.getState().fetchBookings(2);
    });

    expect(useBookingStore.getState().bookings).toHaveLength(2);
    expect(useBookingStore.getState().bookings[0].id).toBe('b1');
    expect(useBookingStore.getState().bookings[1].id).toBe('b2');
  });

  it('fetchBookings resets isLoading to false on completion', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { items: [], totalPages: 1 },
    });

    await act(async () => {
      await useBookingStore.getState().fetchBookings();
    });

    expect(useBookingStore.getState().isLoading).toBe(false);
  });

  it('fetchBookings resets isLoading to false on error', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      try {
        await useBookingStore.getState().fetchBookings();
      } catch {
        // expected
      }
    });

    expect(useBookingStore.getState().isLoading).toBe(false);
  });

  it('fetchBookingById sets currentBooking', async () => {
    const booking = { id: 'b99', providerName: 'Ali' };
    mockedApi.get.mockResolvedValueOnce({ data: booking });

    await act(async () => {
      await useBookingStore.getState().fetchBookingById('b99');
    });

    expect(useBookingStore.getState().currentBooking).toEqual(booking);
    expect(useBookingStore.getState().isLoading).toBe(false);
  });

  it('createBooking adds new booking to the front of the list', async () => {
    const newBooking = { id: 'b-new', providerName: 'Khadija', status: 'PENDING' };
    mockedApi.post.mockResolvedValueOnce({ data: newBooking });

    const dto = {
      providerId: 'p1',
      serviceType: 'Ménage',
      scheduledDate: '2024-07-01',
      scheduledTime: '08:00',
      durationHours: 2,
      paymentMethod: 'CASH' as const,
    };

    let result: any;
    await act(async () => {
      result = await useBookingStore.getState().createBooking(dto);
    });

    expect(result).toEqual(newBooking);
    expect(useBookingStore.getState().bookings[0]).toEqual(newBooking);
    expect(useBookingStore.getState().isLoading).toBe(false);
  });

  it('cancelBooking updates matching booking status to CANCELLED', async () => {
    act(() => {
      useBookingStore.setState({
        bookings: [
          { id: 'b1', status: 'CONFIRMED' } as any,
          { id: 'b2', status: 'CONFIRMED' } as any,
        ],
      });
    });

    mockedApi.patch.mockResolvedValueOnce({});

    await act(async () => {
      await useBookingStore.getState().cancelBooking('b1');
    });

    const bookings = useBookingStore.getState().bookings;
    expect(bookings.find((b) => b.id === 'b1')?.status).toBe('CANCELLED');
    expect(bookings.find((b) => b.id === 'b2')?.status).toBe('CONFIRMED');
  });
});

// ---------------------------------------------------------------------------
// authStore
// ---------------------------------------------------------------------------

describe('authStore', () => {
  const initialState = {
    firebaseUser: null,
    user: null,
    isLoading: false,
    isInitialized: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.setState(initialState);
    });
  });

  it('has correct initial state', () => {
    const { firebaseUser, user, isLoading, isInitialized } =
      useAuthStore.getState();
    expect(firebaseUser).toBeNull();
    expect(user).toBeNull();
    expect(isLoading).toBe(false);
    expect(isInitialized).toBe(false);
  });

  it('login sets isLoading during execution and clears it after', async () => {
    mockedSignIn.mockResolvedValueOnce({});
    mockedApi.get.mockResolvedValueOnce({ data: { id: 'u1', email: 'test@example.com' } });

    await act(async () => {
      await useAuthStore.getState().login('test@example.com', 'password123');
    });

    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(mockedSignIn).toHaveBeenCalledWith({}, 'test@example.com', 'password123');
  });

  it('login calls fetchProfile and updates user on success', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com', role: 'CLIENT' };
    mockedSignIn.mockResolvedValueOnce({});
    mockedApi.get.mockResolvedValueOnce({ data: mockUser });

    await act(async () => {
      await useAuthStore.getState().login('test@example.com', 'password123');
    });

    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('login resets isLoading on api error', async () => {
    mockedSignIn.mockRejectedValueOnce(new Error('auth/wrong-password'));

    await act(async () => {
      try {
        await useAuthStore.getState().login('x@x.com', 'wrong');
      } catch {
        // expected
      }
    });

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('logout clears user and firebaseUser', async () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 'u1' } as any,
        firebaseUser: { uid: 'fb1' } as any,
      });
    });

    mockedSignOut.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().firebaseUser).toBeNull();
  });

  it('fetchProfile sets user from api', async () => {
    const profile = { id: 'u1', email: 'user@example.com', role: 'CLIENT' };
    mockedApi.get.mockResolvedValueOnce({ data: profile });

    await act(async () => {
      await useAuthStore.getState().fetchProfile();
    });

    expect(useAuthStore.getState().user).toEqual(profile);
  });

  it('fetchProfile sets user to null on api error', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

    await act(async () => {
      await useAuthStore.getState().fetchProfile();
    });

    expect(useAuthStore.getState().user).toBeNull();
  });

  it('register sets isLoading to false after completion', async () => {
    const fbUser = { uid: 'fb-uid-123' };
    mockedCreateUser.mockResolvedValueOnce({ user: fbUser });
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'u1' } });

    const dto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Khadija',
      lastName: 'Alami',
      role: 'CLIENT' as const,
      phone: '+212600000000',
    };

    await act(async () => {
      await useAuthStore.getState().register(dto);
    });

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('register calls createUserWithEmailAndPassword with correct credentials', async () => {
    const fbUser = { uid: 'fb-uid-456' };
    mockedCreateUser.mockResolvedValueOnce({ user: fbUser });
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'u2' } });

    const dto = {
      email: 'another@example.com',
      password: 'secure123',
      firstName: 'Hassan',
      lastName: 'Moussaoui',
      role: 'CLIENT' as const,
      phone: '+212611111111',
    };

    await act(async () => {
      await useAuthStore.getState().register(dto);
    });

    expect(mockedCreateUser).toHaveBeenCalledWith({}, dto.email, dto.password);
  });
});
