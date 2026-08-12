import { getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { typedCollection, typedDoc } from './firestoreHelpers';
import { createClub } from './clubsRepo';
import { updateUser } from './usersRepo';
import type { ClubOwnerRequest } from '../types/domain';

const path = 'clubOwnerRequests';

/**
 * Una sola solicitud por cuenta (el id del documento es el userId del solicitante),
 * para que no se puedan mandar decenas de solicitudes fantasma desde la misma cuenta.
 * Si la anterior fue rechazada, se puede volver a enviar (pisa el mismo documento).
 */
export async function getClubOwnerRequestForUser(userId: string): Promise<ClubOwnerRequest | null> {
  const snap = await getDoc(typedDoc<ClubOwnerRequest>(path, userId));
  return snap.exists() ? snap.data() : null;
}

export async function submitClubOwnerRequest(
  request: Omit<ClubOwnerRequest, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const ref = typedDoc<ClubOwnerRequest>(path, request.requesterUserId);
  await setDoc(ref, {
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

/**
 * Crea el club a partir de los datos de la solicitud, vincula al solicitante como
 * club_owner de ese club, y marca la solicitud como aprobada. Solo puede ejecutarlo
 * un admin (las security rules restringen la creación de clubes y el cambio de rol).
 */
export async function approveClubOwnerRequest(
  request: ClubOwnerRequest,
  adminUserId: string
): Promise<string> {
  const clubId = await createClub({
    name: request.clubName,
    aliases: [],
    address: request.clubAddress,
    slotDurationMinutes: 120,
    ownerUserId: request.requesterUserId,
    createdAt: Date.now(),
  });
  await updateUser(request.requesterUserId, { role: 'club_owner' });
  await reviewClubOwnerRequest(request.id, 'approved', adminUserId);
  return clubId;
}

export async function rejectClubOwnerRequest(requestId: string, adminUserId: string): Promise<void> {
  await reviewClubOwnerRequest(requestId, 'rejected', adminUserId);
}
