import type { Meta, StoryObj } from '@storybook/react-native';
import { StarRating } from './StarRating';

const meta: Meta<typeof StarRating> = {
  title: 'Atoms/StarRating',
  component: StarRating,
};
export default meta;
type Story = StoryObj<typeof StarRating>;

export const FiveStars: Story = { args: { value: 5, readonly: true } };
export const ThreeAndHalf: Story = { args: { value: 3.5, readonly: true, showLabel: true } };
export const Interactive: Story = { args: { value: 3, readonly: false, size: 28 } };
export const WithLabel: Story = { args: { value: 4.2, showLabel: true, size: 18 } };
