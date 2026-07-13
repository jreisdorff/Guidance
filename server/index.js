// Local development server. Mirrors the Vercel serverless functions in api/*.js
// but as one long-lived Express process, so `npm run dev` works without the
// Vercel CLI. Both paths share the same logic in lib/claude.js.
//
// In production on Vercel, this file is NOT used — api/affirm.js and
// api/health.js are deployed as serverless functions instead.

import 'dotenv/config'
import express from 'express'
import { aiAvailable, composeAffirmation, STATUS_FOR_CODE } from '../lib/claude.js'
import { isRequestAuthed } from '../lib/firebaseAdmin.js'

const PORT = process.env.PORT || 8787

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ aiAvailable: aiAvailable() })
})

app.post('/api/affirm', async (req, res) => {
  // Web and mobile both send a Firebase ID token as `Authorization: Bearer`.
  if (!(await isRequestAuthed(req))) {
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
    `\n  Guidance API listening on http://localhost:${PORT}` +
      (aiAvailable()
        ? '  (AI affirmations enabled)\n'
        : '  (no ANTHROPIC_API_KEY — the app will use its local engine)\n'),
  )
})
