import { addDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { typedCollection, typedDoc } from './firestoreHelpers';
import type { ClubOwnerRequest } from '../types/domain';

const path = 'clubOwnerRequests';

export async function submitClubOwnerRequest(
  request: Omit<ClubOwnerRequest, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(typedCollection<ClubOwnerRequest>(path), {
    ...request,
    status: 'pending',
    createdAt: Date.now(),
  } as ClubOwnerRequest);
  return ref.id;
}

export async function listPendingClubOwnerRequests(): Promise<ClubOwnerRequest[]> {
  const q = query(typedCollection<ClubOwnerRequest>(path), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function reviewClubOwnerRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  reviewedByUserId: string
): Promise<void> {
  await updateDoc(typedDoc<ClubOwnerRequest>(path, requestId), { status, reviewedByUserId });
}
