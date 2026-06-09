import { useState, useCallback } from 'react';
import { ParkingRequest, UpdateStatusDto } from '../types';
import { parkingApi, ApiError } from '../api';

// ─── useParkingRequests ───────────────────────────────────────────────────────
// Manages the list of parking requests with loading / error state.

export function useParkingRequests() {
  const [requests, setRequests] = useState<ParkingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await parkingApi.list();
      setRequests(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  return { requests, loading, error, refresh };
}

// ─── useParkingRequest ────────────────────────────────────────────────────────
// Manages a single parking request with optimistic status updates.

export function useParkingRequest(id: string) {
  const [request, setRequest] = useState<ParkingRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await parkingApi.get(id);
      setRequest(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateStatus = useCallback(async (dto: UpdateStatusDto): Promise<boolean> => {
    setUpdating(true);
    setError(null);
    try {
      const updated = await parkingApi.updateStatus(id, dto);
      setRequest(updated);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [id]);

  return { request, loading, updating, error, load, updateStatus };
}
