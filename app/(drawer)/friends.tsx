import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { Avatar } from '../../src/components/Avatar';
import { getOrCreateDirectChat } from '../../src/data/directChatRepo';
import {
  acceptFriendRequest,
  listFriends,
  listIncomingFriendRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '../../src/data/friendsRepo';
import { findUserByPhone, getUser } from '../../src/data/usersRepo';
import type { AppUser, FriendRequest } from '../../src/types/domain';

const PHONE_PREFIX = '+549';

export default function FriendsScreen() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<(AppUser & { friendUserId: string })[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<(FriendRequest & { fromUser?: AppUser })[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    if (!appUser) return;
    try {
      const [links, requests] = await Promise.all([
        listFriends(appUser.id),
        listIncomingFriendRequests(appUser.id),
      ]);
      const users = await Promise.all(links.map((l) => getUser(l.friendUserId)));
      setFriends(
        users
          .map((u, i) => (u ? { ...u, friendUserId: links[i].friendUserId } : null))
          .filter((u): u is AppUser & { friendUserId: string } => u !== null)
      );
      const withUsers = await Promise.all(
        requests.map(async (r) => ({ ...r, fromUser: (await getUser(r.fromUserId)) ?? undefined }))
      );
      setIncomingRequests(withUsers);
    } catch {
      // sesión cambiada u otro error transitorio, no rompemos la pantalla
    }
  }, [appUser]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  async function handleSendRequest() {
    if (!appUser) return;
    if (phone.trim() === PHONE_PREFIX || !phone.trim()) {
      Alert.alert('Ingresá un teléfono', 'Buscamos al jugador por su número.');
      return;
    }
    setSearching(true);
    try {
      const found = await findUserByPhone(phone.trim());
      if (!found) {
        Alert.alert('No encontrado', 'No hay ningún jugador registrado con ese teléfono.');
        return;
      }
      if (found.id === appUser.id) {
        Alert.alert('Ese sos vos', 'No te podés agregar a vos mismo.');
        return;
      }
      if (friends.some((f) => f.friendUserId === found.id)) {
        Alert.alert('Ya son amigos', 'Ese jugador ya está en tu lista.');
        return;
      }
      await sendFriendRequest(appUser.id, found.id);
      setPhone(PHONE_PREFIX);
      Alert.alert('¡Listo!', `Le mandamos la solicitud a ${found.name}.`);
    } catch (err: any) {
      Alert.alert('No se pudo enviar la solicitud', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSearching(false);
    }
  }

  async function handleAccept(request: FriendRequest) {
    await acceptFriendRequest(request);
    await load();
  }

  async function handleReject(requestId: string) {
    await rejectFriendRequest(requestId);
    await load();
  }

  async function handleRemove(friendUserId: string) {
    if (!appUser) return;
    await removeFriend(appUser.id, friendUserId);
    await load();
  }

  async function handleOpenChat(friendUserId: string) {
    if (!appUser) return;
    const chat = await getOrCreateDirectChat(appUser.id, friendUserId);
    router.push(`/dm/${chat.id}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Agregar amigo por teléfono</Text>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="+54 9 3764 501234"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleSendRequest} disabled={searching}>
          {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Pedir</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} size="large" />
      ) : (
        <FlatList
          style={{ marginTop: 20 }}
          data={friends}
          keyExtractor={(item) => item.friendUserId}
          ListHeaderComponent={
            incomingRequests.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Solicitudes recibidas</Text>
                {incomingRequests.map((req) => (
                  <View key={req.id} style={styles.requestRow}>
                    <Text style={styles.friendName}>{req.fromUser?.name ?? 'Jugador'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(req)}>
                        <Text style={styles.acceptButtonText}>Aceptar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleReject(req.id)}>
                        <Text style={styles.removeText}>Rechazar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <Text style={[styles.label, { marginTop: 20 }]}>Tus amigos</Text>
              </View>
            ) : (
              <Text style={[styles.label, { marginBottom: 4 }]}>Tus amigos</Text>
            )
          }
          ListEmptyComponent={<Text style={styles.empty}>Todavía no agregaste amigos.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.friendRow} onPress={() => handleOpenChat(item.friendUserId)}>
              <View style={styles.friendInfo}>
                <Avatar name={item.name} photoUrl={item.photoUrl} />
                <View>
                  <Text style={styles.friendName}>{item.name}</Text>
                  <Text style={styles.friendPhone}>{item.phone}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.friendUserId)}>
                <Text style={styles.removeText}>Quitar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 15, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16 },
  addButton: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#888', fontSize: 13, marginTop: 8 },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  acceptButton: { backgroundColor: '#1b7f3a', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  acceptButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  friendName: { fontSize: 16, fontWeight: '600' },
  friendPhone: { fontSize: 13, color: '#666' },
  removeText: { color: '#c0392b', fontWeight: '600' },
});
