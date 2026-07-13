// Talks to the backend (server/index.js locally, api/*.js on Vercel), which in
// turn asks Claude. Authentication is a Firebase ID token sent as a Bearer
// header; the backend verifies it with the Firebase Admin SDK.

import { auth } from './firebase.js'

async function authHeader() {
  const token = await auth.currentUser?.getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Returns { aiAvailable: boolean }. Never throws — assumes offline on failure.
export async function checkAiAvailable() {
  try {
    const res = await fetch('/api/health')
    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data.aiAvailable)
  } catch {
    return false
  }
}

// Asks the backend for an AI-written affirmation.
// Returns { themeLabel, reflect, affirmation, source: 'ai' }.
// Throws an Error with a `.status` (and `.reason`) on failure so the caller can
// fall back to the local engine (or re-authenticate, on 401).
export async function generateAffirmationAI(entry, lastAffirmation) {
  const res = await fetch('/api/affirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ entry, lastAffirmation }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || 'request_failed')
    err.status = res.status
    err.reason = body.error
    throw err
  }

  return res.json()
}
