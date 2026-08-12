import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { listClubs, createClub } from '../../src/data/clubsRepo';
import {
  approveClubOwnerRequest,
  listPendingClubOwnerRequests,
  rejectClubOwnerRequest,
} from '../../src/data/clubOwnerRequestsRepo';
import type { Club, ClubOwnerRequest } from '../../src/types/domain';

export default function AdminScreen() {
  const { appUser } = useAuth();
  const [requests, setRequests] = useState<ClubOwnerRequest[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [newClubName, setNewClubName] = useState('');
  const [newClubAddress, setNewClubAddress] = useState('');
  const [creatingClub, setCreatingClub] = useState(false);

  const load = useCallback(async () => {
    const [pending, allClubs] = await Promise.all([listPendingClubOwnerRequests(), listClubs()]);
    setRequests(pending);
    setClubs(allClubs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  async function handleApprove(request: ClubOwnerRequest) {
    if (!appUser) return;
    setProcessingId(request.id);
    try {
      await approveClubOwnerRequest(request, appUser.id);
      await load();
    } catch (err: any) {
      Alert.alert('No se pudo aprobar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(request: ClubOwnerRequest) {
    if (!appUser) return;
    setProcessingId(request.id);
    try {
      await rejectClubOwnerRequest(request.id, appUser.id);
      await load();
    } catch (err: any) {
      Alert.alert('No se pudo rechazar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCreateClub() {
    if (!newClubName.trim() || !newClubAddress.trim()) {
      Alert.alert('Faltan datos', 'Completá nombre y dirección del club.');
      return;
    }
    setCreatingClub(true);
    try {
      await createClub({
        name: newClubName.trim(),
        aliases: [],
        address: newClubAddress.trim(),
        slotDurationMinutes: 120,
        ownerUserId: null,
        createdAt: Date.now(),
      });
      setNewClubName('');
      setNewClubAddress('');
      await load();
    } catch (err: any) {
      Alert.alert('No se pudo crear el club', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setCreatingClub(false);
    }
  }

  if (!appUser || appUser.role !== 'admin') {
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
      <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
      {requests.length === 0 && <Text style={styles.empty}>No hay solicitudes pendientes.</Text>}
      {requests.map((req) => (
        <View key={req.id} style={styles.card}>
          <Text style={styles.cardTitle}>{req.clubName}</Text>
          <Text style={styles.cardDetail}>{req.clubAddress}</Text>
          <Text style={styles.cardDetail}>
            Contacto: {req.contactName} · {req.contactPhone}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.smallButton, styles.approveButton]}
              onPress={() => handleApprove(req)}
              disabled={processingId === req.id}
            >
              {processingId === req.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.smallButtonText}>Aprobar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, styles.rejectButton]}
              onPress={() => handleReject(req)}
              disabled={processingId === req.id}
            >
              <Text style={styles.smallButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Agregar club</Text>
      <TextInput style={styles.input} placeholder="Nombre del club" value={newClubName} onChangeText={setNewClubName} />
      <TextInput
        style={styles.input}
        placeholder="Dirección"
        value={newClubAddress}
        onChangeText={setNewClubAddress}
      />
      <TouchableOpacity style={styles.button} onPress={handleCreateClub} disabled={creatingClub}>
        {creatingClub ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Agregar club</Text>}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Clubes ({clubs.length})</Text>
      {clubs.map((club) => (
        <View key={club.id} style={styles.card}>
          <Text style={styles.cardTitle}>{club.name}</Text>
          <Text style={styles.cardDetail}>{club.address}</Text>
          <Text style={styles.cardDetail}>Turno: {club.slotDurationMinutes} min</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 6, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  empty: { color: '#888', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDetail: { fontSize: 13, color: '#555' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallButton: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  approveButton: { backgroundColor: '#1b7f3a' },
  rejectButton: { backgroundColor: '#c0392b' },
  smallButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16, marginTop: 6 },
  button: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, marginTop: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
