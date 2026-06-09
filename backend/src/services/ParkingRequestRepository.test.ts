import { beforeEach, describe, it, expect } from '@jest/globals';
import {
  findAll, findById, create, updateStatus, deleteById, clearStore,
  NotFoundError, InvalidTransitionError, FinalStateError, ValidationError,
} from '../services/ParkingRequestRepository';
import { CreateParkingRequestDto } from '../models/ParkingRequest';

const makeDto = (overrides: Partial<CreateParkingRequestDto> = {}): CreateParkingRequestDto => ({
  driverName: 'Test Driver',
  licensePlate: 'AB-CD 1234',
  truckType: 'solo',
  requestedFrom: new Date(Date.now() + 3600_000).toISOString(),
  requestedUntil: new Date(Date.now() + 7200_000).toISOString(),
  ...overrides,
});


beforeEach(() => clearStore());

describe('create', () => {
  it('creates a request with pending status', () => {
    const result = create(makeDto());
    expect(result.id).toMatch(/^parking_/);
    expect(result.status).toBe('pending');
  });

  it('normalises licensePlate to uppercase', () => {
    expect(create(makeDto({ licensePlate: 'ab-cd 1234' })).licensePlate).toBe('AB-CD 1234');
  });

  it('throws ValidationError for missing required fields', () => {
    expect(() => create(makeDto({ driverName: '' }))).toThrow(ValidationError);
    expect(() => create(makeDto({ licensePlate: '' }))).toThrow(ValidationError);
  });

  it('throws ValidationError when requestedFrom >= requestedUntil', () => {
    const ts = new Date().toISOString();
    expect(() => create(makeDto({ requestedFrom: ts, requestedUntil: ts }))).toThrow(ValidationError);
  });

  it('throws ValidationError for invalid ISO dates', () => {
    expect(() => create(makeDto({ requestedFrom: 'not-a-date' }))).toThrow(ValidationError);
  });
});

describe('findAll', () => {
  it('returns empty array when store is empty', () => {
    expect(findAll()).toEqual([]);
  });

  it('returns all requests newest first', async () => {
    create(makeDto({ driverName: 'Driver A' }));
    await new Promise(r => setTimeout(r, 5));
    create(makeDto({ driverName: 'Driver B' }));
    const all = findAll();
    expect(all).toHaveLength(2);
    expect(all[0].driverName).toBe('Driver B');
  });
});

describe('findById', () => {
  it('returns the correct request', () => {
    const created = create(makeDto());
    expect(findById(created.id)).toEqual(created);
  });

  it('throws NotFoundError for unknown id', () => {
    expect(() => findById('parking_unknown')).toThrow(NotFoundError);
  });
});

describe('updateStatus', () => {
  it('allows pending → approved', () => {
    const req = create(makeDto());
    const updated = updateStatus(req.id, { status: 'approved', parkingSpotId: 'A1' });
    expect(updated.status).toBe('approved');
    expect(updated.parkingSpotId).toBe('A1');
  });

  it('allows pending → rejected', () => {
    const req = create(makeDto());
    expect(updateStatus(req.id, { status: 'rejected' }).status).toBe('rejected');
  });

  it('allows approved → checked_in', () => {
    const req = create(makeDto());
    updateStatus(req.id, { status: 'approved' });
    expect(updateStatus(req.id, { status: 'checked_in' }).status).toBe('checked_in');
  });

  it('allows checked_in → checked_out', () => {
    const req = create(makeDto());
    updateStatus(req.id, { status: 'approved' });
    updateStatus(req.id, { status: 'checked_in' });
    expect(updateStatus(req.id, { status: 'checked_out' }).status).toBe('checked_out');
  });

  it('throws InvalidTransitionError for illegal transition', () => {
    const req = create(makeDto());
    expect(() => updateStatus(req.id, { status: 'checked_in' })).toThrow(InvalidTransitionError);
  });

  it('throws FinalStateError when modifying rejected', () => {
    const req = create(makeDto());
    updateStatus(req.id, { status: 'rejected' });
    expect(() => updateStatus(req.id, { status: 'approved' })).toThrow(FinalStateError);
  });

  it('throws FinalStateError when modifying checked_out', () => {
    const req = create(makeDto());
    updateStatus(req.id, { status: 'approved' });
    updateStatus(req.id, { status: 'checked_in' });
    updateStatus(req.id, { status: 'checked_out' });
    expect(() => updateStatus(req.id, { status: 'checked_in' })).toThrow(FinalStateError);
  });

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateStatus('parking_nope', { status: 'approved' })).toThrow(NotFoundError);
  });

  it('updates the updatedAt timestamp', async () => {
    const req = create(makeDto());
    await new Promise(r => setTimeout(r, 5));
    const updated = updateStatus(req.id, { status: 'approved' });
    expect(updated.updatedAt).not.toBe(req.updatedAt);
  });
});

describe('deleteById', () => {
  it('deletes a pending request', () => {
    const req = create(makeDto());
    deleteById(req.id);
    expect(() => findById(req.id)).toThrow(NotFoundError);
  });

  it('throws FinalStateError when deleting rejected', () => {
    const req = create(makeDto());
    updateStatus(req.id, { status: 'rejected' });
    expect(() => deleteById(req.id)).toThrow(FinalStateError);
  });

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteById('parking_nope')).toThrow(NotFoundError);
  });
});
