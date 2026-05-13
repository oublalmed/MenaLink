import type { Meta, StoryObj } from '@storybook/react-native';
import { BookingTimeline } from './BookingTimeline';

const now = new Date();
const t = (offsetMin: number) => new Date(now.getTime() - offsetMin * 60000).toISOString();

const meta: Meta<typeof BookingTimeline> = {
  title: 'Organisms/BookingTimeline',
  component: BookingTimeline,
};
export default meta;

type Story = StoryObj<typeof BookingTimeline>;

export const Pending: Story = {
  args: {
    booking: {
      status: 'PENDING',
      createdAt: t(120),
    },
  },
};

export const Confirmed: Story = {
  args: {
    booking: {
      status: 'CONFIRMED',
      createdAt: t(180),
      confirmedAt: t(160),
    },
  },
};

export const InProgress: Story = {
  args: {
    booking: {
      status: 'IN_PROGRESS',
      createdAt: t(300),
      confirmedAt: t(280),
      startedAt: t(10),
    },
  },
};

export const Completed: Story = {
  args: {
    booking: {
      status: 'COMPLETED',
      createdAt: t(480),
      confirmedAt: t(460),
      startedAt: t(240),
      completedAt: t(60),
    },
  },
};

export const Cancelled: Story = {
  args: {
    booking: {
      status: 'CANCELLED',
      createdAt: t(200),
      cancelledAt: t(120),
    },
  },
};
