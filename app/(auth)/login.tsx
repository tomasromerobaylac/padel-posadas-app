import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PhoneAuthProvider } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { auth, firebaseConfig } from '../../src/firebase/config';
import { setPendingVerification } from '../../src/auth/phoneAuthFlow';

export default function LoginScreen() {
  const [localNumber, setLocalNumber] = useState('');
  const [sending, setSending] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const router = useRouter();

  async function handleSendCode() {
    const digits = localNumber.replace(/\D/g, '');
    if (digits.length < 8) {
      Alert.alert('Número inválido', 'Ingresá tu número con característica, sin el 0 ni el 15 (ej: 3764501234).');
      return;
    }
    const phoneNumber = `+549${digits}`;

    setSending(true);
    try {
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier.current!);
      setPendingVerification(verificationId, phoneNumber);
      router.push('/verify');
    } catch (err: any) {
      Alert.alert('No se pudo enviar el código', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />
      <Text style={styles.title}>Pádel Posadas</Text>
      <Text style={styles.subtitle}>Ingresá con tu número, como en WhatsApp</Text>

      <View style={styles.phoneRow}>
        <Text style={styles.prefix}>+54 9</Text>
        <TextInput
          style={styles.input}
          placeholder="3764 501234"
          keyboardType="phone-pad"
          value={localNumber}
          onChangeText={setLocalNumber}
          autoFocus
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={sending}>
        {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar código</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 10 },
  prefix: { paddingLeft: 14, paddingRight: 4, fontSize: 16, color: '#333' },
  input: { flex: 1, paddingVertical: 14, paddingRight: 14, fontSize: 16 },
  button: { backgroundColor: '#1b7f3a', borderRadius: 10, paddingVertical: 14, marginTop: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
