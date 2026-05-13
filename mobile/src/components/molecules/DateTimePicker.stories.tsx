import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { DateTimePicker } from './DateTimePicker';

const meta: Meta<typeof DateTimePicker> = {
  title: 'Molecules/DateTimePicker',
  component: DateTimePicker,
};
export default meta;

type Story = StoryObj<typeof DateTimePicker>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<string | undefined>();
    const [time, setTime] = useState<string | undefined>();
    return (
      <DateTimePicker
        selectedDate={date}
        selectedTime={time}
        onDateChange={setDate}
        onTimeChange={setTime}
      />
    );
  },
};

export const WithAvailableSlots: Story = {
  render: () => {
    const today = new Date();
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const d1 = new Date(today); d1.setDate(today.getDate() + 1);
    const d2 = new Date(today); d2.setDate(today.getDate() + 2);

    const [date, setDate] = useState<string | undefined>();
    const [time, setTime] = useState<string | undefined>();

    return (
      <DateTimePicker
        selectedDate={date}
        selectedTime={time}
        onDateChange={setDate}
        onTimeChange={setTime}
        availableSlots={[
          { date: fmt(d1), times: ['09:00', '10:00', '10:30', '14:00', '15:00'] },
          { date: fmt(d2), times: ['08:00', '08:30', '13:00', '16:30'] },
        ]}
      />
    );
  },
};

export const PreSelected: Story = {
  render: () => {
    const [date, setDate] = useState('2025-12-15');
    const [time, setTime] = useState('10:00');
    return (
      <DateTimePicker
        selectedDate={date}
        selectedTime={time}
        onDateChange={setDate}
        onTimeChange={setTime}
      />
    );
  },
};
