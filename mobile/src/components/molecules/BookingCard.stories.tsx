import type { Meta, StoryObj } from '@storybook/react-native';
import { BookingCard } from './BookingCard';

const baseBooking = {
  id: '1',
  serviceType: 'CLEANING' as const,
  status: 'PENDING' as const,
  scheduledDate: '2025-12-15',
  scheduledTime: '10:00',
  totalAmount: 240,
  provider: { firstName: 'Fatima', lastName: 'Zahra' },
};

const meta: Meta<typeof BookingCard> = {
  title: 'Molecules/BookingCard',
  component: BookingCard,
  args: {
    booking: baseBooking,
    userRole: 'CLIENT',
    onPress: () => console.log('pressed'),
  },
};
export default meta;

type Story = StoryObj<typeof BookingCard>;

export const Pending: Story = {};

export const Confirmed: Story = {
  args: {
    booking: { ...baseBooking, status: 'CONFIRMED' },
  },
};

export const Completed: Story = {
  args: {
    booking: { ...baseBooking, status: 'COMPLETED', scheduledDate: '2025-11-10' },
  },
};

export const Cancelled: Story = {
  args: {
    booking: { ...baseBooking, status: 'CANCELLED' },
  },
};

export const ProviderView: Story = {
  args: {
    booking: {
      ...baseBooking,
      status: 'CONFIRMED',
      client: { firstName: 'Mohammed', lastName: 'Alami' },
    },
    userRole: 'PROVIDER',
  },
};
