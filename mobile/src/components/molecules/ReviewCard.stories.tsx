import type { Meta, StoryObj } from '@storybook/react-native';
import { ReviewCard } from './ReviewCard';

const mockReview = {
  id: '1',
  rating: 5,
  comment: 'Excellent travail, très professionnel et ponctuel. Je recommande vivement !',
  createdAt: '2025-11-20T10:30:00Z',
  client: {
    firstName: 'Mohammed',
    lastName: 'Alami',
  },
};

const meta: Meta<typeof ReviewCard> = {
  title: 'Molecules/ReviewCard',
  component: ReviewCard,
  args: {
    review: mockReview,
    showDate: false,
  },
};
export default meta;

type Story = StoryObj<typeof ReviewCard>;

export const Default: Story = {};

export const WithDate: Story = {
  args: { showDate: true },
};

export const LowRating: Story = {
  args: {
    review: {
      ...mockReview,
      id: '2',
      rating: 2,
      comment: 'Travail moyen, quelques détails manqués.',
    },
    showDate: true,
  },
};

export const NoComment: Story = {
  args: {
    review: { ...mockReview, id: '3', comment: undefined },
    showDate: true,
  },
};

export const WithAvatar: Story = {
  args: {
    review: {
      ...mockReview,
      client: { ...mockReview.client, avatarUrl: 'https://i.pravatar.cc/150?img=12' },
    },
    showDate: true,
  },
};
