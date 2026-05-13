import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { MapMarker } from './MapMarker';

const provider = {
  id: '1',
  firstName: 'Fatima',
  lastName: 'Zahra',
  averageRating: 4.7,
  pricePerHour: 80,
};

const meta: Meta<typeof MapMarker> = {
  title: 'Molecules/MapMarker',
  component: MapMarker,
  args: { provider },
  decorators: [
    (Story) => (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <Story />
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MapMarker>;

export const Default: Story = {};

export const Selected: Story = {
  args: { isSelected: true },
};

export const HighPrice: Story = {
  args: {
    provider: { ...provider, firstName: 'Youssef', pricePerHour: 150 },
    isSelected: false,
  },
};

export const BothSideBySide: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24 }}>
      <MapMarker provider={provider} isSelected={false} />
      <MapMarker provider={provider} isSelected={true} />
    </View>
  ),
};
