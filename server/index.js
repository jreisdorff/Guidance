// Local development server. Mirrors the Vercel serverless functions in api/*.js
// but as one long-lived Express process, so `npm run dev` works without the
// Vercel CLI. Both paths share the same logic in lib/claude.js.
//
// In production on Vercel, this file is NOT used — api/affirm.js and
// api/health.js are deployed as serverless functions instead.

import 'dotenv/config'
import express from 'express'
import { aiAvailable, composeAffirmation, STATUS_FOR_CODE } from '../lib/claude.js'
import {
  passcodeRequired,
  isAuthed,
  verifyPasscode,
  authCookie,
  clearCookie,
} from '../lib/auth.js'
import {
  verifyGoogleIdToken,
  issueSessionToken,
  isBearerAuthed,
  STATUS_FOR_CODE as AUTH_STATUS_FOR_CODE,
} from '../lib/googleAuth.js'

const PORT = process.env.PORT || 8787

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ aiAvailable: aiAvailable() })
})

app.get('/api/session', (req, res) => {
  res.json({ passcodeRequired: passcodeRequired(), authed: isAuthed(req) })
})

app.post('/api/login', (req, res) => {
  if (!passcodeRequired()) return res.json({ ok: true })
  if (verifyPasscode(req.body?.passcode)) {
    res.setHeader('Set-Cookie', authCookie())
    return res.json({ ok: true })
  }
  res.status(401).json({ error: 'bad_passcode' })
})

app.post('/api/logout', (_req, res) => {
  res.setHeader('Set-Cookie', clearCookie())
  res.json({ ok: true })
})

// Mobile Google sign-in: verify the Google ID token, return our session JWT.
app.post('/api/auth/google', async (req, res) => {
  try {
    const user = await verifyGoogleIdToken(req.body?.idToken)
    res.json({ token: issueSessionToken(user), user })
  } catch (err) {
    res
      .status(AUTH_STATUS_FOR_CODE[err.code] || 401)
      .json({ error: err.code || 'bad_google_token' })
  }
})

app.post('/api/affirm', async (req, res) => {
  // Web uses the passcode cookie; mobile sends a Bearer session JWT.
  if (!isAuthed(req) && !isBearerAuthed(req)) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  try {
    const data = await composeAffirmation(req.body || {})
    res.json(data)
  } catch (err) {
    res
      .status(STATUS_FOR_CODE[err.code] || 502)
      .json({ error: err.code || 'generation_failed' })
  }
})

app.listen(PORT, () => {
  console.log(
    `\n  Divinity API listening on http://localhost:${PORT}` +
      (aiAvailable()
        ? '  (AI affirmations enabled)\n'
        : '  (no ANTHROPIC_API_KEY — the app will use its local engine)\n'),
  )
})
