import apiClient from './apiClient'
import type { AdminResult, Result, ResultDetail } from '../types'

// GET /api/results/ - the logged-in student's own past attempts, newest
// first (see backend/app/results/router.py).
export async function getMyResults(): Promise<Result[]> {
  const response = await apiClient.get<Result[]>('/api/results/')
  return response.data
}

// GET /api/results/{attemptId} - one attempt's full per-question breakdown,
// including the correct answers (safe to reveal post-submission).
export async function getResultDetail(attemptId: number): Promise<ResultDetail> {
  const response = await apiClient.get<ResultDetail>(`/api/results/${attemptId}`)
  return response.data
}

// GET /api/admin/results/ - admin-only listing across every student, with
// optional student_id/topic_id filters (Phase 8's Results admin page).
export async function getAllResults(filters: {
  studentId?: number
  topicId?: number
}): Promise<AdminResult[]> {
  const params: Record<string, number> = {}
  if (filters.studentId !== undefined) params.student_id = filters.studentId
  if (filters.topicId !== undefined) params.topic_id = filters.topicId
  const response = await apiClient.get<AdminResult[]>('/api/admin/results/', { params })
  return response.data
}
