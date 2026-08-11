import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { makeConverter } from './firestoreHelpers';
import type { FriendLink } from '../types/domain';

type FriendEntry = FriendLink & { id: string };

function friendsCollection(userId: string) {
  return collection(db, 'friends', userId, 'list').withConverter(makeConverter<FriendEntry>());
}

export async function listFriends(userId: string): Promise<FriendEntry[]> {
  const snap = await getDocs(friendsCollection(userId));
  return snap.docs.map((d) => d.data());
}

/** Amistad simétrica: se guarda en ambos lados para poder consultar la lista de cada usuario directamente. */
export async function addFriend(userId: string, friendUserId: string): Promise<void> {
  const since = Date.now();
  await Promise.all([
    setDoc(doc(db, 'friends', userId, 'list', friendUserId), { friendUserId, since }),
    setDoc(doc(db, 'friends', friendUserId, 'list', userId), { friendUserId: userId, since }),
  ]);
}

export async function removeFriend(userId: string, friendUserId: string): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, 'friends', userId, 'list', friendUserId)),
    deleteDoc(doc(db, 'friends', friendUserId, 'list', userId)),
  ]);
}
