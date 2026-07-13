// Talks to the backend (server/index.js locally, api/*.js on Vercel), which in
// turn asks Claude and enforces the passcode gate. Nothing here holds an API
// key or the passcode — those stay on the server.

// Returns { passcodeRequired, authed }. Never throws — assumes open on failure.
export async function getSession() {
  try {
    const res = await fetch('/api/session', { credentials: 'same-origin' })
    if (!res.ok) return { passcodeRequired: false, authed: true }
    return res.json()
  } catch {
    return { passcodeRequired: false, authed: true }
  }
}

// Submits the passcode. Returns true on success.
export async function login(passcode) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ passcode }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
  } catch {
    /* ignore */
  }
}

// Returns { aiAvailable: boolean }. Never throws — assumes offline on failure.
export async function checkAiAvailable() {
  try {
    const res = await fetch('/api/health', { credentials: 'same-origin' })
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
// fall back to the local engine (or re-lock, on 401) and show the right message.
export async function generateAffirmationAI(entry, lastAffirmation) {
  const res = await fetch('/api/affirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
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
