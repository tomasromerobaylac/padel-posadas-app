import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateClub } from '../data/clubsRepo';
import { uploadImageToImgbb } from '../data/imageUpload';
import type { Club, ClubAmenities } from '../types/domain';

const DEFAULT_AMENITIES: ClubAmenities = { ventaAccesorios: false, parrillas: false, cantina: false };

export function ClubEditForm({ club, onSaved }: { club: Club; onSaved: () => void }) {
  const [description, setDescription] = useState(club.description ?? '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(club.googleMapsUrl ?? '');
  const [paymentAlias, setPaymentAlias] = useState(club.paymentAlias ?? '');
  const [photoUrl, setPhotoUrl] = useState(club.photoUrl ?? '');
  const [pricePerSlot, setPricePerSlot] = useState(club.pricePerSlot ? String(club.pricePerSlot) : '');
  const [amenities, setAmenities] = useState<ClubAmenities>(club.amenities ?? DEFAULT_AMENITIES);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function toggleAmenity(key: keyof ClubAmenities) {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para poder subir la imagen del club.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    setUploadingPhoto(true);
    try {
      const url = await uploadImageToImgbb(result.assets[0].base64);
      setPhotoUrl(url);
    } catch (err: any) {
      Alert.alert('No se pudo subir la foto', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateClub(club.id, {
        description: description.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        paymentAlias: paymentAlias.trim(),
        photoUrl: photoUrl.trim(),
        ...(pricePerSlot.trim() ? { pricePerSlot: Number(pricePerSlot.trim()) } : {}),
        amenities,
      });
      onSaved();
    } catch (err: any) {
      Alert.alert('No se pudo guardar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        placeholder="Contale a los jugadores sobre tu club..."
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Link de Google Maps</Text>
      <TextInput
        style={styles.input}
        placeholder="https://maps.app.goo.gl/..."
        autoCapitalize="none"
        value={googleMapsUrl}
        onChangeText={setGoogleMapsUrl}
      />

      <Text style={styles.label}>Foto del club</Text>
      {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.photoPreview} resizeMode="cover" /> : null}
      <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto} disabled={uploadingPhoto}>
        {uploadingPhoto ? (
          <ActivityIndicator color="#4a3f7a" />
        ) : (
          <Text style={styles.photoButtonText}>{photoUrl ? 'Cambiar foto' : 'Elegir foto'}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Precio del turno ({club.slotDurationMinutes} min)</Text>
      <TextInput
        style={styles.input}
        placeholder="60000"
        keyboardType="numeric"
        value={pricePerSlot}
        onChangeText={setPricePerSlot}
      />

      <Text style={styles.label}>Alias o CBU para transferencias</Text>
      <TextInput
        style={styles.input}
        placeholder="cancha.arena.mp"
        autoCapitalize="none"
        value={paymentAlias}
        onChangeText={setPaymentAlias}
      />
      <Text style={[styles.hint, { marginTop: 4 }]}>
        Si lo cargás, cada jugador va a poder copiarlo desde el partido y transferirte su parte
        directo, sin pasar por la cantina.
      </Text>

      <Text style={styles.label}>Servicios</Text>
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.chip, amenities.ventaAccesorios && styles.chipSelected]}
          onPress={() => toggleAmenity('ventaAccesorios')}
        >
          <Text style={[styles.chipText, amenities.ventaAccesorios && styles.chipTextSelected]}>Venta de accesorios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, amenities.parrillas && styles.chipSelected]}
          onPress={() => toggleAmenity('parrillas')}
        >
          <Text style={[styles.chipText, amenities.parrillas && styles.chipTextSelected]}>Parrillas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, amenities.cantina && styles.chipSelected]}
          onPress={() => toggleAmenity('cantina')}
        >
          <Text style={[styles.chipText, amenities.cantina && styles.chipTextSelected]}>Cantina</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        El mapa de distribución de canchas va a estar disponible cuando pasemos al plan pago de Firebase.
      </Text>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar cambios</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, paddingBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 14, marginTop: 4 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
  chipSelected: { backgroundColor: '#1b7f3a', borderColor: '#1b7f3a' },
  chipText: { color: '#333', fontSize: 13 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  hint: { fontSize: 12, color: '#999', marginTop: 20, fontStyle: 'italic' },
  photoPreview: { width: '100%', height: 160, borderRadius: 12, marginTop: 6 },
  photoButton: {
    backgroundColor: '#f3f0ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0d8fb',
  },
  photoButtonText: { color: '#4a3f7a', fontWeight: '700', fontSize: 13 },
  saveButton: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, marginTop: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
