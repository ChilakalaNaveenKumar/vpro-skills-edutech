import apiClient from './apiClient'
import type { Assessment, AssessmentResult, AnswerSubmission } from '../types'

export async function getAssessment(topicId: number): Promise<Assessment> {
  const response = await apiClient.get<Assessment>(`/api/topics/${topicId}/assessment`)
  return response.data
}

export async function submitAssessment(
  topicId: number,
  startedAt: string,
  answers: AnswerSubmission[],
): Promise<AssessmentResult> {
  const response = await apiClient.post<AssessmentResult>(
    `/api/topics/${topicId}/assessment/submit`,
    { started_at: startedAt, answers },
  )
  return response.data
}
