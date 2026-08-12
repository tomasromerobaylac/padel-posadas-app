import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatPriceARS } from '../utils/format';
import type { Club } from '../types/domain';

export function ClubCard({ club, onPress }: { club: Club; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {club.photoUrl ? (
        <Image source={{ uri: club.photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>🎾</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {club.name}
        </Text>
        {club.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {club.description}
          </Text>
        ) : (
          <Text style={styles.address} numberOfLines={1}>
            {club.address}
          </Text>
        )}
        {club.pricePerSlot ? (
          <Text style={styles.price}>
            {formatPriceARS(club.pricePerSlot)} <Text style={styles.priceUnit}>· turno {club.slotDurationMinutes} min</Text>
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  photo: { width: 92, height: 92 },
  photoPlaceholder: { backgroundColor: '#e8f5ea', alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 30 },
  info: { flex: 1, padding: 10, justifyContent: 'center', gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  description: { fontSize: 12, color: '#666' },
  address: { fontSize: 12, color: '#888' },
  price: { fontSize: 13, fontWeight: '700', color: '#1b7f3a', marginTop: 2 },
  priceUnit: { fontSize: 11, fontWeight: '400', color: '#888' },
});
