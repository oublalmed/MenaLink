import type { Meta, StoryObj } from '@storybook/react-native';
import { PriceTag } from './PriceTag';

const meta: Meta<typeof PriceTag> = {
  title: 'Atoms/PriceTag',
  component: PriceTag,
};
export default meta;
type Story = StoryObj<typeof PriceTag>;

export const Default: Story = { args: { amount: 120 } };
export const Large: Story = { args: { amount: 250, size: 'lg' } };
export const Badge: Story = { args: { amount: 180, variant: 'badge', size: 'md' } };
export const Small: Story = { args: { amount: 80, size: 'sm' } };
