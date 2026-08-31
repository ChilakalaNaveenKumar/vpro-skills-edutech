import apiClient from './apiClient'
import type { Batch, BatchCreate, BatchUpdate } from '../types'

// GET /api/batches is public, same active-only visibility rule as courses
// (see coursesService.ts).
export async function listBatches(): Promise<Batch[]> {
  const response = await apiClient.get<Batch[]>('/api/batches/')
  return response.data
}

// POST /api/admin/batches/ - admin-only create (Phase 8).
export async function createBatch(payload: BatchCreate): Promise<Batch> {
  const response = await apiClient.post<Batch>('/api/admin/batches/', payload)
  return response.data
}

// PUT /api/admin/batches/{id} - admin-only partial update, incl. the
// Activate/Deactivate status toggle (Phase 8).
export async function updateBatch(batchId: number, payload: BatchUpdate): Promise<Batch> {
  const response = await apiClient.put<Batch>(`/api/admin/batches/${batchId}`, payload)
  return response.data
}
