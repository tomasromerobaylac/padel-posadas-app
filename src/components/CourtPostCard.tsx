import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatSlot } from '../utils/format';
import type { Club, CourtPost } from '../types/domain';

export function CourtPostCard({ post, club, onPress }: { post: CourtPost; club?: Club; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.club}>{club?.name ?? 'Club'}</Text>
      <Text style={styles.slot}>{formatSlot(post.slotStart, post.slotEnd)}</Text>
      <Text style={styles.tag}>Cancha libre</Text>
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
  club: { fontSize: 16, fontWeight: '700' },
  slot: { fontSize: 14, color: '#444' },
  tag: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#1565c0',
    backgroundColor: '#e3f0fb',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
