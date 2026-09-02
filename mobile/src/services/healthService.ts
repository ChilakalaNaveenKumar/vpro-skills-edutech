import apiClient from './apiClient'

export interface HealthResponse {
  status: string
  app: string
  environment: string
}

// Proves the mobile app can reach the same backend as the web app. Real
// domain services (auth, courses, assessments, ...) are added starting
// Phase 3, sharing the backend's REST contract but not code with the web app.
export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health')
  return response.data
}
