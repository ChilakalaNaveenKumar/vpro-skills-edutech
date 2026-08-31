import apiClient from './apiClient'
import type { BulkUploadResult, QuestionAdmin, QuestionCreate, QuestionUpdate } from '../types'

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

// Bulk upload (2026-08-31) - lets an admin add many questions to a topic
// at once from a filled-in .xlsx instead of one form submission per
// question. Both calls need to go through apiClient (not a plain <a href>
// or window.open) because the endpoints are admin-only and only apiClient
// attaches the stored JWT - a bare link/download has no way to send it.

// multipart/form-data upload. Partial success by design: a row with a
// mistake doesn't block the valid rows in the same file - see the
// created/skipped/errors shape and the backend docstring it mirrors.
export async function bulkUploadQuestions(topicId: number, file: File): Promise<BulkUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<BulkUploadResult>(
    `/api/admin/questions/topics/${topicId}/bulk-upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return response.data
}

// Returns the raw file as a Blob - the caller turns it into a downloadable
// link via URL.createObjectURL (see AdminQuestionsPage.tsx), since this is
// an authenticated GET and can't just be a static file URL.
export async function downloadBulkUploadTemplate(): Promise<Blob> {
  const response = await apiClient.get('/api/admin/questions/bulk-template', {
    responseType: 'blob',
  })
  return response.data
}
