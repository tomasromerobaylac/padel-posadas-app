import { addDoc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { typedCollection, typedDoc } from './firestoreHelpers';
import type { Club } from '../types/domain';

const path = 'clubs';

/** Lectura pública: cualquier usuario puede listar clubes para elegir uno al crear un evento. */
export async function listClubs(): Promise<Club[]> {
  const snap = await getDocs(typedCollection<Club>(path));
  return snap.docs.map((d) => d.data());
}

export async function getClub(clubId: string): Promise<Club | null> {
  const snap = await getDoc(typedDoc<Club>(path, clubId));
  return snap.exists() ? snap.data() : null;
}

export async function listClubsOwnedBy(ownerUserId: string): Promise<Club[]> {
  const q = query(typedCollection<Club>(path), where('ownerUserId', '==', ownerUserId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

/** Solo debe invocarse desde flujos de admin/club_owner; la escritura real la restringen las security rules. */
export async function createClub(club: Omit<Club, 'id'>): Promise<string> {
  const ref = await addDoc(typedCollection<Club>(path), club as Club);
  return ref.id;
}

export async function updateClub(clubId: string, patch: Partial<Club>): Promise<void> {
  await updateDoc(typedDoc<Club>(path, clubId), patch);
}
