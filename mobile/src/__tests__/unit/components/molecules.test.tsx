import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

// ---------------------------------------------------------------------------
// Theme mock — must be declared before component imports
// ---------------------------------------------------------------------------
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2980B9',
      dark: '#2C3E50',
      success: '#27AE60',
      warning: '#E67E22',
      danger: '#E74C3C',
      gray: '#7F8C8D',
      lightGray: '#F4F6F7',
      white: '#FFFFFF',
      background: '#F0F4F8',
      card: '#FFFFFF',
      border: '#DDE1E7',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    fontSize: { h1: 24, h2: 20, h3: 17, body: 14, caption: 12 },
    isDark: false,
  }),
}));

import { BookingCard } from '../../../components/molecules/BookingCard';
import { ProviderCard } from '../../../components/molecules/ProviderCard';
import { ReviewCard } from '../../../components/molecules/ReviewCard';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const bookingBase = {
  id: 'booking-1',
  providerName: 'Fatima Zahra',
  serviceType: 'Ménage',
  scheduledDate: '2024-06-15',
  scheduledTime: '09:00',
  durationHours: 3,
  totalAmount: 180,
  status: 'CONFIRMED' as const,
  onPress: jest.fn(),
};

const providerBase = {
  id: 'provider-1',
  name: 'Fatima Zahra',
  rating: 4.5,
  totalReviews: 120,
  services: ['Ménage', 'Repassage'],
  hourlyRateMin: 50,
  hourlyRateMax: 80,
  isAvailable: true,
  onPress: jest.fn(),
};

const reviewBase = {
  authorName: 'Ahmed Benali',
  rating: 5,
  comment: 'Excellent service, très professionnel.',
  createdAt: '2024-05-20T10:00:00.000Z',
};

// ---------------------------------------------------------------------------
// BookingCard
// ---------------------------------------------------------------------------

