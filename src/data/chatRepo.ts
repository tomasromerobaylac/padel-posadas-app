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
import type { ChatMessage, ChatThread } from '../types/domain';

const path = 'chats';

function chatId(clubId: string, playerUserId: string): string {
  return `${clubId}__${playerUserId}`;
}

/** Un solo hilo por club+jugador; se crea la primera vez que el jugador escribe. */
export async function getOrCreateChat(
  clubId: string,
  ownerUserId: string,
  playerUserId: string
): Promise<ChatThread> {
  const id = chatId(clubId, playerUserId);
  const ref = typedDoc<ChatThread>(path, id);
  const existing = await getDoc(ref);
  if (existing.exists()) return existing.data();

  const chat: ChatThread = { id, clubId, ownerUserId, playerUserId, createdAt: Date.now() };
  await setDoc(ref, chat);
  return chat;
}

export async function listChatsForUser(userId: string): Promise<ChatThread[]> {
  const [asOwner, asPlayer] = await Promise.all([
    getDocs(query(typedCollection<ChatThread>(path), where('ownerUserId', '==', userId))),
    getDocs(query(typedCollection<ChatThread>(path), where('playerUserId', '==', userId))),
  ]);
  return [...asOwner.docs, ...asPlayer.docs].map((d) => d.data());
}

export function subscribeToMessages(
  chatId: string,
  onChange: (messages: ChatMessage[]) => void
): Unsubscribe {
  const col = collection(db, path, chatId, 'messages')
    .withConverter(makeConverter<ChatMessage>());
  const q = query(col, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => onChange(snap.docs.map((d) => d.data())));
}

export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
  const col = collection(db, path, chatId, 'messages').withConverter(makeConverter<ChatMessage>());
  const createdAt = Date.now();
  await addDoc(col, { senderId, text, createdAt } as ChatMessage);
  await updateDoc(typedDoc<ChatThread>(path, chatId), { lastMessageText: text, lastMessageAt: createdAt });
}
