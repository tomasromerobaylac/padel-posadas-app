import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { makeConverter, typedCollection, typedDoc } from './firestoreHelpers';
import type { ChatMessage, DirectChatThread } from '../types/domain';

const path = 'directChats';

function directChatId(userAId: string, userBId: string): string {
  return [userAId, userBId].sort().join('__');
}

export async function getOrCreateDirectChat(userAId: string, userBId: string): Promise<DirectChatThread> {
  const id = directChatId(userAId, userBId);
  const ref = typedDoc<DirectChatThread>(path, id);
  const existing = await getDoc(ref);
  if (existing.exists()) return existing.data();

  const chat: DirectChatThread = {
    id,
    participantIds: [userAId, userBId].sort() as [string, string],
    createdAt: Date.now(),
  };
  await setDoc(ref, chat);
  return chat;
}

export async function listDirectChatsForUser(userId: string): Promise<DirectChatThread[]> {
  const q = query(typedCollection<DirectChatThread>(path), where('participantIds', 'array-contains', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export function subscribeToDirectMessages(chatId: string, onChange: (messages: ChatMessage[]) => void): Unsubscribe {
  const col = collection(db, path, chatId, 'messages').withConverter(makeConverter<ChatMessage>());
  const q = query(col, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => onChange(snap.docs.map((d) => d.data())));
}

export async function sendDirectMessage(chatId: string, senderId: string, text: string): Promise<void> {
  const col = collection(db, path, chatId, 'messages').withConverter(makeConverter<ChatMessage>());
  const createdAt = Date.now();
  await addDoc(col, { senderId, text, createdAt } as ChatMessage);
  await updateDoc(typedDoc<DirectChatThread>(path, chatId), { lastMessageText: text, lastMessageAt: createdAt });
}
