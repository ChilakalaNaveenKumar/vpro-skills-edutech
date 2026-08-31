import apiClient from './apiClient'
import type { BulkUploadResult, QuestionAdmin, QuestionCreate, QuestionUpdate } from '../types'

// Admin-only question management (Phase 8, re-keyed to assessment_id
// 2026-08-31 - see app/assessments/models.py's docstring) - GET/POST/PUT/
// DELETE /api/admin/questions/... . Distinct from assessmentService.ts's
// getAssessment(), which is the student-facing take-endpoint and never
// exposes is_correct; these responses do, since only admins call them.

export async function listQuestions(assessmentId: number): Promise<QuestionAdmin[]> {
  const response = await apiClient.get<QuestionAdmin[]>(
    `/api/admin/questions/assessments/${assessmentId}`,
  )
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

// Bulk upload (2026-08-31) - lets an admin add many questions to an
// assessment at once from a filled-in .xlsx instead of one form
// submission per question. Both calls need to go through apiClient (not
// a plain <a href> or window.open) because the endpoints are admin-only
// and only apiClient attaches the stored JWT - a bare link/download has
// no way to send it.

// multipart/form-data upload. Partial success by design: a row with a
// mistake doesn't block the valid rows in the same file - see the
// created/skipped/errors shape and the backend docstring it mirrors.
export async function bulkUploadQuestions(
  assessmentId: number,
  file: File,
): Promise<BulkUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  // Content-Type handling here has a two-part history (2026-08-31):
  // attempt 1 hardcoded 'multipart/form-data' with no boundary=
  // parameter, which stops the browser from generating its own - that
  // was removed, since axios/XHR only fills in a real boundary
  // automatically when IT is the one setting the header. But apiClient's
  // axios instance also sets a default 'Content-Type: application/json'
  // (apiClient.ts), and this axios version does not automatically strip
  // that instance default just because the request body is FormData - so
  // with no header override at all, every upload was still going out as
  // application/json with no multipart body, and FastAPI correctly (if
  // confusingly) reported the "file" field as simply missing. Explicitly
  // unsetting Content-Type for *this* request is what's actually needed:
  // it clears the inherited default and lets axios/XHR compute a fresh
  // multipart header with a real boundary from the FormData body.
  const response = await apiClient.post<BulkUploadResult>(
    `/api/admin/questions/assessments/${assessmentId}/bulk-upload`,
    formData,
    { headers: { 'Content-Type': undefined } },
  )
  return response.data
}

// Returns the raw file as a Blob - the caller turns it into a downloadable
// link via URL.createObjectURL (see AdminAssessmentQuestionsPage.tsx), since this is
// an authenticated GET and can't just be a static file URL.
export async function downloadBulkUploadTemplate(): Promise<Blob> {
  const response = await apiClient.get('/api/admin/questions/bulk-template', {
    responseType: 'blob',
  })
  return response.data
}
