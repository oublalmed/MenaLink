import type { Meta, StoryObj } from '@storybook/react-native';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  args: {
    firstName: 'Fatima',
    lastName: 'Zahra',
    size: 'md',
  },
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    uri: 'https://i.pravatar.cc/150?img=47',
  },
};

export const Online: Story = {
  args: { size: 'lg', statusBadge: 'online' },
};

export const Busy: Story = {
  args: { size: 'lg', statusBadge: 'busy' },
};

export const Offline: Story = {
  args: { size: 'lg', statusBadge: 'offline' },
};

export const ExtraSmall: Story = {
  args: { size: 'xs' },
};

export const ExtraLarge: Story = {
  args: { size: 'xl', firstName: 'Youssef', lastName: 'Benjelloun', statusBadge: 'online' },
};
