import { getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { typedCollection, typedDoc } from './firestoreHelpers';
import type { AppUser } from '../types/domain';

const path = 'users';

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
