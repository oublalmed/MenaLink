import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'Atoms/Chip',
  component: Chip,
  args: { label: 'Ménage', icon: '🧹' },
};
export default meta;

type Story = StoryObj<typeof Chip>;

export const Unselected: Story = {
  args: { selected: false },
};

export const Selected: Story = {
  args: { selected: true },
};

export const WithoutIcon: Story = {
  args: { label: 'Repassage', icon: undefined },
};

export const Disabled: Story = {
  args: { label: 'Indisponible', disabled: true, selected: false },
};

export const Toggle: Story = {
  render: (args) => {
    const [selected, setSelected] = useState(false);
    return (
      <Chip
        {...args}
        selected={selected}
        onPress={() => setSelected((s) => !s)}
      />
    );
  },
};

export const Group: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    const items = [
      { label: 'Ménage', icon: '🧹' },
      { label: 'Repassage', icon: '👔' },
      { label: 'Cuisine', icon: '🍳' },
    ];
    const toggle = (label: string) =>
      setSelected((s) =>
        s.includes(label) ? s.filter((x) => x !== label) : [...s, label],
      );
    return (
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {items.map((item) => (
          <Chip
            key={item.label}
            label={item.label}
            icon={item.icon}
            selected={selected.includes(item.label)}
            onPress={() => toggle(item.label)}
          />
        ))}
      </View>
    );
  },
};
