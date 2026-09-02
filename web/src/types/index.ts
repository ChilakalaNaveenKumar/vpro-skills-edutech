// Shared frontend types, growing alongside the backend schemas (see
// backend/app/*/schemas.py for the source of truth each of these mirrors).

export interface HealthResponse {
  status: string
  app: string
  environment: string
}

export type EntityStatus = 'ACTIVE' | 'INACTIVE'

// Mirrors backend/app/core/enums.py's BatchProgressStatus.
export type BatchProgressStatus = 'IN_PROGRESS' | 'COMPLETED'

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
  // Nullable - batches created before 2026-08-31 predate this field.
  trainer_email: string | null
  status: EntityStatus
  progress_status: BatchProgressStatus
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
  // The attached reusable Assessment, if any (2026-08-31) - null means
  // this topic has nothing attached yet.
  assessment_id: number | null
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

// Mirrors the 409 error `detail` body on GET /api/topics/{id}/assessment
// and POST .../assessment/submit when the student has already completed
// this assessment (2026-08-31) - not a success response, so it isn't a
// service function's return type, just the shape AssessmentPage.tsx reads
// out of the caught error to redirect straight to the existing result.
export interface AlreadyAttemptedDetail {
  message: string
  attempt_id: number | null
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
  trainer_email: string
  status?: EntityStatus
  progress_status?: BatchProgressStatus
}

export interface BatchUpdate {
  batch_number?: string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  trainer_name?: string
  trainer_email?: string
  status?: EntityStatus
  progress_status?: BatchProgressStatus
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
  // Attach (an id) or detach (explicit null) a reusable Assessment.
  // Omit the field entirely to leave the current attachment untouched.
  assessment_id?: number | null
}

// Mirrors backend/app/assessments/schemas.py's AssessmentCreate/
// AssessmentUpdate/AssessmentAdminPublic (2026-08-31) - the admin CRUD
// shapes for the standalone, reusable Assessment entity. Distinct from
// the `Assessment` interface above, which is the student-facing
// take-endpoint shape (keyed by topic, never carries a name/id of its
// own beyond the topic it was fetched through).
export interface AssessmentCreate {
  name: string
  description?: string | null
  status?: EntityStatus
}

export interface AssessmentUpdate {
  name?: string
  description?: string | null
  status?: EntityStatus
}

export interface AssessmentAdmin {
  id: number
  name: string
  description: string | null
  status: EntityStatus
  question_count: number
  // How many topics currently have this assessment attached - the reuse
  // count shown in the admin Assessments list.
  topic_count: number
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
  assessment_id: number
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
  assessment_id: number
  question_text: string
  status: EntityStatus
  options: QuestionOptionAdmin[]
}

// Mirrors backend/app/questions/schemas.py's BulkUploadRowError/BulkUploadResult.
export interface BulkUploadRowError {
  row: number
  message: string
}

export interface BulkUploadResult {
  created: number
  skipped: number
  errors: BulkUploadRowError[]
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
