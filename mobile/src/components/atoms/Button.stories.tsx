import type { Meta, StoryObj } from '@storybook/react-native';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  args: {
    children: 'Bouton',
    variant: 'primary',
    size: 'md',
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondaire' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'Contour' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Supprimer' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Annuler' },
};

export const Loading: Story = {
  args: { loading: true, children: 'Chargement…' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Désactivé' },
};

export const Small: Story = {
  args: { size: 'sm', children: 'Petit' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Grand' },
};

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Pleine largeur' },
};
