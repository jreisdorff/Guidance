// Client for the shared Divinity/Guidance backend (server/index.js locally,
// api/*.js on Vercel). Mobile authenticates with a Bearer session token that the
// backend issues after Google sign-in; we attach it to every request here.

import { API_URL } from '../config'

export type Guidance = {
  themeLabel: string
  reflect: string
  affirmation: string
  source: string
}

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, code?: string) {
    super(code || `request_failed_${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (data as any)?.error)
  }
  return res.json() as Promise<T>
}

// Asks the backend for a piece of guidance for `entry`.
export function getGuidance(token: string, entry: string, lastAffirmation?: string) {
  return post<Guidance>('/api/affirm', { entry, lastAffirmation }, token)
}
