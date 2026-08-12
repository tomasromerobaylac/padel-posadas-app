import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { submitClubOwnerRequest } from '../src/data/clubOwnerRequestsRepo';

export default function ClubOwnerRequestScreen() {
  const { appUser } = useAuth();
  const router = useRouter();

  const [contactName, setContactName] = useState(appUser?.name ?? '');
  const [contactPhone, setContactPhone] = useState(appUser?.phone ?? '');
  const [clubName, setClubName] = useState('');
  const [clubAddress, setClubAddress] = useState('');
  const [saving, setSaving] = useState(false);

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
      Alert.alert('¡Listo!', 'Un admin va a revisar tu solicitud pronto.');
      router.back();
    } catch (err: any) {
      Alert.alert('No se pudo enviar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sumá tu cancha a la app</Text>
      <Text style={styles.subtitle}>
        Un admin va a revisar los datos y, si está todo bien, tu club queda disponible para que los jugadores
        reserven turnos.
      </Text>

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
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 6, marginBottom: 10 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16, marginTop: 6 },
  button: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, marginTop: 28, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
