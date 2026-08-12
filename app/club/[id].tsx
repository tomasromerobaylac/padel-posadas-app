import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getClub } from '../../src/data/clubsRepo';
import { formatPriceARS } from '../../src/utils/format';
import type { Club } from '../../src/types/domain';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClub(id)
      .then(setClub)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.center}>
        <Text>No se encontró el club.</Text>
      </View>
    );
  }

  const amenityLabels = [
    club.amenities?.ventaAccesorios && 'Venta de accesorios',
    club.amenities?.parrillas && 'Parrillas',
    club.amenities?.cantina && 'Cantina',
  ].filter(Boolean) as string[];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {club.photoUrl && <Image source={{ uri: club.photoUrl }} style={styles.photo} resizeMode="cover" />}

      <Text style={styles.title}>{club.name}</Text>
      <Text style={styles.address}>{club.address}</Text>

      {club.pricePerSlot ? (
        <Text style={styles.price}>
          {formatPriceARS(club.pricePerSlot)} <Text style={styles.priceUnit}>/ turno de {club.slotDurationMinutes} min</Text>
        </Text>
      ) : null}

      {club.googleMapsUrl && (
        <TouchableOpacity onPress={() => Linking.openURL(club.googleMapsUrl!)}>
          <Text style={styles.mapsLink}>Ver en Google Maps →</Text>
        </TouchableOpacity>
      )}

      {club.description && <Text style={styles.description}>{club.description}</Text>}

      {amenityLabels.length > 0 && (
        <View style={styles.tagsRow}>
          {amenityLabels.map((label) => (
            <Text key={label} style={styles.tag}>
              {label}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 4, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: 180, borderRadius: 14, marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '700' },
  address: { fontSize: 14, color: '#555', marginTop: 4 },
  price: { fontSize: 16, fontWeight: '700', color: '#1b7f3a', marginTop: 8 },
  priceUnit: { fontSize: 12, fontWeight: '400', color: '#888' },
  mapsLink: { color: '#1565c0', fontWeight: '600', marginTop: 8 },
  description: { fontSize: 14, color: '#333', marginTop: 14, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tag: {
    fontSize: 12,
    color: '#1b7f3a',
    backgroundColor: '#e8f5ea',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
