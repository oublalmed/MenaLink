import type { Meta, StoryObj } from '@storybook/react-native';
import { ProviderList } from './ProviderList';

const mockProviders = [
  {
    id: '1',
    firstName: 'Fatima',
    lastName: 'Zahra',
    averageRating: 4.8,
    totalReviews: 142,
    hourlyRateMin: 80,
    hourlyRateMax: 120,
    services: ['Ménage', 'Repassage'],
    isAvailable: true,
  },
  {
    id: '2',
    firstName: 'Youssef',
    lastName: 'Benjelloun',
    averageRating: 4.5,
    totalReviews: 63,
    hourlyRateMin: 60,
    hourlyRateMax: 90,
    services: ['Grand nettoyage'],
    isAvailable: true,
  },
  {
    id: '3',
    firstName: 'Khadija',
    lastName: 'Mansouri',
    averageRating: 4.9,
    totalReviews: 217,
    hourlyRateMin: 100,
    hourlyRateMax: 150,
    services: ['Ménage', 'Post-travaux'],
    isAvailable: false,
  },
];

const meta: Meta<typeof ProviderList> = {
  title: 'Organisms/ProviderList',
  component: ProviderList,
  args: {
    onPressProvider: () => console.log('press'),
    onBookProvider: () => console.log('book'),
  },
};
export default meta;

type Story = StoryObj<typeof ProviderList>;

export const WithProviders: Story = {
  args: { providers: mockProviders },
};

export const Loading: Story = {
  args: { providers: [], loading: true },
};

export const Empty: Story = {
  args: { providers: [] },
};

export const CustomEmptyMessage: Story = {
  args: {
    providers: [],
    emptyMessage: 'Aucun prestataire disponible dans cette zone.',
  },
};
