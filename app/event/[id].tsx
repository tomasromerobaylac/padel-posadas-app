import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { getClub } from '../../src/data/clubsRepo';
import { getEvent, joinEvent, listParticipants } from '../../src/data/eventsRepo';
import { listFriends } from '../../src/data/friendsRepo';
import { sendInvite } from '../../src/data/invitesRepo';
import { getUser } from '../../src/data/usersRepo';
import { scheduleEventReminders } from '../../src/notifications/reminders';
import { categoryRangeLabel, formatSlot, matchTypeLabel } from '../../src/utils/format';
import type { AppUser, Club, EventParticipant, PadelEvent } from '../../src/types/domain';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appUser } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<PadelEvent | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [friendPickerVisible, setFriendPickerVisible] = useState(false);
  const [friends, setFriends] = useState<AppUser[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const ev = await getEvent(id);
      setEvent(ev);
      if (ev) {
        const [c, parts] = await Promise.all([getClub(ev.clubId), listParticipants(ev.id)]);
        setClub(c);
        setParticipants(parts);
        const names = await Promise.all(
          parts.map(async (p) => (p.userId ? [p.userId, (await getUser(p.userId))?.name ?? p.userId] : null))
        );
        setParticipantNames(Object.fromEntries(names.filter((n): n is [string, string] => n !== null)));
      }
    } catch {
      // sesión cambiada u otro error transitorio
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const alreadyJoined = participants.some((p) => p.userId === appUser?.id);

  async function handleJoin() {
    if (!appUser || !event) return;
    setJoining(true);
    try {
      await joinEvent(event.id, { userId: appUser.id });
      await load();
      scheduleEventReminders(event, club?.name ?? 'tu club').catch(() => {});
    } catch (err: any) {
      Alert.alert('No te pudiste unir', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setJoining(false);
    }
  }

  async function handleShare() {
    if (!event) return;
    const link = `https://padel-posadas.web.app/event/${event.id}`;
    try {
      await Share.share({
        message: `Te invito a un partido en ${club?.name ?? 'un club'} — ${formatSlot(event.slotStart, event.slotEnd)}. Sumate: ${link}`,
      });
    } catch {
      // el usuario canceló el share, no hace falta avisar nada
    }
  }

  async function handleOpenFriendPicker() {
    if (!appUser) return;
    setFriendPickerVisible(true);
    const links = await listFriends(appUser.id);
    const users = await Promise.all(links.map((l) => getUser(l.friendUserId)));
    setFriends(users.filter((u): u is AppUser => u !== null));
  }

  async function handleInviteFriend(friendId: string) {
    if (!appUser || !event) return;
    try {
      await sendInvite(appUser.id, friendId, event.id);
      setInvitedIds((prev) => [...prev, friendId]);
    } catch (err: any) {
      Alert.alert('No se pudo invitar', err?.message ?? 'Intentá de nuevo.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>No se encontró el partido.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.club}>{club?.name ?? 'Club'}</Text>
      <Text style={styles.slot}>{formatSlot(event.slotStart, event.slotEnd)}</Text>

      <View style={styles.tagsRow}>
        <Text style={styles.tag}>{categoryRangeLabel(event.categoryRange)}</Text>
        <Text style={styles.tag}>{matchTypeLabel(event.matchType)}</Text>
        <Text style={styles.tag}>{event.mode === 'pareja' ? 'Por pareja' : 'Individual'}</Text>
        <Text style={styles.tag}>
          {event.courtsReserved} cancha{event.courtsReserved > 1 ? 's' : ''}
        </Text>
      </View>

      <Text style={styles.cupo}>
        Cupo: {event.filledSlots}/{event.totalSlots} {event.status === 'completo' ? '(completo)' : ''}
      </Text>

      <Text style={styles.sectionTitle}>Anotados</Text>
      {participants.length === 0 && <Text style={styles.empty}>Todavía no se anotó nadie.</Text>}
      {participants.map((p) => (
        <Text key={p.id} style={styles.participant}>
          • {p.userId === appUser?.id ? 'Vos' : (p.userId && participantNames[p.userId]) || 'Pareja anotada'}
        </Text>
      ))}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.button, (alreadyJoined || event.status === 'completo') && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={alreadyJoined || event.status === 'completo' || joining}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {alreadyJoined ? 'Ya estás anotado' : event.status === 'completo' ? 'Completo' : 'Unirme'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleShare}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Compartir link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleOpenFriendPicker}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Invitar amigo</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={friendPickerVisible} animationType="slide" onRequestClose={() => setFriendPickerVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.sectionTitle}>Invitar amigo</Text>
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>
                Todavía no tenés amigos agregados. Sumalos desde tu perfil.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.friendRow}>
                <Text style={styles.friendName}>{item.name}</Text>
                <TouchableOpacity
                  style={[styles.smallButton, invitedIds.includes(item.id) && styles.buttonDisabled]}
                  onPress={() => handleInviteFriend(item.id)}
                  disabled={invitedIds.includes(item.id)}
                >
                  <Text style={styles.smallButtonText}>
                    {invitedIds.includes(item.id) ? 'Invitado' : 'Invitar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setFriendPickerVisible(false)}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  club: { fontSize: 22, fontWeight: '700' },
  slot: { fontSize: 16, color: '#444', marginTop: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: {
    fontSize: 12,
    color: '#1b7f3a',
    backgroundColor: '#e8f5ea',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cupo: { fontSize: 15, fontWeight: '600', marginTop: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  empty: { color: '#888', fontSize: 13 },
  participant: { fontSize: 14, color: '#333', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: { flex: 1, backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#1b7f3a' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonTextSecondary: { color: '#1b7f3a' },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendName: { fontSize: 16, fontWeight: '600' },
  smallButton: { backgroundColor: '#1b7f3a', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  smallButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  closeButton: { marginTop: 20, alignItems: 'center', paddingVertical: 12 },
  closeButtonText: { color: '#1b7f3a', fontWeight: '600' },
});
