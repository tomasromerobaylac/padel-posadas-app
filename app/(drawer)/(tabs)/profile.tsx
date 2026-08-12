import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../src/firebase/config';
import { useAuth } from '../../../src/auth/AuthContext';

export default function ProfileScreen() {
  const { appUser } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (err: any) {
      Alert.alert('No se pudo cerrar sesión', err?.message ?? 'Intentá de nuevo.');
    }
  }

  if (!appUser) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{appUser.name}</Text>
      <Text style={styles.detail}>Teléfono: {appUser.phone}</Text>
      <Text style={styles.detail}>
        Categoría: {appUser.category.min === appUser.category.max
          ? appUser.category.min
          : `${appUser.category.min}-${appUser.category.max}`}
      </Text>
      <Text style={styles.detail}>Género: {appUser.gender}</Text>

      {appUser.role !== 'club_owner' && (
        <View style={styles.partnerCard}>
          <Text style={styles.partnerBadge}>🎾 PARA CLUBES</Text>
          <Text style={styles.partnerTitle}>¿Tenés tu propia cancha?</Text>
          <Text style={styles.partnerSubtitle}>
            Hacete socio de Pádel Posadas y dejá que los jugadores de la ciudad encuentren y reserven tus turnos
            directamente desde la app.
          </Text>
          <TouchableOpacity style={styles.partnerButton} onPress={() => router.push('/club-owner-request')}>
            <Text style={styles.partnerButtonText}>Quiero ser socio</Text>
          </TouchableOpacity>
        </View>
      )}

      {appUser.role === 'club_owner' && (
        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/owner')}>
          <Text style={styles.linkButtonText}>Mi cancha</Text>
        </TouchableOpacity>
      )}

      {appUser.role === 'admin' && (
        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/admin')}>
          <Text style={styles.linkButtonText}>Panel de admin</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  name: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  detail: { fontSize: 15, color: '#333' },
  linkButton: {
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1b7f3a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkButtonText: { color: '#1b7f3a', fontWeight: '600' },
  partnerCard: {
    marginTop: 20,
    backgroundColor: '#eefaf1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cdeed8',
    padding: 18,
  },
  partnerBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1b7f3a',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  partnerTitle: { fontSize: 18, fontWeight: '700', color: '#123d22' },
  partnerSubtitle: { fontSize: 13, color: '#3f6b4d', marginTop: 6, lineHeight: 19 },
  partnerButton: {
    marginTop: 14,
    backgroundColor: '#1b7f3a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  partnerButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  button: {
    marginTop: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c0392b',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#c0392b', fontWeight: '600' },
});
