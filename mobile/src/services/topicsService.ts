import apiClient from './apiClient'
import type { Topic } from '../types'

// GET /api/courses/{courseId}/topics requires login, and the backend
// enforces enrollment for non-admin callers - see
// docs/ARCHITECTURE.md's "Courses / Batches / Topics" section. Mirrors
// web/src/services/topicsService.ts's student-facing function only (no
// admin CRUD - the mobile app is student-only).
export async function listCourseTopics(courseId: number): Promise<Topic[]> {
  const response = await apiClient.get<Topic[]>(`/api/courses/${courseId}/topics`)
  return response.data
}
