import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { ProviderMap } from './ProviderMap';
import React, { useState } from 'react';

const mockProviders = [
  {
    id: '1',
    firstName: 'Fatima',
    lastName: 'Zahra',
    averageRating: 4.8,
    pricePerHour: 80,
    latitude: 33.5731,
    longitude: -7.5898,
  },
  {
    id: '2',
    firstName: 'Youssef',
    lastName: 'Benjelloun',
    averageRating: 4.5,
    pricePerHour: 65,
    latitude: 33.578,
    longitude: -7.592,
  },
  {
    id: '3',
    firstName: 'Khadija',
    lastName: 'Mansouri',
    averageRating: 4.9,
    pricePerHour: 100,
    latitude: 33.569,
    longitude: -7.585,
  },
];

const meta: Meta<typeof ProviderMap> = {
  title: 'Organisms/ProviderMap',
  component: ProviderMap,
};
export default meta;

type Story = StoryObj<typeof ProviderMap>;

export const Default: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | undefined>();
    return (
      <View style={{ height: 350 }}>
        <ProviderMap
          providers={mockProviders}
          selectedProviderId={selectedId}
          onSelectProvider={setSelectedId}
          userLocation={{ lat: 33.575, lng: -7.588 }}
        />
      </View>
    );
  },
};

export const WithSelection: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string>('1');
    return (
      <View style={{ height: 350 }}>
        <ProviderMap
          providers={mockProviders}
          selectedProviderId={selectedId}
          onSelectProvider={setSelectedId}
        />
      </View>
    );
  },
};

export const EmptyMap: Story = {
  render: () => (
    <View style={{ height: 350 }}>
      <ProviderMap
        providers={[]}
        onSelectProvider={() => {}}
      />
    </View>
  ),
};
