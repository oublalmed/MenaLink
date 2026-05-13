import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { ChatBubble } from './ChatBubble';

const now = new Date().toISOString();
const ME = 'user-1';
const OTHER = 'user-2';

const meta: Meta<typeof ChatBubble> = {
  title: 'Organisms/ChatBubble',
  component: ChatBubble,
  args: { currentUserId: ME },
};
export default meta;

type Story = StoryObj<typeof ChatBubble>;

export const OutgoingRead: Story = {
  args: {
    message: {
      id: '1',
      content: 'Bonjour ! Je suis disponible lundi matin.',
      senderId: ME,
      sentAt: now,
      isRead: true,
    },
  },
};

export const OutgoingUnread: Story = {
  args: {
    message: {
      id: '2',
      content: 'Pouvez-vous confirmer pour 10h ?',
      senderId: ME,
      sentAt: now,
      isRead: false,
    },
  },
};

export const Incoming: Story = {
  args: {
    message: {
      id: '3',
      content: 'Oui, je serai là à 10h précises. Merci !',
      senderId: OTHER,
      sentAt: now,
      isRead: true,
    },
    senderName: 'Fatima Zahra',
    showAvatar: true,
  },
};

export const Conversation: Story = {
  render: () => (
    <View style={{ padding: 8 }}>
      <ChatBubble
        currentUserId={ME}
        message={{ id: '1', content: 'Bonjour, êtes-vous disponible lundi ?', senderId: ME, sentAt: now, isRead: true }}
      />
      <ChatBubble
        currentUserId={ME}
        message={{ id: '2', content: 'Oui, à partir de 9h. Quelle adresse ?', senderId: OTHER, sentAt: now, isRead: true }}
        senderName="Fatima Zahra"
        showAvatar
      />
      <ChatBubble
        currentUserId={ME}
        message={{ id: '3', content: '12 Rue Hassan II, Casablanca', senderId: ME, sentAt: now, isRead: false }}
      />
    </View>
  ),
};
