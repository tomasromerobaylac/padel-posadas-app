import { addDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { typedCollection, typedDoc } from './firestoreHelpers';
import type { Invite } from '../types/domain';

const path = 'invites';

export async function sendInvite(fromUserId: string, toUserId: string, eventId: string): Promise<string> {
  const ref = await addDoc(typedCollection<Invite>(path), {
    fromUserId,
    toUserId,
    eventId,
    status: 'pendiente',
    createdAt: Date.now(),
  } as Invite);
  return ref.id;
}

export async function listInvitesForUser(toUserId: string): Promise<Invite[]> {
  const q = query(typedCollection<Invite>(path), where('toUserId', '==', toUserId), where('status', '==', 'pendiente'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function respondInvite(inviteId: string, status: 'aceptada' | 'rechazada'): Promise<void> {
  await updateDoc(typedDoc<Invite>(path, inviteId), { status });
}
