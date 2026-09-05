import apiClient from './apiClient'
import type { ContentCollection } from './contentService'

export interface ContentRow {
  id: number
  display_order: number
  status: 'ACTIVE' | 'INACTIVE'
  [field: string]: unknown
}

/** Admin listing includes INACTIVE rows; the public one does not. */
export async function adminListContent(collection: ContentCollection): Promise<ContentRow[]> {
  const response = await apiClient.get<ContentRow[]>(`/api/admin/content/${collection}`)
  return response.data
}

export async function createContent(
  collection: ContentCollection,
  payload: Record<string, unknown>,
): Promise<ContentRow> {
  const response = await apiClient.post<ContentRow>(`/api/admin/content/${collection}`, payload)
  return response.data
}

export async function updateContent(
  collection: ContentCollection,
  id: number,
  payload: Record<string, unknown>,
): Promise<ContentRow> {
  const response = await apiClient.put<ContentRow>(`/api/admin/content/${collection}/${id}`, payload)
  return response.data
}

export async function deleteContent(collection: ContentCollection, id: number): Promise<void> {
  await apiClient.delete(`/api/admin/content/${collection}/${id}`)
}

export async function getSiteBlob(key: string): Promise<Record<string, unknown>> {
  const response = await apiClient.get<{ key: string; value: Record<string, unknown> }>(
    `/api/content/site/${key}`,
  )
  return response.data.value
}

export async function saveSiteBlob(
  key: string,
  value: Record<string, unknown>,
): Promise<void> {
  await apiClient.put(`/api/admin/content/site/${key}`, { value })
}
