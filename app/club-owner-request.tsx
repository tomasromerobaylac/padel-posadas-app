import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { getClubOwnerRequestForUser, submitClubOwnerRequest } from '../src/data/clubOwnerRequestsRepo';
import type { ClubOwnerRequest } from '../src/types/domain';

export default function ClubOwnerRequestScreen() {
  const { appUser } = useAuth();

  const [contactName, setContactName] = useState(appUser?.name ?? '');
  const [contactPhone, setContactPhone] = useState(appUser?.phone ?? '');
  const [clubName, setClubName] = useState('');
  const [clubAddress, setClubAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingRequest, setExistingRequest] = useState<ClubOwnerRequest | null | undefined>(undefined);

  useEffect(() => {
    if (!appUser) return;
    getClubOwnerRequestForUser(appUser.id)
      .then(setExistingRequest)
      .catch(() => setExistingRequest(null));
  }, [appUser]);

  async function handleSubmit() {
    if (!appUser) return;
    if (!contactName.trim() || !contactPhone.trim() || !clubName.trim() || !clubAddress.trim()) {
      Alert.alert('Faltan datos', 'Completá todos los campos.');
      return;
    }

    setSaving(true);
    try {
      await submitClubOwnerRequest({
        requesterUserId: appUser.id,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        clubName: clubName.trim(),
        clubAddress: clubAddress.trim(),
      });
      setExistingRequest({
        id: appUser.id,
        requesterUserId: appUser.id,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        clubName: clubName.trim(),
        clubAddress: clubAddress.trim(),
        status: 'pending',
        createdAt: Date.now(),
      });
      Alert.alert('¡Listo!', 'Un admin va a revisar tu solicitud pronto.');
    } catch (err: any) {
      Alert.alert('No se pudo enviar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (existingRequest === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (existingRequest?.status === 'pending') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Solicitud enviada</Text>
        <Text style={styles.subtitle}>
          Ya mandaste una solicitud para "{existingRequest.clubName}". Un admin la va a revisar pronto — te avisamos
          cuando quede aprobada.
        </Text>
      </ScrollView>
    );
  }

  if (existingRequest?.status === 'approved') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>¡Ya sos dueño de cancha!</Text>
        <Text style={styles.subtitle}>
          Tu solicitud para "{existingRequest.clubName}" ya fue aprobada. Buscá "Mi cancha" en tu perfil.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sumá tu cancha a la app</Text>
      <Text style={styles.subtitle}>
        Un admin va a revisar los datos y, si está todo bien, tu club queda disponible para que los jugadores
        reserven turnos.
      </Text>
      {existingRequest?.status === 'rejected' && (
        <Text style={styles.rejectedNotice}>
          Tu solicitud anterior no fue aprobada. Revisá los datos y volvé a enviarla.
        </Text>
      )}

      <Text style={styles.label}>Tu nombre</Text>
      <TextInput style={styles.input} value={contactName} onChangeText={setContactName} />

      <Text style={styles.label}>Tu teléfono</Text>
      <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Nombre del club</Text>
      <TextInput style={styles.input} placeholder="Ej: Arena Padel Posadas" value={clubName} onChangeText={setClubName} />

      <Text style={styles.label}>Dirección</Text>
      <TextInput style={styles.input} placeholder="Calle, altura, ciudad" value={clubAddress} onChangeText={setClubAddress} />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar solicitud</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 6, marginBottom: 10 },
  rejectedNotice: {
    fontSize: 13,
    color: '#c0392b',
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  label: { fontSize: 15, fontWeight: '600', marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16, marginTop: 6 },
  button: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, marginTop: 28, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
