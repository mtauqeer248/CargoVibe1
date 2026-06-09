import {
  ParkingRequest,
  CreateParkingRequestDto,
  UpdateStatusDto,
  AiChatResponse,
  ChatMessage,
} from '../types';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// On native: use your machine's LAN IP (e.g. http://192.168.1.x:7071)
// On web (Expo web): localhost works fine
// PORT 7071 mirrors the default Azure Functions local port


  const BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:7071/api';

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.details ?? data?.error ?? `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Parking Requests API ─────────────────────────────────────────────────────

export const parkingApi = {
  list(): Promise<ParkingRequest[]> {
    return request<ParkingRequest[]>('/parking-requests');
  },

  get(id: string): Promise<ParkingRequest> {
    return request<ParkingRequest>(`/parking-requests/${id}`);
  },

  create(dto: CreateParkingRequestDto): Promise<ParkingRequest> {
    return request<ParkingRequest>('/parking-requests', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateStatus(id: string, dto: UpdateStatusDto): Promise<ParkingRequest> {
    return request<ParkingRequest>(`/parking-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  delete(id: string): Promise<void> {
    return request<void>(`/parking-requests/${id}`, { method: 'DELETE' });
  },
};

// ─── AI Chat API ──────────────────────────────────────────────────────────────

export const aiApi = {
  chat(message: string, conversationHistory: ChatMessage[] = []): Promise<AiChatResponse> {
    return request<AiChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    });
  },
};
