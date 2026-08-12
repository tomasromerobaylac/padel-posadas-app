import { addDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { typedCollection, typedDoc } from './firestoreHelpers';
import type { CourtPost } from '../types/domain';

const path = 'courtPosts';

export async function listOpenCourtPosts(): Promise<CourtPost[]> {
  const q = query(typedCollection<CourtPost>(path), where('derivedEventId', '==', null));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function listCourtPostsByClub(clubId: string): Promise<CourtPost[]> {
  const q = query(typedCollection<CourtPost>(path), where('clubId', '==', clubId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function createCourtPost(post: Omit<CourtPost, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(typedCollection<CourtPost>(path), {
    ...post,
    createdAt: Date.now(),
  } as CourtPost);
  return ref.id;
}

export async function linkCourtPostToEvent(postId: string, eventId: string): Promise<void> {
  await updateDoc(typedDoc<CourtPost>(path, postId), { derivedEventId: eventId });
}
