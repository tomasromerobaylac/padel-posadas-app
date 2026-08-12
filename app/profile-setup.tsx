import { useEffect, useState } from 'react';
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
import { useAuth } from '../src/auth/AuthContext';
import { createUser, setPhoneDirectoryEntry } from '../src/data/usersRepo';
import { listClubs } from '../src/data/clubsRepo';
import { categoryLabel } from '../src/utils/format';
import type { Category, Club, Gender } from '../src/types/domain';

const PHONE_PREFIX = '+549';
const CATEGORIES: Category[] = [1, 2, 3, 4, 5, 6, 7, 8];
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
];

export default function ProfileSetupScreen() {
  const { firebaseUser, refreshAppUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [gender, setGender] = useState<Gender>('masculino');
  const [categoryMin, setCategoryMin] = useState<Category>(6);
  const [categoryMax, setCategoryMax] = useState<Category>(6);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [homeClubIds, setHomeClubIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listClubs()
      .then(setClubs)
      .catch(() => setClubs([]));
  }, []);

  function toggleHomeClub(clubId: string) {
    setHomeClubIds((prev) =>
      prev.includes(clubId) ? prev.filter((id) => id !== clubId) : [...prev, clubId]
    );
  }

  async function handleSave() {
    if (!firebaseUser) return;
    if (!name.trim()) {
      Alert.alert('Falta tu nombre', 'Ingresá cómo querés que te vean los demás jugadores.');
      return;
    }
    if (!phone.trim() || phone.trim() === PHONE_PREFIX) {
      Alert.alert('Falta tu teléfono', 'Lo van a necesitar los demás jugadores para coordinar por WhatsApp.');
      return;
    }
    if (categoryMin > categoryMax) {
      Alert.alert('Categoría inválida', 'La categoría mínima no puede ser mayor que la máxima.');
      return;
    }

    setSaving(true);
    try {
      await createUser({
        id: firebaseUser.uid,
        name: name.trim(),
        email: firebaseUser.email ?? '',
        phone: phone.trim(),
        category: { min: categoryMin, max: categoryMax },
        gender,
        homeClubIds,
        role: 'player',
        createdAt: Date.now(),
      });
      if (firebaseUser.email) {
        await setPhoneDirectoryEntry(phone.trim(), firebaseUser.email);
      }
      await refreshAppUser();
    } catch (err: any) {
      Alert.alert('No se pudo guardar tu perfil', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Completá tu perfil</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} placeholder="Tu nombre" value={name} onChangeText={setName} />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        placeholder="+54 9 3764 501234"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>Género</Text>
      <View style={styles.chipsRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.chip, gender === g.value && styles.chipSelected]}
            onPress={() => setGender(g.value)}
          >
            <Text style={[styles.chipText, gender === g.value && styles.chipTextSelected]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Categoría (rango que jugás)</Text>
      <Text style={styles.sublabel}>Desde</Text>
      <View style={styles.chipsRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={`min-${c}`}
            style={[styles.chip, categoryMin === c && styles.chipSelected]}
            onPress={() => setCategoryMin(c)}
          >
            <Text style={[styles.chipText, categoryMin === c && styles.chipTextSelected]}>{categoryLabel(c)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sublabel}>Hasta</Text>
      <View style={styles.chipsRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={`max-${c}`}
            style={[styles.chip, categoryMax === c && styles.chipSelected]}
            onPress={() => setCategoryMax(c)}
          >
            <Text style={[styles.chipText, categoryMax === c && styles.chipTextSelected]}>{categoryLabel(c)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {clubs.length > 0 && (
        <>
          <Text style={styles.label}>Clubes donde solés jugar</Text>
          <View style={styles.chipsRow}>
            {clubs.map((club) => (
              <TouchableOpacity
                key={club.id}
                style={[styles.chip, homeClubIds.includes(club.id) && styles.chipSelected]}
                onPress={() => toggleHomeClub(club.id)}
              >
                <Text
                  style={[styles.chipText, homeClubIds.includes(club.id) && styles.chipTextSelected]}
                >
                  {club.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar y continuar</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  sublabel: { fontSize: 13, color: '#666', marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16, marginTop: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipSelected: { backgroundColor: '#1b7f3a', borderColor: '#1b7f3a' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, marginTop: 28, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
