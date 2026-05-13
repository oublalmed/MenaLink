import type { Meta, StoryObj } from '@storybook/react-native';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  args: { label: 'Confirmé', variant: 'success', size: 'md' },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Success: Story = {};

export const Warning: Story = {
  args: { label: 'En attente', variant: 'warning' },
};

export const Danger: Story = {
  args: { label: 'Annulé', variant: 'danger' },
};

export const Info: Story = {
  args: { label: 'Nouveau', variant: 'info' },
};

export const Neutral: Story = {
  args: { label: 'Brouillon', variant: 'neutral' },
};

export const Small: Story = {
  args: { label: 'Payé', variant: 'success', size: 'sm' },
};
