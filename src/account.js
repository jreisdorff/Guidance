// Account-level actions that go through the backend. Like ai.js, requests are
// authenticated with a Firebase ID token sent as a Bearer header; the backend
// verifies it and acts on that uid.

import { auth } from './firebase.js'

// Permanently deletes the signed-in user's account and all their journal data.
// The backend does the work with admin privileges. Throws an Error with a
// `.status` on failure so the caller can surface a message.
export async function deleteAccount() {
  const token = await auth.currentUser?.getIdToken()
  const res = await fetch('/api/delete-account', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || 'delete_failed')
    err.status = res.status
    throw err
  }
  return res.json()
}
