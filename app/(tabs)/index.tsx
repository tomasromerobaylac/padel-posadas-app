import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { useClubsById } from '../../src/data/clubsCache';
import { getOpenEvents } from '../../src/data/eventsRepo';
import { listOpenCourtPosts } from '../../src/data/courtPostsRepo';
import { EventCard } from '../../src/components/EventCard';
import { CourtPostCard } from '../../src/components/CourtPostCard';
import type { CourtPost, PadelEvent } from '../../src/types/domain';

export default function HomeScreen() {
  const { appUser } = useAuth();
  const { clubsById } = useClubsById();
  const router = useRouter();

  const [events, setEvents] = useState<PadelEvent[]>([]);
  const [courtPosts, setCourtPosts] = useState<CourtPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [openEvents, openCourtPosts] = await Promise.all([getOpenEvents(), listOpenCourtPosts()]);
    setEvents(openEvents.sort((a, b) => a.slotStart - b.slotStart));
    setCourtPosts(openCourtPosts.sort((a, b) => a.slotStart - b.slotStart));
  }, []);

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
});
