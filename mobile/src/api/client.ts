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
      // Marks this as the mobile app so the backend applies the subscription /
      // free-question quota (the web app is unlimited).
      'X-Guidance-Client': 'mobile',
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

// Asks the backend for a piece of guidance for `entry`, in the given language
// ('en' | 'es'). Claude is natively multilingual; `lang` is just a directive.
export function getGuidance(
  token: string,
  entry: string,
  lastAffirmation?: string,
  lang?: string,
) {
  return post<Guidance>('/api/affirm', { entry, lastAffirmation, lang }, token)
}
