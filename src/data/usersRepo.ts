import { doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { typedCollection, typedDoc } from './firestoreHelpers';
import type { AppUser } from '../types/domain';

const path = 'users';
const phoneDirectoryPath = 'phoneDirectory';

export async function getUser(userId: string): Promise<AppUser | null> {
  const snap = await getDoc(typedDoc<AppUser>(path, userId));
  return snap.exists() ? snap.data() : null;
}

export async function createUser(user: AppUser): Promise<void> {
  await setDoc(typedDoc<AppUser>(path, user.id), user);
}

export async function updateUser(userId: string, patch: Partial<AppUser>): Promise<void> {
  await updateDoc(typedDoc<AppUser>(path, userId), patch);
}

export async function findUserByPhone(phone: string): Promise<AppUser | null> {
  const q = query(typedCollection<AppUser>(path), where('phone', '==', phone));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
}

/**
 * Mapea teléfono -> email en una colección aparte, de solo {email}, para poder
 * resolverlo ANTES de loguearse (la colección `users` requiere estar autenticado
 * para leerse). Se escribe una vez al completar el perfil.
 */
export async function setPhoneDirectoryEntry(phone: string, email: string): Promise<void> {
  await setDoc(doc(db, phoneDirectoryPath, phone), { email });
}

export async function getEmailByPhone(phone: string): Promise<string | null> {
  const snap = await getDoc(doc(db, phoneDirectoryPath, phone));
  return snap.exists() ? (snap.data().email as string) : null;
}
