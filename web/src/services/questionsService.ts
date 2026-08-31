import apiClient from './apiClient'
import type { QuestionAdmin, QuestionCreate, QuestionUpdate } from '../types'

// Admin-only question management (Phase 8) - GET/POST/PUT/DELETE
// /api/admin/questions/... . Distinct from assessmentService.ts's
// getAssessment(), which is the student-facing take-endpoint and never
// exposes is_correct; these responses do, since only admins call them.

export async function listQuestions(topicId: number): Promise<QuestionAdmin[]> {
  const response = await apiClient.get<QuestionAdmin[]>(`/api/admin/questions/topics/${topicId}`)
  return response.data
}

export async function createQuestion(payload: QuestionCreate): Promise<QuestionAdmin> {
  const response = await apiClient.post<QuestionAdmin>('/api/admin/questions/', payload)
  return response.data
}

export async function updateQuestion(
  questionId: number,
  payload: QuestionUpdate,
): Promise<QuestionAdmin> {
  const response = await apiClient.put<QuestionAdmin>(`/api/admin/questions/${questionId}`, payload)
  return response.data
}

// May 409 if the question has existing assessment answers.
export async function deleteQuestion(questionId: number): Promise<void> {
  await apiClient.delete(`/api/admin/questions/${questionId}`)
}
