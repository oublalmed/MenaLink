import type { Meta, StoryObj } from '@storybook/react-native';
import { ProviderCard } from './ProviderCard';

const mockProvider = {
  id: '1',
  firstName: 'Fatima',
  lastName: 'Zahra',
  averageRating: 4.7,
  totalReviews: 128,
  hourlyRateMin: 80,
  hourlyRateMax: 120,
  services: ['CLEANING' as const, 'IRONING' as const],
  isVerified: true,
};

const meta: Meta<typeof ProviderCard> = {
  title: 'Molecules/ProviderCard',
  component: ProviderCard,
  args: {
    provider: mockProvider,
    onPress: () => console.log('pressed'),
  },
};
export default meta;

type Story = StoryObj<typeof ProviderCard>;

export const Default: Story = {};

export const WithDistance: Story = {
  args: { distanceKm: 1.4 },
};

export const WithBookButton: Story = {
  args: {
    distanceKm: 2.8,
    onBook: () => console.log('book'),
  },
};

export const WithAvatar: Story = {
  args: {
    provider: {
      ...mockProvider,
      avatarUrl: 'https://i.pravatar.cc/150?img=47',
    },
    distanceKm: 0.8,
    onBook: () => {},
  },
};
