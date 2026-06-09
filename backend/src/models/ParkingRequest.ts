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

export function isValidTransition(from: ParkingStatus, to: ParkingStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

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
