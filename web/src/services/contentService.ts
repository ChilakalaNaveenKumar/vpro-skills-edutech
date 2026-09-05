import apiClient from './apiClient'

export interface TestimonialItem {
  id: number
  quote: string
  name: string
  role: string | null
}

export interface FaqItem {
  id: number
  question: string
  answer: string
}

/** Tenets and batch-loop steps share a shape: a number, a title and a body. */
export interface BlockItem {
  id: number
  number: string
  title: string
  body: string
}

export type ContentCollection = 'testimonials' | 'faqs' | 'tenets' | 'batch-loop'

export async function listContent<T>(collection: ContentCollection): Promise<T[]> {
  const response = await apiClient.get<T[]>(`/api/content/${collection}`)
  return response.data
}

export async function getSiteContent<T>(key: string): Promise<T> {
  const response = await apiClient.get<{ key: string; value: T }>(`/api/content/site/${key}`)
  return response.data.value
}
