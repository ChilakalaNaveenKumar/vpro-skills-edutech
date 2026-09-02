import apiClient from './apiClient'
import type { Course, CourseCreate, CourseUpdate } from '../types'

// GET /api/courses is public - no auth header needed. It returns only
// ACTIVE courses for an anonymous/student caller; an admin's own tooling
// (added in Phase 8) will see everything once login wiring adds the
// Authorization header to apiClient.
export async function listCourses(): Promise<Course[]> {
  const response = await apiClient.get<Course[]>('/api/courses/')
  return response.data
}


// GET /api/courses/{id} - used by TopicsPage for a real course-name heading.
export async function getCourse(courseId: number): Promise<Course> {
  const response = await apiClient.get<Course>(`/api/courses/${courseId}`)
  return response.data
}

// POST /api/admin/courses/ - admin-only create (Phase 8).
export async function createCourse(payload: CourseCreate): Promise<Course> {
  const response = await apiClient.post<Course>('/api/admin/courses/', payload)
  return response.data
}

// PUT /api/admin/courses/{id} - admin-only partial update, incl. the
// Activate/Deactivate status toggle (Phase 8).
export async function updateCourse(courseId: number, payload: CourseUpdate): Promise<Course> {
  const response = await apiClient.put<Course>(`/api/admin/courses/${courseId}`, payload)
  return response.data
}
