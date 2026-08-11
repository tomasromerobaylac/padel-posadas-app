import { getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { typedDoc } from './firestoreHelpers';
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
