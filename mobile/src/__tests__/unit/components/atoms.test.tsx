import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

// Mock the theme hook so components work without Expo native modules
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2980B9',
      dark: '#2C3E50',
      success: '#27AE60',
      warning: '#E67E22',
      danger: '#E74C3C',
      gray: '#7F8C8D',
      lightGray: '#F4F6F7',
      white: '#FFFFFF',
      background: '#F0F4F8',
      card: '#FFFFFF',
      border: '#DDE1E7',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    fontSize: { h1: 24, h2: 20, h3: 17, body: 14, caption: 12 },
    isDark: false,
  }),
}));

import { Button } from '../../../components/atoms/Button';
import { Input } from '../../../components/atoms/Input';
import { Badge } from '../../../components/atoms/Badge';
import { Avatar } from '../../../components/atoms/Avatar';
import { StarRating } from '../../../components/atoms/StarRating';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Réserver</Button>);
    expect(screen.getByText('Réserver')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Appuyer</Button>);
    fireEvent.press(screen.getByText('Appuyer'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows ActivityIndicator when loading is true', () => {
    render(<Button loading>Chargement</Button>);
    // When loading, label is replaced by ActivityIndicator — text should not be visible
    expect(screen.queryByText('Chargement')).toBeNull();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button disabled onPress={onPress}>Désactivé</Button>);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(<Button loading onPress={onPress}>Chargement</Button>);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with variant "outline"', () => {
    render(<Button variant="outline">Contour</Button>);
    expect(screen.getByText('Contour')).toBeTruthy();
  });

  it('renders with variant "danger"', () => {
    render(<Button variant="danger">Supprimer</Button>);
    expect(screen.getByText('Supprimer')).toBeTruthy();
  });

  it('renders with variant "ghost"', () => {
    render(<Button variant="ghost">Fantôme</Button>);
    expect(screen.getByText('Fantôme')).toBeTruthy();
  });

  it('renders with size "sm"', () => {
    render(<Button size="sm">Petit</Button>);
    expect(screen.getByText('Petit')).toBeTruthy();
  });

  it('renders with size "lg"', () => {
    render(<Button size="lg">Grand</Button>);
    expect(screen.getByText('Grand')).toBeTruthy();
  });

  it('renders a left icon', () => {
    render(
      <Button leftIcon={<Text testID="left-icon">◀</Text>}>Avec icône</Button>,
    );
    expect(screen.getByTestId('left-icon')).toBeTruthy();
    expect(screen.getByText('Avec icône')).toBeTruthy();
  });

  it('renders a right icon', () => {
    render(
      <Button rightIcon={<Text testID="right-icon">▶</Text>}>Avec icône</Button>,
    );
    expect(screen.getByTestId('right-icon')).toBeTruthy();
  });

  it('has correct accessibility role', () => {
    render(<Button>Accessibilité</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('has disabled accessibility state when disabled', () => {
    render(<Button disabled>Désactivé</Button>);
    expect(screen.getByRole('button', { disabled: true })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input value="" onChangeText={jest.fn()} />);
    expect(screen.getByRole('none')).toBeTruthy(); // TextInput
  });

  it('renders with a label', () => {
    render(<Input label="Email" value="" onChangeText={jest.fn()} />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('displays placeholder text', () => {
    render(
      <Input value="" onChangeText={jest.fn()} placeholder="votre@email.com" />,
    );
    expect(screen.getByPlaceholderText('votre@email.com')).toBeTruthy();
  });

  it('calls onChangeText when user types', () => {
    const onChangeText = jest.fn();
    render(<Input value="" onChangeText={onChangeText} label="Nom" />);
    fireEvent.changeText(screen.getByLabelText('Nom'), 'Fatima');
    expect(onChangeText).toHaveBeenCalledWith('Fatima');
  });

  it('shows error message when error prop is set', () => {
    render(
      <Input value="" onChangeText={jest.fn()} error="Champ requis" />,
    );
    expect(screen.getByText('Champ requis')).toBeTruthy();
  });

  it('does not show error message when error is empty', () => {
    render(<Input value="" onChangeText={jest.fn()} error="" />);
    expect(screen.queryByText('')).toBeNull();
  });

  it('renders password visibility toggle for type="password"', () => {
    render(<Input value="secret" onChangeText={jest.fn()} type="password" />);
    // Toggle button labelled "Afficher le mot de passe" should be present
    expect(screen.getByLabelText('Afficher le mot de passe')).toBeTruthy();
  });

  it('toggles password visibility when toggle button is pressed', () => {
    render(<Input value="secret" onChangeText={jest.fn()} type="password" />);
    const toggleBtn = screen.getByLabelText('Afficher le mot de passe');
    fireEvent.press(toggleBtn);
    expect(screen.getByLabelText('Masquer le mot de passe')).toBeTruthy();
  });

  it('renders prefix icon', () => {
    render(
      <Input
        value=""
        onChangeText={jest.fn()}
        prefixIcon={<Text testID="prefix">🔍</Text>}
      />,
    );
    expect(screen.getByTestId('prefix')).toBeTruthy();
  });

  it('is not editable when disabled', () => {
    render(<Input value="" onChangeText={jest.fn()} disabled label="Champ" />);
    const input = screen.getByLabelText('Champ');
    expect(input.props.editable).toBe(false);
  });

  it('renders multiline input when multiline=true', () => {
    render(
      <Input value="" onChangeText={jest.fn()} multiline numberOfLines={4} />,
    );
    // We just assert the component renders without crashing
    const inputs = screen.getAllByRole('none');
    expect(inputs.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

describe('Badge', () => {
  it('renders with label text', () => {
    render(<Badge label="Confirmé" variant="success" />);
    expect(screen.getByText('Confirmé')).toBeTruthy();
  });

  it('renders success variant', () => {
    render(<Badge label="Succès" variant="success" />);
    expect(screen.getByText('Succès')).toBeTruthy();
  });

  it('renders warning variant', () => {
    render(<Badge label="Attention" variant="warning" />);
    expect(screen.getByText('Attention')).toBeTruthy();
  });

  it('renders danger variant', () => {
    render(<Badge label="Erreur" variant="danger" />);
    expect(screen.getByText('Erreur')).toBeTruthy();
  });

  it('renders info variant', () => {
    render(<Badge label="Info" variant="info" />);
    expect(screen.getByText('Info')).toBeTruthy();
  });

  it('renders neutral variant', () => {
    render(<Badge label="Neutre" variant="neutral" />);
    expect(screen.getByText('Neutre')).toBeTruthy();
  });

  it('renders with size "sm"', () => {
    render(<Badge label="Petit" variant="info" size="sm" />);
    expect(screen.getByText('Petit')).toBeTruthy();
  });

  it('renders with size "md" (default)', () => {
    render(<Badge label="Moyen" variant="info" />);
    expect(screen.getByText('Moyen')).toBeTruthy();
  });

  it('has accessibility role "text"', () => {
    render(<Badge label="Status" variant="success" />);
    expect(screen.getByRole('text')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

describe('Avatar', () => {
  it('renders initials when no uri is provided', () => {
    render(<Avatar firstName="Fatima" lastName="Zahra" />);
    expect(screen.getByText('FZ')).toBeTruthy();
  });

  it('renders fallback "?" when no name is provided', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('renders image when uri is provided', () => {
    render(
      <Avatar
        uri="https://example.com/avatar.jpg"
        firstName="Fatima"
        lastName="Zahra"
      />,
    );
    expect(
      screen.getByLabelText('Avatar de Fatima Zahra'),
    ).toBeTruthy();
  });

  it('renders all size variants without crashing', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    for (const size of sizes) {
      const { unmount } = render(
        <Avatar firstName="Ali" lastName="Ben" size={size} />,
      );
      expect(screen.getByText('AB')).toBeTruthy();
      unmount();
    }
  });

  it('renders status badge when statusBadge prop is provided', () => {
    render(<Avatar firstName="A" lastName="B" statusBadge="online" />);
    expect(screen.getByLabelText('online')).toBeTruthy();
  });

  it('renders "offline" status badge', () => {
    render(<Avatar firstName="A" lastName="B" statusBadge="offline" />);
    expect(screen.getByLabelText('offline')).toBeTruthy();
  });

  it('renders "busy" status badge', () => {
    render(<Avatar firstName="A" lastName="B" statusBadge="busy" />);
    expect(screen.getByLabelText('busy')).toBeTruthy();
  });

  it('does not render status badge when prop is absent', () => {
    render(<Avatar firstName="A" lastName="B" />);
    expect(screen.queryByLabelText('online')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// StarRating
// ---------------------------------------------------------------------------

describe('StarRating', () => {
  it('renders the correct number of stars (default max=5)', () => {
    render(<StarRating value={3} />);
    // 5 star buttons rendered
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renders custom max stars', () => {
    render(<StarRating value={2} max={3} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('shows label when showLabel=true', () => {
    render(<StarRating value={4.5} showLabel />);
    expect(screen.getByText('4.5')).toBeTruthy();
  });

  it('does not show label when showLabel=false (default)', () => {
    render(<StarRating value={3} />);
    expect(screen.queryByText('3.0')).toBeNull();
  });

  it('calls onChange when a star is pressed in non-readonly mode', () => {
    const onChange = jest.fn();
    render(<StarRating value={2} readonly={false} onChange={onChange} />);
    const stars = screen.getAllByRole('button');
    fireEvent.press(stars[3]); // pressing 4th star => rating 4
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not call onChange in readonly mode', () => {
    const onChange = jest.fn();
    render(<StarRating value={2} readonly onChange={onChange} />);
    const stars = screen.getAllByRole('button');
    fireEvent.press(stars[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders value=0 without crashing', () => {
    render(<StarRating value={0} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renders maximum value without crashing', () => {
    render(<StarRating value={5} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });
});
