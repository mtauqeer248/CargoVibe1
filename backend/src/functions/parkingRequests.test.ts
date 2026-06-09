import { InvocationContext } from '@azure/functions';
// Provide test runner globals for TypeScript when type defs are not installed
declare const beforeEach: (fn: () => void) => void;
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;
import {
  listParkingRequests,
  getParkingRequest,
  createParkingRequest,
  updateParkingRequestStatus,
  deleteParkingRequest,
} from '../functions/parkingRequests';
import { clearStore } from '../services/ParkingRequestRepository';

// ─── Minimal mocks ────────────────────────────────────────────────────────────

const mockContext = {} as InvocationContext;

function makeRequest(options: {
  params?: Record<string, string>;
  body?: unknown;
} = {}): any {
  return {
    params: options.params ?? {},
    json: async () => options.body ?? {},
  };
}

const validDto = {
  driverName: 'Test Driver',
  licensePlate: 'AB-CD 1234',
  truckType: 'semi',
  requestedFrom: new Date(Date.now() + 3600_000).toISOString(),
  requestedUntil: new Date(Date.now() + 7200_000).toISOString(),
};

beforeEach(() => clearStore());

// ─── listParkingRequests ──────────────────────────────────────────────────────

describe('listParkingRequests', () => {
  it('returns 200 with empty array when store is empty', async () => {
    const res = await listParkingRequests(makeRequest(), mockContext);
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual([]);
  });

  it('returns all created requests', async () => {
    await createParkingRequest(makeRequest({ body: validDto }), mockContext);
    await createParkingRequest(makeRequest({ body: { ...validDto, driverName: 'Driver 2' } }), mockContext);
    const res = await listParkingRequests(makeRequest(), mockContext);
    expect((res.jsonBody as any[]).length).toBe(2);
  });
});

// ─── getParkingRequest ────────────────────────────────────────────────────────

describe('getParkingRequest', () => {
  it('returns 200 with the request', async () => {
    const created = await createParkingRequest(makeRequest({ body: validDto }), mockContext);
    const id = (created.jsonBody as any).id;
    const res = await getParkingRequest(makeRequest({ params: { id } }), mockContext);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await getParkingRequest(makeRequest({ params: { id: 'parking_nope' } }), mockContext);
    expect(res.status).toBe(404);
  });
});

// ─── createParkingRequest ─────────────────────────────────────────────────────

describe('createParkingRequest', () => {
  it('returns 201 with the new request', async () => {
    const res = await createParkingRequest(makeRequest({ body: validDto }), mockContext);
    expect(res.status).toBe(201);
    expect((res.jsonBody as any).status).toBe('pending');
    expect((res.jsonBody as any).id).toMatch(/^parking_/);
  });

  it('returns 400 for missing fields', async () => {
    const res = await createParkingRequest(makeRequest({ body: { driverName: 'Only Name' } }), mockContext);
    expect(res.status).toBe(400);
  });
});

// ─── updateParkingRequestStatus ───────────────────────────────────────────────

describe('updateParkingRequestStatus', () => {
  it('approves a pending request', async () => {
    const created = await createParkingRequest(makeRequest({ body: validDto }), mockContext);
    const id = (created.jsonBody as any).id;
    const res = await updateParkingRequestStatus(
      makeRequest({ params: { id }, body: { status: 'approved', parkingSpotId: 'SPOT-B2' } }),
      mockContext
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).status).toBe('approved');
    expect((res.jsonBody as any).parkingSpotId).toBe('SPOT-B2');
  });

  it('returns 422 for invalid transition', async () => {
    const created = await createParkingRequest(makeRequest({ body: validDto }), mockContext);
    const id = (created.jsonBody as any).id;
    const res = await updateParkingRequestStatus(
      makeRequest({ params: { id }, body: { status: 'checked_in' } }),
      mockContext
    );
    expect(res.status).toBe(422);
  });

  it('returns 409 for final state', async () => {
    const created = await createParkingRequest(makeRequest({ body: validDto }), mockContext);
    const id = (created.jsonBody as any).id;
    await updateParkingRequestStatus(makeRequest({ params: { id }, body: { status: 'rejected' } }), mockContext);
    const res = await updateParkingRequestStatus(
      makeRequest({ params: { id }, body: { status: 'approved' } }),
      mockContext
    );
    expect(res.status).toBe(409);
  });

  it('returns 404 for unknown id', async () => {
    const res = await updateParkingRequestStatus(
      makeRequest({ params: { id: 'parking_nope' }, body: { status: 'approved' } }),
      mockContext
    );
    expect(res.status).toBe(404);
  });
});

// ─── deleteParkingRequest ─────────────────────────────────────────────────────

describe('deleteParkingRequest', () => {
  it('deletes a pending request and returns 204', async () => {
    const created = await createParkingRequest(makeRequest({ body: validDto }), mockContext);
    const id = (created.jsonBody as any).id;
    const res = await deleteParkingRequest(makeRequest({ params: { id } }), mockContext);
    expect(res.status).toBe(204);
    const get = await getParkingRequest(makeRequest({ params: { id } }), mockContext);
    expect(get.status).toBe(404);
  });

  it('returns 409 for final state', async () => {
    const created = await createParkingRequest(makeRequest({ body: validDto }), mockContext);
    const id = (created.jsonBody as any).id;
    await updateParkingRequestStatus(makeRequest({ params: { id }, body: { status: 'rejected' } }), mockContext);
    const res = await deleteParkingRequest(makeRequest({ params: { id } }), mockContext);
    expect(res.status).toBe(409);
  });

  it('returns 404 for unknown id', async () => {
    const res = await deleteParkingRequest(makeRequest({ params: { id: 'parking_nope' } }), mockContext);
    expect(res.status).toBe(404);
  });
});
