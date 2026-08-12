import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { typedCollection, typedDoc, makeConverter } from './firestoreHelpers';
import type { EventParticipant, PadelEvent } from '../types/domain';

const path = 'events';

export async function getOpenEvents(): Promise<PadelEvent[]> {
  const q = query(typedCollection<PadelEvent>(path), where('status', '==', 'abierto'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function listEventsByClub(clubId: string): Promise<PadelEvent[]> {
  const q = query(typedCollection<PadelEvent>(path), where('clubId', '==', clubId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function getEvent(eventId: string): Promise<PadelEvent | null> {
  const snap = await getDoc(typedDoc<PadelEvent>(path, eventId));
  return snap.exists() ? snap.data() : null;
}

export async function createEvent(
  event: Omit<PadelEvent, 'id' | 'filledSlots' | 'status' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(typedCollection<PadelEvent>(path), {
    ...event,
    filledSlots: 0,
    status: 'abierto',
    createdAt: Date.now(),
  } as PadelEvent);
  return ref.id;
}

export async function listParticipants(eventId: string): Promise<EventParticipant[]> {
  const col = collection(db, path, eventId, 'participants').withConverter(
    makeConverter<EventParticipant>()
  );
  const snap = await getDocs(col);
  return snap.docs.map((d) => d.data());
}

/**
 * Anota a un usuario (o pareja) al evento dentro de una transacción para que el cupo
 * (`filledSlots`) nunca supere `totalSlots` aunque dos personas se anoten al mismo tiempo.
 */
export async function joinEvent(
  eventId: string,
  participant: { userId?: string; pairId?: string }
): Promise<void> {
  const slotsToFill = participant.pairId ? 2 : 1;
  const eventRef = doc(db, path, eventId);
  const participantRef = doc(collection(db, path, eventId, 'participants'));

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists()) throw new Error('Evento no encontrado');
    const event = eventSnap.data() as PadelEvent;

    if (event.status !== 'abierto') throw new Error('El evento ya no está abierto');
    if (event.filledSlots + slotsToFill > event.totalSlots) {
      throw new Error('No hay cupo suficiente');
    }

    tx.set(participantRef, {
      ...participant,
      status: 'confirmado',
      joinedAt: Date.now(),
    });

    const newFilled = event.filledSlots + slotsToFill;
    tx.update(eventRef, {
      filledSlots: increment(slotsToFill),
      status: newFilled >= event.totalSlots ? 'completo' : 'abierto',
    });
  });
}
