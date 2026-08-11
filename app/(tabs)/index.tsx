import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';

// Placeholder: el feed real (partidos + canchas libres) se implementa en la siguiente etapa.
export default function HomeScreen() {
  const { appUser } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {appUser?.name ?? 'jugador/a'} 👋</Text>
      <Text style={styles.subtitle}>Acá vas a ver los partidos y canchas libres abiertos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
});
