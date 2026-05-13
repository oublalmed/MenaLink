import type { Meta, StoryObj } from '@storybook/react-native';
import { TransactionItem } from './TransactionItem';

const now = new Date().toISOString();

const meta: Meta<typeof TransactionItem> = {
  title: 'Molecules/TransactionItem',
  component: TransactionItem,
  args: {
    onPress: () => console.log('pressed'),
  },
};
export default meta;

type Story = StoryObj<typeof TransactionItem>;

export const Credit: Story = {
  args: {
    transaction: {
      id: '1',
      type: 'CREDIT',
      amount: 240,
      currency: 'MAD',
      status: 'COMPLETED',
      createdAt: now,
      booking: { serviceType: 'CLEANING' },
    },
  },
};

export const Debit: Story = {
  args: {
    transaction: {
      id: '2',
      type: 'DEBIT',
      amount: 120,
      currency: 'MAD',
      status: 'COMPLETED',
      createdAt: now,
      booking: { serviceType: 'IRONING' },
    },
  },
};

export const Pending: Story = {
  args: {
    transaction: {
      id: '3',
      type: 'CREDIT',
      amount: 360,
      currency: 'MAD',
      status: 'PENDING',
      createdAt: now,
    },
  },
};

export const Failed: Story = {
  args: {
    transaction: {
      id: '4',
      type: 'DEBIT',
      amount: 180,
      currency: 'MAD',
      status: 'FAILED',
      createdAt: now,
    },
  },
};

export const Refund: Story = {
  args: {
    transaction: {
      id: '5',
      type: 'REFUND',
      amount: 120,
      currency: 'MAD',
      status: 'COMPLETED',
      createdAt: now,
    },
  },
};
