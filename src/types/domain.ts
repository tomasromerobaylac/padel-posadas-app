// Categorías reales de pádel argentino: 1ra (más alta) a 8va (principiante).
export type Category = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CategoryRange {
  min: Category;
  max: Category;
}

export type Gender = 'masculino' | 'femenino' | 'otro';
export type MatchType = 'masculino' | 'femenino' | 'mixto' | 'indistinto';
export type EventMode = 'individual' | 'pareja';
export type EventStatus = 'abierto' | 'completo' | 'cancelado';
export type UserRole = 'player' | 'club_owner' | 'admin';
export type ClubOwnerRequestStatus = 'pending' | 'approved' | 'rejected';
export type ParticipantStatus = 'confirmado' | 'pendiente';
export type InviteStatus = 'pendiente' | 'aceptada' | 'rechazada';
export type FriendRequestStatus = 'pendiente' | 'aceptada' | 'rechazada';

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  category: CategoryRange;
  gender: Gender;
  photoUrl?: string;
  homeArea?: string;
  homeClubIds: string[];
  role: UserRole;
  createdAt: number;
}

export interface Club {
  id: string;
  name: string;
  aliases: string[];
  address: string;
  location?: { lat: number; lng: number };
  courtCount?: number;
  slotDurationMinutes: number; // 120 por defecto
  ownerUserId?: string | null;
  createdAt: number;
}

export interface ClubOwnerRequest {
  id: string;
  requesterUserId: string;
  contactName: string;
  contactPhone: string;
  clubName: string;
  clubAddress: string;
  status: ClubOwnerRequestStatus;
  reviewedByUserId?: string;
  createdAt: number;
}

// Turno de duración fija (slotStart/slotEnd), no rango horario libre.
export interface TimeSlot {
  slotStart: number; // epoch ms
  slotEnd: number; // epoch ms
}

export interface PadelEvent extends TimeSlot {
  id: string;
  organizerUserId: string;
  clubId: string;
  courtsReserved: number;
  totalSlots: number;
  filledSlots: number;
  categoryRange: CategoryRange;
  matchType: MatchType;
  mode: EventMode;
  status: EventStatus;
  inviteLinkToken: string;
  createdAt: number;
}

export interface EventParticipant {
  id: string;
  userId?: string;
  pairId?: string;
  status: ParticipantStatus;
  joinedAt: number;
}

export interface Pair {
  id: string;
  userIds: [string, string];
}

export interface CourtPost extends TimeSlot {
  id: string;
  publishedByUserId: string;
  clubId: string;
  derivedEventId?: string;
  createdAt: number;
}

export interface FriendLink {
  friendUserId: string;
  since: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: number;
}

export interface Invite {
  id: string;
  fromUserId: string;
  toUserId: string;
  eventId: string;
  status: InviteStatus;
  createdAt: number;
}
