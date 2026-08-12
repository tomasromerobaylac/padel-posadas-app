import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { listClubs } from '../../src/data/clubsRepo';
import { createCourtPost } from '../../src/data/courtPostsRepo';
import { dayLabel, generateDaySlots, nextDays } from '../../src/utils/format';
import type { Club } from '../../src/types/domain';

type BookingType = 'turno' | 'clase';
const CLASS_DURATION_MINUTES = 60;

export default function CreateCourtPostScreen() {
  const { appUser } = useAuth();
  const router = useRouter();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>('turno');
  const [dayIndex, setDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{ slotStart: number; slotEnd: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => nextDays(14), []);
  const selectedClub = clubs.find((c) => c.id === clubId);
  const slotDurationMinutes =
    bookingType === 'clase' ? CLASS_DURATION_MINUTES : (selectedClub?.slotDurationMinutes ?? 120);
  const slots = useMemo(
    () => (selectedClub ? generateDaySlots(days[dayIndex], slotDurationMinutes) : []),
    [selectedClub, dayIndex, days, slotDurationMinutes]
  );

  useEffect(() => {
    listClubs()
      .then((list) => {
        setClubs(list);
        if (list.length > 0) setClubId(list[0].id);
      })
      .finally(() => setLoadingClubs(false));
  }, []);

  useEffect(() => {
    setSelectedSlot(null);
  }, [clubId, dayIndex, bookingType]);

  async function handlePublish() {
    if (!appUser) return;
    if (!clubId) {
      Alert.alert('Elegí un club', 'Todavía no hay clubes cargados para elegir.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Elegí un turno', 'Seleccioná el horario libre.');
      return;
    }

    setSaving(true);
    try {
      await createCourtPost({
        publishedByUserId: appUser.id,
        clubId,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('No se pudo publicar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingClubs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (clubs.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          Todavía no hay clubes cargados en la app. Un admin tiene que agregarlos primero.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Club</Text>
      <View style={styles.chipsRow}>
        {clubs.map((club) => (
          <TouchableOpacity
            key={club.id}
            style={[styles.chip, clubId === club.id && styles.chipSelected]}
            onPress={() => setClubId(club.id)}
          >
            <Text style={[styles.chipText, clubId === club.id && styles.chipTextSelected]}>{club.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>¿Qué vas a alquilar?</Text>
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.chip, bookingType === 'turno' && styles.chipSelected]}
          onPress={() => setBookingType('turno')}
        >
          <Text style={[styles.chipText, bookingType === 'turno' && styles.chipTextSelected]}>Partido (2 hs)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, bookingType === 'clase' && styles.chipSelected]}
          onPress={() => setBookingType('clase')}
        >
          <Text style={[styles.chipText, bookingType === 'clase' && styles.chipTextSelected]}>Clase (1 h)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Día</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
        <View style={styles.chipsRow}>
          {days.map((day, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chip, dayIndex === i && styles.chipSelected]}
              onPress={() => setDayIndex(i)}
            >
              <Text style={[styles.chipText, dayIndex === i && styles.chipTextSelected]}>{dayLabel(day)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.label}>Turno libre</Text>
      <View style={styles.chipsRow}>
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot.slotStart}
            style={[styles.chip, selectedSlot?.slotStart === slot.slotStart && styles.chipSelected]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text
              style={[styles.chipText, selectedSlot?.slotStart === slot.slotStart && styles.chipTextSelected]}
            >
              {slot.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePublish} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Publicar cancha</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { textAlign: 'center', color: '#666' },
  label: { fontSize: 15, fontWeight: '600', marginTop: 16 },
  daysScroll: { marginTop: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipSelected: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#1565c0', borderRadius: 10, paddingVertical: 14, marginTop: 28, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
