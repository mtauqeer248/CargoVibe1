import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  findAll, findById, create, updateStatus, deleteById,
  NotFoundError, InvalidTransitionError, FinalStateError, ValidationError,
} from '../services/ParkingRequestRepository';
import { CreateParkingRequestDto, UpdateStatusDto } from '../models/ParkingRequest';

// ─── Error → HTTP status helper ───────────────────────────────────────────────

function errorResponse(err: unknown): HttpResponseInit {
  if (err instanceof ValidationError)
    return { status: 400, jsonBody: { error: 'Validation Error', details: err.message } };
  if (err instanceof NotFoundError)
    return { status: 404, jsonBody: { error: 'Not Found', details: err.message } };
  if (err instanceof InvalidTransitionError)
    return { status: 422, jsonBody: { error: 'Invalid Status Transition', details: err.message } };
  if (err instanceof FinalStateError)
    return { status: 409, jsonBody: { error: 'Final State Conflict', details: err.message } };

  console.error('[Unhandled Error]', err);
  return { status: 500, jsonBody: { error: 'Internal Server Error' } };
}

// ─── GET /parking-requests ────────────────────────────────────────────────────

export async function listParkingRequests(
  _req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  return { status: 200, jsonBody: findAll() };
}

// ─── GET /parking-requests/{id} ───────────────────────────────────────────────

export async function getParkingRequest(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    return { status: 200, jsonBody: findById(req.params.id) };
  } catch (err) {
    return errorResponse(err);
  }
}

// ─── POST /parking-requests ───────────────────────────────────────────────────

export async function createParkingRequest(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const dto = await req.json() as CreateParkingRequestDto;
    return { status: 201, jsonBody: create(dto) };
  } catch (err) {
    return errorResponse(err);
  }
}

// ─── PATCH /parking-requests/{id}/status ─────────────────────────────────────

export async function updateParkingRequestStatus(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const dto = await req.json() as UpdateStatusDto;
    return { status: 200, jsonBody: updateStatus(req.params.id, dto) };
  } catch (err) {
    return errorResponse(err);
  }
}

// ─── DELETE /parking-requests/{id} ───────────────────────────────────────────

export async function deleteParkingRequest(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    deleteById(req.params.id);
    return { status: 204 };
  } catch (err) {
    return errorResponse(err);
  }
}

// ─── GET /health ──────────────────────────────────────────────────────────────

export async function healthCheck(
  _req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  return {
    status: 200,
    jsonBody: { status: 'ok', service: 'cargovibe-azure', timestamp: new Date().toISOString() },
  };
}

// ─── Register all routes with the Azure Functions runtime ────────────────────

app.http('listParkingRequests', {
  methods: ['GET'],
  route: 'parking-requests',
  authLevel: 'anonymous',
  handler: listParkingRequests,
});

app.http('getParkingRequest', {
  methods: ['GET'],
  route: 'parking-requests/{id}',
  authLevel: 'anonymous',
  handler: getParkingRequest,
});

app.http('createParkingRequest', {
  methods: ['POST'],
  route: 'parking-requests',
  authLevel: 'anonymous',
  handler: createParkingRequest,
});

app.http('updateParkingRequestStatus', {
  methods: ['PATCH'],
  route: 'parking-requests/{id}/status',
  authLevel: 'anonymous',
  handler: updateParkingRequestStatus,
});

app.http('deleteParkingRequest', {
  methods: ['DELETE'],
  route: 'parking-requests/{id}',
  authLevel: 'anonymous',
  handler: deleteParkingRequest,
});

app.http('healthCheck', {
  methods: ['GET'],
  route: 'health',
  authLevel: 'anonymous',
  handler: healthCheck,
});
