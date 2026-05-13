import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { SearchBar } from './SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'Organisms/SearchBar',
  component: SearchBar,
  args: {
    placeholder: 'Rechercher un quartier, une ville…',
    onSubmit: (t: string) => console.log('submit:', t),
  },
};
export default meta;

type Story = StoryObj<typeof SearchBar>;

export const Empty: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <SearchBar {...args} value={value} onChangeText={setValue} />;
  },
};

export const WithText: Story = {
  render: (args) => {
    const [value, setValue] = useState('Casablanca');
    return <SearchBar {...args} value={value} onChangeText={setValue} />;
  },
};

export const WithSuggestions: Story = {
  render: (args) => {
    const [value, setValue] = useState('Casa');
    return (
      <SearchBar
        {...args}
        value={value}
        onChangeText={setValue}
        suggestions={[
          { id: '1', label: 'Casablanca', type: 'city' },
          { id: '2', label: 'Casablanca — Maarif', type: 'neighborhood' },
          { id: '3', label: 'Casablanca — Ain Diab', type: 'neighborhood' },
          { id: '4', label: '25, Bd Rachidi, Casablanca', type: 'address' },
        ]}
        onSelectSuggestion={(s) => {
          setValue(s.label);
          console.log('selected:', s);
        }}
      />
    );
  },
};

export const CustomPlaceholder: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <SearchBar
        {...args}
        value={value}
        onChangeText={setValue}
        placeholder="Votre adresse…"
      />
    );
  },
};
