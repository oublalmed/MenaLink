import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar, EmptyState } from '../../components/atoms';

const MOCK_CHATS = [
  { id: '1', name: 'Khadija Moussaoui', lastMessage: 'Je serai là à 10h00', time: '09:45', unread: 2 },
  { id: '2', name: 'Fatima Zahra', lastMessage: 'Merci pour votre confiance !', time: 'Hier', unread: 0 },
];

export function ChatListScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.md }}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.md }]}>
          Messages
        </Text>
      </View>

      {MOCK_CHATS.length === 0 ? (
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>💬</Text>}
          title="Aucun message"
          description="Vos conversations avec les prestataires apparaîtront ici."
        />
      ) : (
        <FlatList
          data={MOCK_CHATS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Avatar size={48} name={item.name} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>{item.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>{item.time}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, flex: 1 }} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
                      <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
  chatRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
});
