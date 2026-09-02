import apiClient from './apiClient'

export interface DemoSession {
  id: number
  session_date: string
  session_time: string
  seats_total: number
  seats_taken: number
  join_url: string | null
}

// Returns null when no session is published or the backend is unreachable, so
// the page never shows a stale or dead countdown the way the old site did.
export async function getNextDemoSession(): Promise<DemoSession | null> {
  try {
    const response = await apiClient.get<DemoSession | null>('/api/demo-sessions/next')
    return response.data ?? null
  } catch {
    return null
  }
}
