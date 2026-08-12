import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../src/auth/AuthContext';
import { useClubsById } from '../../../src/data/clubsCache';
import { getEvent, getOpenEvents, joinEvent } from '../../../src/data/eventsRepo';
import { listOpenCourtPosts } from '../../../src/data/courtPostsRepo';
import { listInvitesForUser, respondInvite } from '../../../src/data/invitesRepo';
import { EventCard } from '../../../src/components/EventCard';
import { CourtPostCard } from '../../../src/components/CourtPostCard';
import { formatSlot } from '../../../src/utils/format';
import type { CourtPost, Invite, PadelEvent } from '../../../src/types/domain';

export default function HomeScreen() {
  const { appUser } = useAuth();
  const { clubsById } = useClubsById();
  const router = useRouter();

  const [events, setEvents] = useState<PadelEvent[]>([]);
  const [courtPosts, setCourtPosts] = useState<CourtPost[]>([]);
  const [invites, setInvites] = useState<(Invite & { eventInfo?: PadelEvent })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [openEvents, openCourtPosts] = await Promise.all([getOpenEvents(), listOpenCourtPosts()]);
      setEvents(openEvents.sort((a, b) => a.slotStart - b.slotStart));
      setCourtPosts(openCourtPosts.sort((a, b) => a.slotStart - b.slotStart));

      if (appUser) {
        const pending = await listInvitesForUser(appUser.id);
        const withEvents = await Promise.all(
          pending.map(async (inv) => ({ ...inv, eventInfo: (await getEvent(inv.eventId)) ?? undefined }))
        );
        setInvites(withEvents);
      }
    } catch {
      // Sesión cambiada u otro error transitorio: no rompemos la pantalla, el próximo refresh reintenta.
    }
  }, [appUser]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleAcceptInvite(invite: Invite) {
    if (!appUser) return;
    try {
      await joinEvent(invite.eventId, { userId: appUser.id });
      await respondInvite(invite.id, 'aceptada');
      await load();
    } catch (err: any) {
      Alert.alert('No se pudo aceptar', err?.message ?? 'Intentá de nuevo.');
    }
  }

  async function handleRejectInvite(invite: Invite) {
    await respondInvite(invite.id, 'rechazada');
    await load();
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/event/create')}>
          <Text style={styles.actionBtnText}>+ Crear partido</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/court-post/create')}>
          <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>+ Publicar cancha</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {invites.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Te invitaron</Text>
              {invites.map((inv) => (
                <View key={inv.id} style={styles.inviteCard}>
                  <Text style={styles.inviteText}>
                    {inv.eventInfo
                      ? `${clubsById[inv.eventInfo.clubId]?.name ?? 'Club'} · ${formatSlot(inv.eventInfo.slotStart, inv.eventInfo.slotEnd)}`
                      : 'Partido'}
                  </Text>
                  <View style={styles.inviteActions}>
                    <TouchableOpacity style={styles.inviteAccept} onPress={() => handleAcceptInvite(inv)}>
                      <Text style={styles.inviteAcceptText}>Unirme</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inviteReject} onPress={() => handleRejectInvite(inv)}>
                      <Text style={styles.inviteRejectText}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>Partidos</Text>
          {events.length === 0 && <Text style={styles.empty}>No hay partidos abiertos por ahora.</Text>}
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              club={clubsById[event.clubId]}
              onPress={() => router.push(`/event/${event.id}`)}
            />
          ))}

          <Text style={styles.sectionTitle}>Canchas libres</Text>
          {courtPosts.length === 0 && <Text style={styles.empty}>No hay canchas publicadas por ahora.</Text>}
          {courtPosts.map((post) => (
            <CourtPostCard key={post.id} post={post} club={clubsById[post.clubId]} onPress={() => {}} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  actionsRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  actionBtn: { flex: 1, backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#1b7f3a' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  actionBtnTextSecondary: { color: '#1b7f3a' },
  scrollContent: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  empty: { color: '#888', fontSize: 13, marginBottom: 12 },
  inviteCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffe082',
    gap: 8,
  },
  inviteText: { fontSize: 14, fontWeight: '600' },
  inviteActions: { flexDirection: 'row', gap: 8 },
  inviteAccept: { flex: 1, backgroundColor: '#1b7f3a', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  inviteAcceptText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  inviteReject: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#c0392b' },
  inviteRejectText: { color: '#c0392b', fontWeight: '600', fontSize: 13 },
});
