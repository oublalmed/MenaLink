import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { FilterBottomSheet } from './FilterBottomSheet';
import { Button } from '../atoms/Button';

const meta: Meta<typeof FilterBottomSheet> = {
  title: 'Organisms/FilterBottomSheet',
  component: FilterBottomSheet,
};
export default meta;

type Story = StoryObj<typeof FilterBottomSheet>;

export const Default: Story = {
  render: () => {
    const [visible, setVisible] = useState(false);
    return (
      <View style={{ padding: 16 }}>
        <Button variant="primary" onPress={() => setVisible(true)}>
          Ouvrir les filtres
        </Button>
        <FilterBottomSheet
          visible={visible}
          onClose={() => setVisible(false)}
          onApply={(f) => {
            console.log('Applied filters:', f);
            setVisible(false);
          }}
        />
      </View>
    );
  },
};

export const WithInitialFilters: Story = {
  render: () => {
    const [visible, setVisible] = useState(false);
    return (
      <View style={{ padding: 16 }}>
        <Button variant="primary" onPress={() => setVisible(true)}>
          Filtres pré-remplis
        </Button>
        <FilterBottomSheet
          visible={visible}
          onClose={() => setVisible(false)}
          onApply={(f) => {
            console.log('Applied:', f);
            setVisible(false);
          }}
          initialFilters={{
            services: ['CLEANING', 'IRONING'],
            maxPrice: 200,
            minRating: 4,
            radiusKm: 15,
          }}
        />
      </View>
    );
  },
};
