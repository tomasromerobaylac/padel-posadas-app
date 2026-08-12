import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { listClubs } from '../../src/data/clubsRepo';
import { createEvent } from '../../src/data/eventsRepo';
import { categoryLabel, dayLabel, generateDaySlots, nextDays } from '../../src/utils/format';
import type { Category, Club, EventMode, MatchType } from '../../src/types/domain';

const CATEGORIES: Category[] = [1, 2, 3, 4, 5, 6, 7, 8];
const MATCH_TYPES: MatchType[] = ['masculino', 'femenino', 'mixto', 'indistinto'];

export default function CreateEventScreen() {
  const { appUser } = useAuth();
  const router = useRouter();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{ slotStart: number; slotEnd: number } | null>(null);
  const [courtsReserved, setCourtsReserved] = useState(1);
  const [totalSlots, setTotalSlots] = useState(4);
  const [categoryMin, setCategoryMin] = useState<Category>(6);
  const [categoryMax, setCategoryMax] = useState<Category>(6);
  const [matchType, setMatchType] = useState<MatchType>('indistinto');
  const [mode, setMode] = useState<EventMode>('individual');
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => nextDays(14), []);
  const selectedClub = clubs.find((c) => c.id === clubId);
  const slots = useMemo(
    () => (selectedClub ? generateDaySlots(days[dayIndex], selectedClub.slotDurationMinutes) : []),
    [selectedClub, dayIndex, days]
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
  }, [clubId, dayIndex]);

  async function handleCreate() {
    if (!appUser) return;
    if (!clubId) {
      Alert.alert('Elegí un club', 'Todavía no hay clubes cargados para elegir.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Elegí un turno', 'Seleccioná el horario del partido.');
      return;
    }
    if (categoryMin > categoryMax) {
      Alert.alert('Categoría inválida', 'La categoría mínima no puede ser mayor que la máxima.');
      return;
    }

    setSaving(true);
    try {
      const eventId = await createEvent({
        organizerUserId: appUser.id,
        clubId,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
        courtsReserved,
        totalSlots,
        categoryRange: { min: categoryMin, max: categoryMax },
        matchType,
        mode,
        inviteLinkToken: Math.random().toString(36).slice(2, 10),
      });
      router.replace(`/event/${eventId}`);
    } catch (err: any) {
      Alert.alert('No se pudo crear el partido', err?.message ?? 'Intentá de nuevo.');
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

      <Text style={styles.label}>Turno</Text>
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

      <Text style={styles.label}>Cantidad de canchas</Text>
      <View style={styles.chipsRow}>
        {[1, 2, 3].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.chip, courtsReserved === n && styles.chipSelected]}
            onPress={() => {
              setCourtsReserved(n);
              setTotalSlots(n * 4);
            }}
          >
            <Text style={[styles.chipText, courtsReserved === n && styles.chipTextSelected]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Cupo total (jugadores)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={String(totalSlots)}
        onChangeText={(v) => setTotalSlots(Number(v.replace(/\D/g, '')) || 0)}
      />

      <Text style={styles.label}>Modalidad</Text>
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.chip, mode === 'individual' && styles.chipSelected]}
          onPress={() => setMode('individual')}
        >
          <Text style={[styles.chipText, mode === 'individual' && styles.chipTextSelected]}>Individual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, mode === 'pareja' && styles.chipSelected]} onPress={() => setMode('pareja')}>
          <Text style={[styles.chipText, mode === 'pareja' && styles.chipTextSelected]}>Por pareja</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.chipsRow}>
        {MATCH_TYPES.map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, matchType === t && styles.chipSelected]} onPress={() => setMatchType(t)}>
            <Text style={[styles.chipText, matchType === t && styles.chipTextSelected]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Categoría</Text>
      <Text style={styles.sublabel}>Desde</Text>
      <View style={styles.chipsRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={`min-${c}`} style={[styles.chip, categoryMin === c && styles.chipSelected]} onPress={() => setCategoryMin(c)}>
            <Text style={[styles.chipText, categoryMin === c && styles.chipTextSelected]}>{categoryLabel(c)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sublabel}>Hasta</Text>
      <View style={styles.chipsRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={`max-${c}`} style={[styles.chip, categoryMax === c && styles.chipSelected]} onPress={() => setCategoryMax(c)}>
            <Text style={[styles.chipText, categoryMax === c && styles.chipTextSelected]}>{categoryLabel(c)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear partido</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { textAlign: 'center', color: '#666' },
  label: { fontSize: 15, fontWeight: '600', marginTop: 16 },
  sublabel: { fontSize: 13, color: '#666', marginTop: 6 },
  daysScroll: { marginTop: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipSelected: { backgroundColor: '#1b7f3a', borderColor: '#1b7f3a' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16, marginTop: 6, width: 100 },
  button: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, marginTop: 28, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
