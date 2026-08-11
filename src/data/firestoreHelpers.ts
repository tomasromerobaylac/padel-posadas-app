import {
  collection,
  doc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';

/** Convierte documentos de Firestore a/desde un tipo de dominio con `id`, sin volcar `id` al doc guardado. */
export function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T): DocumentData {
      const { id, ...rest } = model;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return { id: snapshot.id, ...(snapshot.data() as Omit<T, 'id'>) } as T;
    },
  };
}

export function typedCollection<T extends { id: string }>(path: string) {
  return collection(db, path).withConverter(makeConverter<T>());
}

export function typedDoc<T extends { id: string }>(path: string, id: string) {
  return doc(db, path, id).withConverter(makeConverter<T>());
}
