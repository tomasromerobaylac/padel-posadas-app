import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../src/firebase/config';
import { clearPendingVerification, getPendingVerification } from '../../src/auth/phoneAuthFlow';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { verificationId, phoneNumber } = getPendingVerification();

  async function handleVerify() {
    if (!verificationId) {
      Alert.alert('Sesión expirada', 'Volvé a pedir el código.');
      return;
    }
    setVerifying(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      clearPendingVerification();
      // La navegación post-login la resuelve el AuthGate en app/_layout.tsx
    } catch (err: any) {
      Alert.alert('Código incorrecto', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificá tu número</Text>
      <Text style={styles.subtitle}>Te enviamos un código a {phoneNumber}</Text>

      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        autoFocus
        maxLength={6}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={verifying}>
        {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 6,
  },
  button: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, marginTop: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
