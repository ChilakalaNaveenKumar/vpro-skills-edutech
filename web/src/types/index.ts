// Shared frontend types, growing alongside the backend schemas (see
// backend/app/*/schemas.py for the source of truth each of these mirrors).

export interface HealthResponse {
  status: string
  app: string
  environment: string
}

export type EntityStatus = 'ACTIVE' | 'INACTIVE'

// Mirrors backend/app/courses/schemas.py's CoursePublic.
export interface Course {
  id: number
  name: string
  description: string | null
  status: EntityStatus
}

// Mirrors backend/app/batches/schemas.py's BatchPublic.
export interface Batch {
  id: number
  course_id: number
  course_name: string
  batch_number: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  trainer_name: string
  status: EntityStatus
}


export type UserRole = 'ADMIN' | 'STUDENT'

// Mirrors backend/app/users/schemas.py's UserPublic (returned by GET /api/auth/me).
export interface User {
  id: number
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
}

// Mirrors backend/app/auth/schemas.py's LoginRequest/TokenResponse.
export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}


// Mirrors backend/app/topics/schemas.py's TopicPublic.
export interface Topic {
  id: number
  course_id: number
  name: string
  topic_order: number
  status: EntityStatus
}

// Mirrors backend/app/assessments/schemas.py's student-facing shapes -
// never carries is_correct; correct answers aren't sent to the frontend
// before submission.
export interface AssessmentOption {
  id: number
  option_label: string
  option_text: string
}

export interface AssessmentQuestion {
  id: number
  question_text: string
  options: AssessmentOption[]
}

export interface Assessment {
  topic_id: number
  topic_name: string
  total_questions: number
  questions: AssessmentQuestion[]
}

export interface AnswerSubmission {
  question_id: number
  selected_option_id: number | null
}

// Mirrors backend/app/assessments/schemas.py's AssessmentResultPublic.
export interface AssessmentResult {
  attempt_id: number
  total_questions: number
  score: number
  wrong_count: number
  percentage: number
  submitted_at: string
}

// Mirrors backend/app/results/schemas.py's ResultPublic - a summary row for
// the "My Results" history list.
export interface Result {
  attempt_id: number
  topic_id: number
  topic_name: string
  course_id: number
  course_name: string
  total_questions: number
  score: number
  wrong_count: number
  percentage: number
  started_at: string
  submitted_at: string
}

// Mirrors backend/app/results/schemas.py's ResultAnswerDetail/ResultDetailPublic.
// Unlike AssessmentQuestion above, this is fine to carry correct-answer info:
// it's only ever fetched for an attempt that's already been submitted.
export interface ResultAnswerDetail {
  question_id: number
  question_text: string
  selected_option_label: string | null
  selected_option_text: string | null
  correct_option_label: string
  correct_option_text: string
  is_correct: boolean
}

export interface ResultDetail extends Result {
  answers: ResultAnswerDetail[]
}

// --- Admin CRUD payload/response types (Phase 8) ---

// Mirrors backend/app/courses/schemas.py's CourseCreate/CourseUpdate.
export interface CourseCreate {
  name: string
  description?: string | null
  status?: EntityStatus
}

export interface CourseUpdate {
  name?: string
  description?: string | null
  status?: EntityStatus
}

// Mirrors backend/app/batches/schemas.py's BatchCreate/BatchUpdate.
export interface BatchCreate {
  course_id: number
  batch_number: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  trainer_name: string
  status?: EntityStatus
}

export interface BatchUpdate {
  batch_number?: string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  trainer_name?: string
  status?: EntityStatus
}

// Mirrors backend/app/topics/schemas.py's TopicCreate/TopicUpdate.
export interface TopicCreate {
  course_id: number
  name: string
  topic_order: number
  status?: EntityStatus
}

export interface TopicUpdate {
  name?: string
  topic_order?: number
  status?: EntityStatus
}

// Mirrors backend/app/questions/schemas.py's QuestionOptionIn/QuestionCreate/
// QuestionUpdate/QuestionAdminPublic. Admin-only shape - unlike
// AssessmentQuestion above, this carries is_correct, since admins are the
// ones setting it.
export interface QuestionOptionInput {
  option_label: string
  option_text: string
  is_correct: boolean
}

export interface QuestionCreate {
  topic_id: number
  question_text: string
  status?: EntityStatus
  options: QuestionOptionInput[]
}

export interface QuestionUpdate {
  question_text?: string
  status?: EntityStatus
  options?: QuestionOptionInput[]
}

export interface QuestionOptionAdmin {
  id: number
  option_label: string
  option_text: string
  is_correct: boolean
}

export interface QuestionAdmin {
  id: number
  topic_id: number
  question_text: string
  status: EntityStatus
  options: QuestionOptionAdmin[]
}

// Mirrors backend/app/users/schemas.py's UserCreate/UserUpdate.
export interface UserCreate {
  full_name: string
  email: string
  password: string
  role?: UserRole
}

export interface UserUpdate {
  full_name?: string
  is_active?: boolean
}

// Mirrors backend/app/results/schemas.py's AdminResultPublic.
export interface AdminResult extends Result {
  student_id: number
  student_name: string
  student_email: string
}
