// ─── Status & Transitions ─────────────────────────────────────────────────────

export type ParkingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'checked_in'
  | 'checked_out';

export type TruckType = 'solo' | 'semi' | 'tanker' | string;

export const STATUS_TRANSITIONS: Record<ParkingStatus, ParkingStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['checked_in'],
  checked_in: ['checked_out'],
  rejected: [],
  checked_out: [],
};

export const FINAL_STATES: ParkingStatus[] = ['rejected', 'checked_out'];

export function isFinalState(status: ParkingStatus): boolean {
  return FINAL_STATES.includes(status);
}

// ─── Data Model ───────────────────────────────────────────────────────────────

export interface ParkingRequest {
  id: string;
  driverName: string;
  licensePlate: string;
  truckType: TruckType;
  requestedFrom: string;
  requestedUntil: string;
  status: ParkingStatus;
  parkingSpotId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API DTOs ─────────────────────────────────────────────────────────────────

export interface CreateParkingRequestDto {
  driverName: string;
  licensePlate: string;
  truckType: TruckType;
  requestedFrom: string;
  requestedUntil: string;
  parkingSpotId?: string;
  note?: string;
}

export interface UpdateStatusDto {
  status: ParkingStatus;
  parkingSpotId?: string;
  note?: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  RequestList: undefined;
  RequestDetail: { requestId: string };
};

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  reply: string;
  suggestedAction: {
    type: 'updateStatus';
    requestId: string;
    newStatus: ParkingStatus;
    parkingSpotId?: string;
  } | null;
  updatedHistory: ChatMessage[];
}
