import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { ClubEditForm } from '../../src/components/ClubEditForm';
import { listClubsOwnedBy, updateClub } from '../../src/data/clubsRepo';
import { listEventsByClub } from '../../src/data/eventsRepo';
import { listCourtPostsByClub } from '../../src/data/courtPostsRepo';
import { formatSlot } from '../../src/utils/format';
import type { Club, CourtPost, PadelEvent } from '../../src/types/domain';

type ClubWithBookings = Club & { events: PadelEvent[]; courtPosts: CourtPost[] };

export default function OwnerScreen() {
  const { appUser } = useAuth();
  const [clubs, setClubs] = useState<ClubWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [editSlotMinutes, setEditSlotMinutes] = useState('120');
  const [saving, setSaving] = useState(false);
  const [infoEditClub, setInfoEditClub] = useState<Club | null>(null);

  const load = useCallback(async () => {
    if (!appUser) return;
    try {
      const owned = await listClubsOwnedBy(appUser.id);
      const withBookings = await Promise.all(
        owned.map(async (club) => {
          const [events, courtPosts] = await Promise.all([
            listEventsByClub(club.id),
            listCourtPostsByClub(club.id),
          ]);
          return {
            ...club,
            events: events.sort((a, b) => a.slotStart - b.slotStart),
            courtPosts: courtPosts.sort((a, b) => a.slotStart - b.slotStart),
          };
        })
      );
      setClubs(withBookings);
    } catch {
      // sesión cambiada u otro error transitorio
    }
  }, [appUser]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  function startEditing(club: Club) {
    setEditingId(club.id);
    setEditAddress(club.address);
    setEditSlotMinutes(String(club.slotDurationMinutes));
  }

  async function handleSaveEdit(clubId: string) {
    const minutes = Number(editSlotMinutes.replace(/\D/g, ''));
    if (!editAddress.trim() || !minutes) {
      Alert.alert('Faltan datos', 'Completá dirección y duración de turno.');
      return;
    }
    setSaving(true);
    try {
      await updateClub(clubId, { address: editAddress.trim(), slotDurationMinutes: minutes });
      setEditingId(null);
      await load();
    } catch (err: any) {
      Alert.alert('No se pudo guardar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (!appUser || appUser.role !== 'club_owner') {
    return (
      <View style={styles.center}>
        <Text>No tenés acceso a esta pantalla.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi cancha</Text>
      {clubs.length === 0 && <Text style={styles.empty}>Todavía no tenés un club vinculado.</Text>}

      {clubs.map((club) => (
        <View key={club.id} style={styles.card}>
          {editingId === club.id ? (
            <>
              <Text style={styles.cardTitle}>{club.name}</Text>
              <Text style={styles.label}>Dirección</Text>
              <TextInput style={styles.input} value={editAddress} onChangeText={setEditAddress} />
              <Text style={styles.label}>Duración del turno (minutos)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={editSlotMinutes}
                onChangeText={setEditSlotMinutes}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleSaveEdit(club.id)}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallButtonText}>Guardar</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingId(null)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{club.name}</Text>
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <TouchableOpacity onPress={() => setInfoEditClub(club)}>
                    <Text style={styles.editText}>Fotos e info</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => startEditing(club)}>
                    <Text style={styles.editText}>Editar</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cardDetail}>{club.address}</Text>
              <Text style={styles.cardDetail}>Turno: {club.slotDurationMinutes} min</Text>
            </>
          )}

          <Text style={styles.sectionTitle}>Próximos partidos ({club.events.length})</Text>
          {club.events.length === 0 && <Text style={styles.empty}>Sin partidos reservados.</Text>}
          {club.events.map((ev) => (
            <Text key={ev.id} style={styles.bookingRow}>
              • {formatSlot(ev.slotStart, ev.slotEnd)} — {ev.filledSlots}/{ev.totalSlots} anotados
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Canchas libres publicadas ({club.courtPosts.length})</Text>
          {club.courtPosts.length === 0 && <Text style={styles.empty}>Sin publicaciones.</Text>}
          {club.courtPosts.map((post) => (
            <Text key={post.id} style={styles.bookingRow}>
              • {formatSlot(post.slotStart, post.slotEnd)}
            </Text>
          ))}
        </View>
      ))}

      <Modal visible={!!infoEditClub} animationType="slide" onRequestClose={() => setInfoEditClub(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Fotos e info</Text>
            <TouchableOpacity onPress={() => setInfoEditClub(null)}>
              <Text style={styles.editText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          {infoEditClub && (
            <ClubEditForm
              club={infoEditClub}
              onSaved={() => {
                setInfoEditClub(null);
                load();
              }}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, gap: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  empty: { color: '#888', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardDetail: { fontSize: 13, color: '#555' },
  editText: { color: '#1b7f3a', fontWeight: '600', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 14, marginTop: 4 },
  editActions: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 10 },
  smallButton: { backgroundColor: '#1b7f3a', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  smallButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  cancelText: { color: '#888', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 12 },
  bookingRow: { fontSize: 13, color: '#333', marginTop: 2 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
});
