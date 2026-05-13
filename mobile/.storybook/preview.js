import React from 'react';
import { View } from 'react-native';
import { COLORS } from '../src/theme';

export const decorators = [
  (Story) => (
    <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 16 }}>
      <Story />
    </View>
  ),
];

export const parameters = {
  controls: { matchers: { color: /(background|color)$/i } },
};
