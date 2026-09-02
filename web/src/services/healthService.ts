import apiClient from './apiClient'
import type { HealthResponse } from '../types'

// Proves the web app can reach the backend. Real domain services (courses,
// auth, assessments, ...) are added starting Phase 3.
export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health')
  return response.data
}