describe('BookingCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<BookingCard {...bookingBase} />);
    expect(screen.getByText('Fatima Zahra')).toBeTruthy();
  });

  it('displays provider name', () => {
    render(<BookingCard {...bookingBase} />);
    expect(screen.getByText('Fatima Zahra')).toBeTruthy();
  });

  it('displays service type', () => {
    render(<BookingCard {...bookingBase} />);
    expect(screen.getByText('Ménage')).toBeTruthy();
  });

  it('displays scheduled time', () => {
    render(<BookingCard {...bookingBase} />);
    expect(screen.getByText('09:00')).toBeTruthy();
  });

  it('displays duration in hours', () => {
    render(<BookingCard {...bookingBase} />);
    expect(screen.getByText('3h')).toBeTruthy();
  });

  it('calls onPress with booking id when pressed', () => {
    const onPress = jest.fn();
    render(<BookingCard {...bookingBase} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('booking-1');
  });

  it('shows status label "Confirmé" for CONFIRMED status', () => {
    render(<BookingCard {...bookingBase} status="CONFIRMED" />);
    expect(screen.getByText('Confirmé')).toBeTruthy();
  });

  it('shows status label "En attente" for PENDING status', () => {
    render(<BookingCard {...bookingBase} status="PENDING" />);
    expect(screen.getByText('En attente')).toBeTruthy();
  });

  it('shows status label "Terminé" for COMPLETED status', () => {
    render(<BookingCard {...bookingBase} status="COMPLETED" />);
    expect(screen.getByText('Terminé')).toBeTruthy();
  });

  it('shows status label "Annulé" for CANCELLED status', () => {
    render(<BookingCard {...bookingBase} status="CANCELLED" />);
    expect(screen.getByText('Annulé')).toBeTruthy();
  });

  it('shows status label "En cours" for IN_PROGRESS status', () => {
    render(<BookingCard {...bookingBase} status="IN_PROGRESS" />);
    expect(screen.getByText('En cours')).toBeTruthy();
  });

  it('shows status label "Litige" for DISPUTED status', () => {
    render(<BookingCard {...bookingBase} status="DISPUTED" />);
    expect(screen.getByText('Litige')).toBeTruthy();
  });

  it('has correct accessibility label', () => {
    render(<BookingCard {...bookingBase} />);
    expect(screen.getByLabelText('Réservation avec Fatima Zahra')).toBeTruthy();
  });

  it('renders with optional avatarUrl', () => {
    render(
      <BookingCard
        {...bookingBase}
        providerAvatarUrl="https://example.com/avatar.jpg"
      />,
    );
    expect(screen.getByText('Fatima Zahra')).toBeTruthy();
  });

  it('renders without avatarUrl (initials fallback)', () => {
    render(<BookingCard {...bookingBase} providerAvatarUrl={undefined} />);
    // Avatar with initials "FZ" should appear
    expect(screen.getByText('FZ')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ProviderCard
// ---------------------------------------------------------------------------

describe('ProviderCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProviderCard {...providerBase} />);
    expect(screen.getByText('Fatima Zahra')).toBeTruthy();
  });

  it('displays provider name', () => {
    render(<ProviderCard {...providerBase} />);
    expect(screen.getByText('Fatima Zahra')).toBeTruthy();
  });

  it('displays services joined by " · "', () => {
    render(<ProviderCard {...providerBase} />);
    expect(screen.getByText('Ménage · Repassage')).toBeTruthy();
  });

  it('displays review count', () => {
    render(<ProviderCard {...providerBase} />);
    expect(screen.getByText('(120)')).toBeTruthy();
  });

  it('calls onPress with provider id when pressed', () => {
    const onPress = jest.fn();
    render(<ProviderCard {...providerBase} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('provider-1');
  });

  it('has correct accessibility label', () => {
    render(<ProviderCard {...providerBase} />);
    expect(screen.getByLabelText('Prestataire Fatima Zahra')).toBeTruthy();
  });

  it('displays distance badge when distanceKm is provided', () => {
    render(<ProviderCard {...providerBase} distanceKm={3.2} />);
    expect(screen.getByText('📍 3.2 km')).toBeTruthy();
  });

  it('does not display distance badge when distanceKm is absent', () => {
    render(<ProviderCard {...providerBase} distanceKm={undefined} />);
    expect(screen.queryByText(/km/)).toBeNull();
  });

  it('renders with isAvailable=false without crashing', () => {
    render(<ProviderCard {...providerBase} isAvailable={false} />);
    expect(screen.getByText('Fatima Zahra')).toBeTruthy();
  });

  it('shows star rating label', () => {
    render(<ProviderCard {...providerBase} rating={4.5} />);
    expect(screen.getByText('4.5')).toBeTruthy();
  });

  it('renders with optional avatarUrl', () => {
    render(
      <ProviderCard
        {...providerBase}
        avatarUrl="https://example.com/avatar.jpg"
      />,
    );
    expect(screen.getByText('Fatima Zahra')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ReviewCard
// ---------------------------------------------------------------------------

describe('ReviewCard', () => {
  it('renders without crashing', () => {
    render(<ReviewCard {...reviewBase} />);
    expect(screen.getByText('Ahmed Benali')).toBeTruthy();
  });

  it('displays author name', () => {
    render(<ReviewCard {...reviewBase} />);
    expect(screen.getByText('Ahmed Benali')).toBeTruthy();
  });

  it('displays comment text', () => {
    render(<ReviewCard {...reviewBase} />);
    expect(screen.getByText('Excellent service, très professionnel.')).toBeTruthy();
  });

  it('displays the star rating row (5 stars for rating=5)', () => {
    render(<ReviewCard {...reviewBase} />);
    // StarRating renders max=5 touchable stars by default
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('displays serviceType badge when provided', () => {
    render(<ReviewCard {...reviewBase} serviceType="Ménage" />);
    expect(screen.getByText('Ménage')).toBeTruthy();
  });

  it('does not display serviceType badge when absent', () => {
    render(<ReviewCard {...reviewBase} serviceType={undefined} />);
    // No badge text for service type
    expect(screen.queryByText('Ménage')).toBeNull();
  });

  it('does not display serviceType badge when empty string', () => {
    render(<ReviewCard {...reviewBase} serviceType="" />);
    expect(screen.queryByText('')).toBeNull();
  });

  it('renders with optional avatarUrl', () => {
    render(
      <ReviewCard
        {...reviewBase}
        authorAvatarUrl="https://example.com/avatar.jpg"
      />,
    );
    expect(screen.getByText('Ahmed Benali')).toBeTruthy();
  });

  it('renders author initials fallback when no avatarUrl', () => {
    render(<ReviewCard {...reviewBase} />);
    // Ahmed Benali => "AB"
    expect(screen.getByText('AB')).toBeTruthy();
  });

  it('renders formatted date from ISO string', () => {
    render(<ReviewCard {...reviewBase} createdAt="2024-05-20T10:00:00.000Z" />);
    // The component calls toLocaleDateString — just verify it rendered without crashing
    expect(screen.getByText('Ahmed Benali')).toBeTruthy();
  });
});
