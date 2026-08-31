import apiClient from './apiClient'
import type { Topic, TopicCreate, TopicUpdate } from '../types'

// GET /api/courses/{courseId}/topics requires login, and the backend
// enforces enrollment for non-admin callers - see docs/ARCHITECTURE.md's
// "Courses / Batches / Topics" section.
export async function listCourseTopics(courseId: number): Promise<Topic[]> {
  const response = await apiClient.get<Topic[]>(`/api/courses/${courseId}/topics`)
  return response.data
}

// POST /api/admin/topics/ - admin-only create (Phase 8).
export async function createTopic(payload: TopicCreate): Promise<Topic> {
  const response = await apiClient.post<Topic>('/api/admin/topics/', payload)
  return response.data
}

// PUT /api/admin/topics/{id} - admin-only partial update, incl. the
// Activate/Deactivate status toggle (Phase 8).
export async function updateTopic(topicId: number, payload: TopicUpdate): Promise<Topic> {
  const response = await apiClient.put<Topic>(`/api/admin/topics/${topicId}`, payload)
  return response.data
}

// DELETE /api/admin/topics/{id} - admin-only hard delete (Topics is the
// one domain that gets one). May 409 if the topic has questions with
// existing assessment answers (see docs/ARCHITECTURE.md's Phase 8 section).
export async function deleteTopic(topicId: number): Promise<void> {
  await apiClient.delete(`/api/admin/topics/${topicId}`)
}

// GET /api/admin/topics/{id} - admin-only single-topic lookup (Phase 8),
// used for breadcrumb headings on the Questions admin page.
export async function getTopic(topicId: number): Promise<Topic> {
  const response = await apiClient.get<Topic>(`/api/admin/topics/${topicId}`)
  return response.data
}
