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
        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/club-owner-request')}>
          <Text style={styles.linkButtonText}>Sumar mi cancha</Text>
        </TouchableOpacity>
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
