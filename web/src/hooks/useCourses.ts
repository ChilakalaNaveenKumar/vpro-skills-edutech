import { COURSES, courseBySlug } from '../content/courses'
import apiClient from '../services/apiClient'
import { useRemoteValue } from './useContent'

/** One normalised shape for the curriculum, whatever it came from. */
export interface SiteCourse {
  id: number
  slug: string
  name: string
  tagline: string
  summary: string
  level: string
  prerequisites: string
  forWhom: string[]
  outcomes: string[]
  techs: string[]
  hue: number
  flagship: boolean
  videoUrl: string | null
  modules: {
    id: number
    order: number
    name: string
    summary: string
    builds: string | null
    visual: string | null
    topics: string[]
  }[]
  projects: { name: string; description: string }[]
}

// The API is snake_case and nullable where the static file was camelCase and
// always present, so everything is normalised once, here, rather than every
// call site learning both shapes.
interface ApiCourse {
  id: number
  name: string
  slug: string | null
  tagline: string | null
  summary: string | null
  level: string | null
  prerequisites: string | null
  for_whom: string[]
  outcomes: string[]
  techs: string[]
  hue: number | null
  flagship: boolean
  video_url: string | null
  modules: {
    id: number
    name: string
    order: number
    summary: string | null
    builds: string | null
    visual: string | null
    topics: string[]
  }[]
  projects: { name: string; description: string }[]
}

// A course with no slug cannot be linked to, so it is not shown.
//
// The shelf gives each course its own colour, and that colour is the only thing
// telling the six spines apart. `hue` is nullable in the database and is only
// ever written by seed_curriculum, so any course created by the admin, by an
// older seed, or by a migration that ran without the seed comes back null. A
// single fallback angle painted every spine the same green. Falling back to the
// hue this course shipped with keeps the shelf legible until a real value is
// written, and only a course we have never heard of lands on the neutral angle.
function normalise(course: ApiCourse): SiteCourse | null {
  if (!course.slug) return null
  const authoredHue = course.hue ?? courseBySlug(course.slug)?.hue ?? 40
  return {
    id: course.id,
    slug: course.slug,
    name: course.name,
    tagline: course.tagline ?? '',
    summary: course.summary ?? '',
    level: course.level ?? '',
    prerequisites: course.prerequisites ?? '',
    forWhom: course.for_whom ?? [],
    outcomes: course.outcomes ?? [],
    techs: course.techs ?? [],
    hue: authoredHue,
    flagship: course.flagship,
    videoUrl: course.video_url,
    modules: [...course.modules]
      .sort((a, b) => a.order - b.order)
      .map((module) => ({
        id: module.id,
        order: module.order,
        name: module.name,
        summary: module.summary ?? '',
        builds: module.builds,
        visual: module.visual,
        topics: module.topics ?? [],
      })),
    projects: course.projects ?? [],
  }
}

// Last-known-good copy while the request is in flight, and if it fails. A
// marketing page must never render an empty course shelf.
const FALLBACK: SiteCourse[] = COURSES.map((course, index) => ({
  id: -(index + 1),
  slug: course.slug,
  name: course.name,
  tagline: course.tagline,
  summary: course.summary,
  level: course.level,
  prerequisites: course.prerequisites,
  forWhom: [...course.forWhom],
  outcomes: [...course.outcomes],
  techs: [...course.techs],
  hue: course.hue,
  flagship: Boolean(course.flagship),
  videoUrl: null,
  modules: course.modules.map((module) => ({
    id: -(module.order + 1),
    order: module.order,
    name: module.name,
    summary: module.summary,
    builds: module.builds ?? null,
    visual: module.visual ?? null,
    topics: [...module.topics],
  })),
  projects: course.projects.map((project) => ({
    name: project.name,
    description: project.description,
  })),
}))

async function load(): Promise<SiteCourse[]> {
  const response = await apiClient.get<ApiCourse[]>('/api/courses/')
  const usable = response.data.map(normalise).filter((c): c is SiteCourse => c !== null)
  // An empty or slug-less result means the curriculum has not been seeded;
  // showing nothing would be worse than showing what we shipped with.
  return usable.length > 0 ? usable : FALLBACK
}

/** Every course, curriculum included, in the order the API returned. */
export function useCourses(): SiteCourse[] {
  return useRemoteValue<SiteCourse[]>('courses', load, FALLBACK)
}

export function findBySlug(courses: SiteCourse[], slug: string): SiteCourse | undefined {
  return courses.find((course) => course.slug === slug)
}

export function findByName(courses: SiteCourse[], name: string): SiteCourse | undefined {
  return courses.find((course) => course.name === name)
}
