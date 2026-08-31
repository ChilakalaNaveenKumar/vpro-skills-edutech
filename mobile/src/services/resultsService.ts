import apiClient from './apiClient'
import type { Result, ResultDetail } from '../types'

// GET /api/results/ - the logged-in student's own past attempts, newest
// first (see backend/app/results/router.py). Mirrors
// web/src/services/resultsService.ts's student-facing functions only (no
// admin listing - the mobile app is student-only).
export async function getMyResults(): Promise<Result[]> {
  const response = await apiClient.get<Result[]>('/api/results/')
  return response.data
}

// GET /api/results/{attemptId} - one attempt's full per-question
// breakdown, including the correct answers (safe to reveal
// post-submission).
export async function getResultDetail(attemptId: number): Promise<ResultDetail> {
  const response = await apiClient.get<ResultDetail>(`/api/results/${attemptId}`)
  return response.data
}
