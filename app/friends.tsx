import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
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
import { useAuth } from '../src/auth/AuthContext';
import { addFriend, listFriends, removeFriend } from '../src/data/friendsRepo';
import { findUserByPhone, getUser } from '../src/data/usersRepo';
import type { AppUser } from '../src/types/domain';

export default function FriendsScreen() {
  const { appUser } = useAuth();
  const [friends, setFriends] = useState<(AppUser & { friendUserId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    if (!appUser) return;
    const links = await listFriends(appUser.id);
    const users = await Promise.all(links.map((l) => getUser(l.friendUserId)));
    setFriends(
      users
        .map((u, i) => (u ? { ...u, friendUserId: links[i].friendUserId } : null))
        .filter((u): u is AppUser & { friendUserId: string } => u !== null)
    );
  }, [appUser]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  async function handleAddFriend() {
    if (!appUser) return;
    if (!phone.trim()) {
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
      await addFriend(appUser.id, found.id);
      setPhone('');
      await load();
    } catch (err: any) {
      Alert.alert('No se pudo agregar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSearching(false);
    }
  }

  async function handleRemove(friendUserId: string) {
    if (!appUser) return;
    await removeFriend(appUser.id, friendUserId);
    await load();
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddFriend} disabled={searching}>
          {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Agregar</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} size="large" />
      ) : (
        <FlatList
          style={{ marginTop: 20 }}
          data={friends}
          keyExtractor={(item) => item.friendUserId}
          ListEmptyComponent={<Text style={styles.empty}>Todavía no agregaste amigos.</Text>}
          renderItem={({ item }) => (
            <View style={styles.friendRow}>
              <View>
                <Text style={styles.friendName}>{item.name}</Text>
                <Text style={styles.friendPhone}>{item.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.friendUserId)}>
                <Text style={styles.removeText}>Quitar</Text>
              </TouchableOpacity>
            </View>
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
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendName: { fontSize: 16, fontWeight: '600' },
  friendPhone: { fontSize: 13, color: '#666' },
  removeText: { color: '#c0392b', fontWeight: '600' },
});
