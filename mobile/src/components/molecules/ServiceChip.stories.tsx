import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { ServiceChip, ServiceType } from './ServiceChip';

const meta: Meta<typeof ServiceChip> = {
  title: 'Molecules/ServiceChip',
  component: ServiceChip,
  args: { service: 'CLEANING', selected: false },
};
export default meta;

type Story = StoryObj<typeof ServiceChip>;

export const Cleaning: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Ironing: Story = {
  args: { service: 'IRONING' },
};

export const DeepCleaning: Story = {
  args: { service: 'DEEP_CLEANING', selected: true },
};

export const AllServices: Story = {
  render: () => {
    const all: ServiceType[] = [
      'CLEANING',
      'IRONING',
      'DEEP_CLEANING',
      'POST_CONSTRUCTION',
      'COOKING',
    ];
    const [selected, setSelected] = useState<ServiceType[]>([]);
    const toggle = (s: ServiceType) =>
      setSelected((prev) =>
        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
      );
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {all.map((s) => (
          <ServiceChip
            key={s}
            service={s}
            selected={selected.includes(s)}
            onPress={() => toggle(s)}
          />
        ))}
      </View>
    );
  },
};
