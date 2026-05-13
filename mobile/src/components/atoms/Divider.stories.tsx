import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Atoms/Divider',
  component: Divider,
  args: { orientation: 'horizontal' },
};
export default meta;

type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {};

export const WithLabel: Story = {
  args: { label: 'ou' },
};

export const Vertical: Story = {
  render: () => (
    <View style={{ height: 40, flexDirection: 'row', alignItems: 'stretch' }}>
      <Divider orientation="vertical" />
    </View>
  ),
};

export const Thick: Story = {
  args: { thickness: 3, color: '#2980B9' },
};
