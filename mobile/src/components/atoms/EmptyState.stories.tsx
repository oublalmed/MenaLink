import type { Meta, StoryObj } from '@storybook/react-native';
import { EmptyState } from './EmptyState';
import { Text } from 'react-native';
import { Button } from './Button';
import React from 'react';

const meta: Meta<typeof EmptyState> = {
  title: 'Atoms/EmptyState',
  component: EmptyState,
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = { args: { title: 'Aucun résultat', description: 'Aucune donnée disponible.' } };
export const WithIcon: Story = { args: { title: 'Aucune réservation', description: 'Vous n\'avez pas encore de réservation.', icon: React.createElement(Text, { style: { fontSize: 48 } }, '📋') } };
export const WithAction: Story = {
  args: {
    title: 'Aucun prestataire',
    description: 'Modifiez vos filtres pour trouver des prestataires.',
    action: React.createElement(Button, { variant: 'primary', size: 'md', onPress: () => {} }, 'Modifier les filtres'),
  },
};
export const NoDescription: Story = { args: { title: 'Liste vide' } };
