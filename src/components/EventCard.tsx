import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatSlot, categoryRangeLabel, matchTypeLabel } from '../utils/format';
import type { Club, PadelEvent } from '../types/domain';

export function EventCard({ event, club, onPress }: { event: PadelEvent; club?: Club; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={styles.club}>{club?.name ?? 'Club'}</Text>
        <View style={[styles.badge, event.status === 'completo' && styles.badgeFull]}>
          <Text style={styles.badgeText}>
            {event.filledSlots}/{event.totalSlots}
          </Text>
        </View>
      </View>
      <Text style={styles.slot}>{formatSlot(event.slotStart, event.slotEnd)}</Text>
      <View style={styles.rowTags}>
        <Text style={styles.tag}>{categoryRangeLabel(event.categoryRange)}</Text>
        <Text style={styles.tag}>{matchTypeLabel(event.matchType)}</Text>
        <Text style={styles.tag}>{event.mode === 'pareja' ? 'Por pareja' : 'Individual'}</Text>
        <Text style={styles.tag}>{event.courtsReserved} cancha{event.courtsReserved > 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 6,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  club: { fontSize: 16, fontWeight: '700' },
  slot: { fontSize: 14, color: '#444' },
  rowTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    fontSize: 12,
    color: '#1b7f3a',
    backgroundColor: '#e8f5ea',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badge: { backgroundColor: '#1b7f3a', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
  badgeFull: { backgroundColor: '#999' },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
