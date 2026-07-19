// Account-level actions that go through the shared backend, mirroring the web
// app's src/account.js. Authenticated with the Firebase ID token as a Bearer
// header; the backend verifies it and acts on that uid.

import { API_URL } from '../config'
import { ApiError } from './client'

// Permanently deletes the signed-in user's account and all their journal data.
// The backend does the work with admin privileges. Throws an ApiError on
// failure so the caller can surface a gentle message.
export async function deleteAccount(token: string) {
  const res = await fetch(`${API_URL}/api/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (data as any)?.error)
  }
  return res.json()
}
