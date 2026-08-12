import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { makeConverter, typedCollection, typedDoc } from './firestoreHelpers';
import type { FriendLink, FriendRequest } from '../types/domain';

type FriendEntry = FriendLink & { id: string };
const requestsPath = 'friendRequests';

function friendsCollection(userId: string) {
  return collection(db, 'friends', userId, 'list').withConverter(makeConverter<FriendEntry>());
}

export async function listFriends(userId: string): Promise<FriendEntry[]> {
  const snap = await getDocs(friendsCollection(userId));
  return snap.docs.map((d) => d.data());
}

/** Amistad simétrica: se guarda en ambos lados para poder consultar la lista de cada usuario directamente. */
async function addFriend(userId: string, friendUserId: string): Promise<void> {
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

/** Pide amistad en vez de agregar directo; el otro usuario tiene que aceptarla. */
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<string> {
  const ref = doc(collection(db, requestsPath)).withConverter(makeConverter<FriendRequest>());
  await setDoc(ref, {
    id: ref.id,
    fromUserId,
    toUserId,
    status: 'pendiente',
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function listIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const q = query(
    typedCollection<FriendRequest>(requestsPath),
    where('toUserId', '==', userId),
    where('status', '==', 'pendiente')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function acceptFriendRequest(request: FriendRequest): Promise<void> {
  await addFriend(request.fromUserId, request.toUserId);
  await updateDoc(typedDoc<FriendRequest>(requestsPath, request.id), { status: 'aceptada' });
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await updateDoc(typedDoc<FriendRequest>(requestsPath, requestId), { status: 'rechazada' });
}
