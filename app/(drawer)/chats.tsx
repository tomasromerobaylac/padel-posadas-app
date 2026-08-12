import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { listChatsForUser } from '../../src/data/chatRepo';
import { getClub } from '../../src/data/clubsRepo';
import { getUser } from '../../src/data/usersRepo';
import type { ChatThread } from '../../src/types/domain';

type ChatRow = ChatThread & { title: string };

export default function ChatsScreen() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!appUser) return;
    try {
      const threads = await listChatsForUser(appUser.id);
      const withTitles = await Promise.all(
        threads.map(async (chat) => {
          const isOwnerSide = chat.ownerUserId === appUser.id;
          const [club, otherUser] = await Promise.all([
            getClub(chat.clubId),
            getUser(isOwnerSide ? chat.playerUserId : chat.ownerUserId),
          ]);
          const title = isOwnerSide
            ? `${otherUser?.name ?? 'Jugador'} · ${club?.name ?? 'Club'}`
            : club?.name ?? 'Club';
          return { ...chat, title };
        })
      );
      setChats(withTitles.sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt)));
    } catch {
      // sesión cambiada u otro error transitorio
    }
  }, [appUser]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={chats}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>Todavía no tenés conversaciones.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => router.push(`/chat/${item.id}`)}>
          <Text style={styles.title}>{item.title}</Text>
          {item.lastMessageText && <Text style={styles.preview}>{item.lastMessageText}</Text>}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#888', fontSize: 13, marginTop: 16 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  preview: { fontSize: 13, color: '#666', marginTop: 2 },
});
