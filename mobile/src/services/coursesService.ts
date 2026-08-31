import apiClient from './apiClient'
import type { Course } from '../types'

// GET /api/courses/{id} - used by TopicsScreen for a real course-name
// heading. The mobile app never needs the list endpoint (Dashboard is
// driven entirely by enrollmentService.getMyBatches(), same as web's
// DashboardPage), so only this one function is ported from
// web/src/services/coursesService.ts.
export async function getCourse(courseId: number): Promise<Course> {
  const response = await apiClient.get<Course>(`/api/courses/${courseId}`)
  return response.data
}
