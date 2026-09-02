import apiClient from './apiClient'
import type { Batch, User, UserCreate, UserRole, UserUpdate } from '../types'

// Admin-only account management + batch assignment (Phase 8) -
// GET/POST/PUT /api/users/... (this router's own prefix, already
// admin-gated - see backend/app/users/router.py's module docstring for why
// there's no separate /api/admin/users split).

export async function listUsers(role?: UserRole): Promise<User[]> {
  const response = await apiClient.get<User[]>('/api/users/', {
    params: role ? { role } : undefined,
  })
  return response.data
}

export async function createUser(payload: UserCreate): Promise<User> {
  const response = await apiClient.post<User>('/api/users/', payload)
  return response.data
}

export async function updateUser(userId: number, payload: UserUpdate): Promise<User> {
  const response = await apiClient.put<User>(`/api/users/${userId}`, payload)
  return response.data
}

export async function listUserBatches(userId: number): Promise<Batch[]> {
  const response = await apiClient.get<Batch[]>(`/api/users/${userId}/batches`)
  return response.data
}

export async function assignBatch(userId: number, batchId: number): Promise<Batch> {
  const response = await apiClient.post<Batch>(`/api/users/${userId}/batches`, { batch_id: batchId })
  return response.data
}

export async function unassignBatch(userId: number, batchId: number): Promise<void> {
  await apiClient.delete(`/api/users/${userId}/batches/${batchId}`)
}
