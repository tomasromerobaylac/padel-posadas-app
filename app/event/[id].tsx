import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { getClub } from '../../src/data/clubsRepo';
import { getEvent, joinEvent, listParticipants } from '../../src/data/eventsRepo';
import { scheduleEventReminders } from '../../src/notifications/reminders';
import { categoryRangeLabel, formatSlot, matchTypeLabel } from '../../src/utils/format';
import type { Club, EventParticipant, PadelEvent } from '../../src/types/domain';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appUser } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<PadelEvent | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    const ev = await getEvent(id);
    setEvent(ev);
    if (ev) {
      const [c, parts] = await Promise.all([getClub(ev.clubId), listParticipants(ev.id)]);
      setClub(c);
      setParticipants(parts);
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

  async function handleInvite() {
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
          • {p.userId === appUser?.id ? 'Vos' : p.userId ?? 'Pareja anotada'}
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
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleInvite}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Invitar</Text>
        </TouchableOpacity>
      </View>
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
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 28 },
  button: { flex: 1, backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#1b7f3a' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonTextSecondary: { color: '#1b7f3a' },
});
