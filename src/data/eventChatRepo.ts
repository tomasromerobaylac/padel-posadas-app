import { addDoc, collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';
import { makeConverter } from './firestoreHelpers';
import type { ChatMessage } from '../types/domain';

const path = 'events';

/** Chat entre los anotados a un partido puntual (subcolección del propio evento). */
export function subscribeToEventMessages(
  eventId: string,
  onChange: (messages: ChatMessage[]) => void
): Unsubscribe {
  const col = collection(db, path, eventId, 'messages').withConverter(makeConverter<ChatMessage>());
  const q = query(col, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => onChange(snap.docs.map((d) => d.data())));
}

export async function sendEventMessage(eventId: string, senderId: string, text: string): Promise<void> {
  const col = collection(db, path, eventId, 'messages').withConverter(makeConverter<ChatMessage>());
  await addDoc(col, { senderId, text, createdAt: Date.now() } as ChatMessage);
}
