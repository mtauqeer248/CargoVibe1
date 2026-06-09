import { v4 as uuidv4 } from 'uuid';
import {
  ParkingRequest,
  ParkingStatus,
  CreateParkingRequestDto,
  UpdateStatusDto,
  isValidTransition,
  isFinalState,
} from '../models/ParkingRequest';

// ─── Custom errors ────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(id: string) {
    super(`ParkingRequest '${id}' not found`);
    this.name = 'NotFoundError';
  }
}

export class InvalidTransitionError extends Error {
  constructor(from: ParkingStatus, to: ParkingStatus) {
    super(`Invalid status transition: '${from}' → '${to}'`);
    this.name = 'InvalidTransitionError';
  }
}

export class FinalStateError extends Error {
  constructor(status: ParkingStatus) {
    super(`ParkingRequest is in final state '${status}' and cannot be modified`);
    this.name = 'FinalStateError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const store = new Map<string, ParkingRequest>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();
const generateId = () => `parking_${uuidv4()}`;

function validateCreate(dto: CreateParkingRequestDto): void {
  const required: (keyof CreateParkingRequestDto)[] = [
    'driverName', 'licensePlate', 'truckType', 'requestedFrom', 'requestedUntil',
  ];
  for (const field of required) {
    if (!dto[field]) throw new ValidationError(`Field '${field}' is required`);
  }
  const from = new Date(dto.requestedFrom);
  const until = new Date(dto.requestedUntil);
  if (isNaN(from.getTime())) throw new ValidationError(`'requestedFrom' is not a valid ISO 8601 date`);
  if (isNaN(until.getTime())) throw new ValidationError(`'requestedUntil' is not a valid ISO 8601 date`);
  if (from >= until) throw new ValidationError(`'requestedFrom' must be before 'requestedUntil'`);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function findAll(): ParkingRequest[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function findById(id: string): ParkingRequest {
  const item = store.get(id);
  if (!item) throw new NotFoundError(id);
  return item;
}

export function create(dto: CreateParkingRequestDto): ParkingRequest {
  validateCreate(dto);
  const timestamp = now();
  const request: ParkingRequest = {
    id: generateId(),
    driverName: dto.driverName.trim(),
    licensePlate: dto.licensePlate.trim().toUpperCase(),
    truckType: dto.truckType,
    requestedFrom: dto.requestedFrom,
    requestedUntil: dto.requestedUntil,
    status: 'pending',
    parkingSpotId: dto.parkingSpotId,
    note: dto.note,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.set(request.id, request);
  return request;
}

export function updateStatus(id: string, dto: UpdateStatusDto): ParkingRequest {
  const existing = findById(id);
  if (isFinalState(existing.status)) throw new FinalStateError(existing.status);
  if (!isValidTransition(existing.status, dto.status)) {
    throw new InvalidTransitionError(existing.status, dto.status);
  }
  const updated: ParkingRequest = {
    ...existing,
    status: dto.status,
    parkingSpotId: dto.parkingSpotId ?? existing.parkingSpotId,
    note: dto.note ?? existing.note,
    updatedAt: now(),
  };
  store.set(id, updated);
  return updated;
}

export function deleteById(id: string): void {
  const existing = findById(id);
  if (isFinalState(existing.status)) throw new FinalStateError(existing.status);
  store.delete(id);
}

export function clearStore(): void {
  store.clear();
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

export function seed(): void {
  const samples: CreateParkingRequestDto[] = [
    {
      driverName: 'Hans Müller',
      licensePlate: 'B-LK 1234',
      truckType: 'semi',
      requestedFrom: new Date(Date.now() + 3600_000).toISOString(),
      requestedUntil: new Date(Date.now() + 3600_000 * 5).toISOString(),
      note: 'Carrying hazardous materials, needs corner spot',
    },
    {
      driverName: 'Ahmed Al-Rashid',
      licensePlate: 'M-TR 5678',
      truckType: 'tanker',
      requestedFrom: new Date(Date.now() + 7200_000).toISOString(),
      requestedUntil: new Date(Date.now() + 3600_000 * 8).toISOString(),
    },
    {
      driverName: 'Petra Novak',
      licensePlate: 'N-PX 9012',
      truckType: 'solo',
      requestedFrom: new Date(Date.now() + 1800_000).toISOString(),
      requestedUntil: new Date(Date.now() + 3600_000 * 3).toISOString(),
      note: 'First time at this facility',
    },
  ];
  for (const s of samples) create(s);
  const all = findAll();
  if (all.length > 0) {
    updateStatus(all[all.length - 1].id, { status: 'approved', parkingSpotId: 'SPOT-A3' });
  }
}
