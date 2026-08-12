import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { Avatar } from '../../src/components/Avatar';
import { listChatsForUser } from '../../src/data/chatRepo';
import { getClub } from '../../src/data/clubsRepo';
import { listDirectChatsForUser } from '../../src/data/directChatRepo';
import { getUser } from '../../src/data/usersRepo';

type ChatRow = {
  id: string;
  title: string;
  photoUrl?: string;
  lastMessageText?: string;
  lastMessageAt?: number;
  createdAt: number;
  href: string;
};

export default function ChatsScreen() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!appUser) return;
    try {
      const [clubThreads, directThreads] = await Promise.all([
        listChatsForUser(appUser.id),
        listDirectChatsForUser(appUser.id),
      ]);

      const clubRows = await Promise.all(
        clubThreads.map(async (chat): Promise<ChatRow> => {
          const isOwnerSide = chat.ownerUserId === appUser.id;
          const [club, otherUser] = await Promise.all([
            getClub(chat.clubId),
            getUser(isOwnerSide ? chat.playerUserId : chat.ownerUserId),
          ]);
          return {
            id: chat.id,
            title: isOwnerSide ? `${otherUser?.name ?? 'Jugador'} · ${club?.name ?? 'Club'}` : club?.name ?? 'Club',
            photoUrl: isOwnerSide ? otherUser?.photoUrl : undefined,
            lastMessageText: chat.lastMessageText,
            lastMessageAt: chat.lastMessageAt,
            createdAt: chat.createdAt,
            href: `/chat/${chat.id}`,
          };
        })
      );

      const directRows = await Promise.all(
        directThreads.map(async (chat): Promise<ChatRow> => {
          const otherUserId = chat.participantIds.find((uid) => uid !== appUser.id)!;
          const otherUser = await getUser(otherUserId);
          return {
            id: chat.id,
            title: otherUser?.name ?? 'Jugador',
            photoUrl: otherUser?.photoUrl,
            lastMessageText: chat.lastMessageText,
            lastMessageAt: chat.lastMessageAt,
            createdAt: chat.createdAt,
            href: `/dm/${chat.id}`,
          };
        })
      );

      setChats(
        [...clubRows, ...directRows].sort(
          (a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt)
        )
      );
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
        <TouchableOpacity style={styles.row} onPress={() => router.push(item.href)}>
          <Avatar name={item.title} photoUrl={item.photoUrl} />
          <View style={styles.rowText}>
            <Text style={styles.title}>{item.title}</Text>
            {item.lastMessageText && <Text style={styles.preview}>{item.lastMessageText}</Text>}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#888', fontSize: 13, marginTop: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  preview: { fontSize: 13, color: '#666', marginTop: 2 },
});
