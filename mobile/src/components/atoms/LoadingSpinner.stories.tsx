import type { Meta, StoryObj } from '@storybook/react-native';
import { LoadingSpinner } from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Atoms/LoadingSpinner',
  component: LoadingSpinner,
  args: { size: 'large' },
};
export default meta;

type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'small' },
};

export const WithLabel: Story = {
  args: { label: 'Chargement en cours…' },
};

export const CustomColor: Story = {
  args: { color: '#E67E22', label: 'Traitement…' },
};

// Note: overlay story intentionally omitted from default storybook
// as it renders a Modal that would block the preview.
