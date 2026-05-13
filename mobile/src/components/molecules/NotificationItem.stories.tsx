import type { Meta, StoryObj } from '@storybook/react-native';
import { NotificationItem } from './NotificationItem';

const now = new Date().toISOString();
const anHourAgo = new Date(Date.now() - 3600000).toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();

const meta: Meta<typeof NotificationItem> = {
  title: 'Molecules/NotificationItem',
  component: NotificationItem,
  args: {
    onPress: () => console.log('pressed'),
  },
};
export default meta;

type Story = StoryObj<typeof NotificationItem>;

export const Unread: Story = {
  args: {
    notification: {
      id: '1',
      title: 'Nouvelle réservation',
      body: 'Mohammed Alami a réservé un service de ménage pour lundi.',
      type: 'BOOKING_NEW',
      isRead: false,
      createdAt: anHourAgo,
    },
  },
};

export const Read: Story = {
  args: {
    notification: {
      id: '2',
      title: 'Réservation confirmée',
      body: 'Votre réservation du 15 déc. a été confirmée par Fatima Zahra.',
      type: 'BOOKING_CONFIRMED',
      isRead: true,
      createdAt: yesterday,
    },
  },
};

export const PaymentSuccess: Story = {
  args: {
    notification: {
      id: '3',
      title: 'Paiement reçu',
      body: 'Vous avez reçu un paiement de 240 MAD.',
      type: 'PAYMENT_SUCCESS',
      isRead: false,
      createdAt: now,
    },
  },
};

export const ReviewReceived: Story = {
  args: {
    notification: {
      id: '4',
      title: 'Nouvel avis',
      body: 'Karim Benali vous a laissé un avis 5 étoiles !',
      type: 'REVIEW_RECEIVED',
      isRead: true,
      createdAt: yesterday,
    },
  },
};
