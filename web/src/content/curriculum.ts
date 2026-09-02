// The flagship course's modules, kept at this path because several sections
// already import from here. The content itself lives in courses.ts, so a course
// page and the home page can never disagree about the syllabus.

export type { CourseModule as Module } from './courses'
export { FLAGSHIP } from './courses'

import { FLAGSHIP } from './courses'

export const MODULES = FLAGSHIP.modules
