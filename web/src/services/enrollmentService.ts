import apiClient from './apiClient'
import type { Batch } from '../types'

// GET /api/users/me/batches - the batches (and, via each one's course_name,
// courses) the logged-in student is enrolled in. Reuses the same Batch type
// as batchesService.ts since the backend reuses the same BatchPublic shape.
export async function getMyBatches(): Promise<Batch[]> {
  const response = await apiClient.get<Batch[]>('/api/users/me/batches')
  return response.data
}
