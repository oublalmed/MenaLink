import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  args: {
    label: 'Email',
    placeholder: 'votre@email.com',
    value: '',
    type: 'text',
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <Input {...args} value={value} onChangeText={setValue} />;
  },
};

export const WithError: Story = {
  args: { error: 'Email invalide', value: 'bad-email', label: 'Email' },
  render: (args) => <Input {...args} onChangeText={() => {}} />,
};

export const Password: Story = {
  args: { label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
  render: (args) => {
    const [value, setValue] = useState('');
    return <Input {...args} value={value} onChangeText={setValue} />;
  },
};

export const Phone: Story = {
  args: { label: 'Téléphone', type: 'phone', placeholder: '+212 6 XX XX XX XX' },
  render: (args) => {
    const [value, setValue] = useState('');
    return <Input {...args} value={value} onChangeText={setValue} />;
  },
};

export const Disabled: Story = {
  args: { label: 'Champ désactivé', disabled: true, value: 'Valeur fixe' },
  render: (args) => <Input {...args} onChangeText={() => {}} />,
};

export const Multiline: Story = {
  args: { label: 'Message', placeholder: 'Votre message…', multiline: true, numberOfLines: 4 },
  render: (args) => {
    const [value, setValue] = useState('');
    return <Input {...args} value={value} onChangeText={setValue} />;
  },
};
