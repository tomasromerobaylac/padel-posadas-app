// Estado efímero compartido entre las pantallas de login y verificación de OTP.
// No necesita persistencia: si el usuario cierra la app a mitad del flujo, se reinicia.
let pendingVerificationId: string | null = null;
let pendingPhoneNumber: string | null = null;

export function setPendingVerification(verificationId: string, phoneNumber: string) {
  pendingVerificationId = verificationId;
  pendingPhoneNumber = phoneNumber;
}

export function getPendingVerification() {
  return { verificationId: pendingVerificationId, phoneNumber: pendingPhoneNumber };
}

export function clearPendingVerification() {
  pendingVerificationId = null;
  pendingPhoneNumber = null;
}
