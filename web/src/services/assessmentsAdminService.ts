import apiClient from './apiClient'
import type { AssessmentAdmin, AssessmentCreate, AssessmentUpdate } from '../types'

// Admin CRUD for the standalone, reusable Assessment entity (2026-08-31)
// - GET/POST/PUT/DELETE /api/admin/assessments/... . Distinct from
// assessmentService.ts, which is the student-facing take/submit flow
// keyed by topic_id and never touches this admin CRUD surface.

export async function listAssessments(): Promise<AssessmentAdmin[]> {
  const response = await apiClient.get<AssessmentAdmin[]>('/api/admin/assessments/')
  return response.data
}

export async function getAssessmentAdmin(assessmentId: number): Promise<AssessmentAdmin> {
  const response = await apiClient.get<AssessmentAdmin>(`/api/admin/assessments/${assessmentId}`)
  return response.data
}

export async function createAssessment(payload: AssessmentCreate): Promise<AssessmentAdmin> {
  const response = await apiClient.post<AssessmentAdmin>('/api/admin/assessments/', payload)
  return response.data
}

export async function updateAssessment(
  assessmentId: number,
  payload: AssessmentUpdate,
): Promise<AssessmentAdmin> {
  const response = await apiClient.put<AssessmentAdmin>(
    `/api/admin/assessments/${assessmentId}`,
    payload,
  )
  return response.data
}

// May 409 if the assessment is still attached to any topic, or has
// existing student attempts.
export async function deleteAssessment(assessmentId: number): Promise<void> {
  await apiClient.delete(`/api/admin/assessments/${assessmentId}`)
}
