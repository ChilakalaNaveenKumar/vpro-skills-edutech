import { createContext, useContext } from 'react'

/**
 * Present only where a course can open in place. When it is null - the courses
 * index, a deep link, anywhere else - course links stay ordinary links and
 * navigate normally.
 */
export const CourseDetailContext = createContext<((slug: string) => void) | null>(null)

export function useOpenCourseInPlace() {
  return useContext(CourseDetailContext)
}
