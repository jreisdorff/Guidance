// Vercel serverless function: POST /api/affirm
import { composeAffirmation, STATUS_FOR_CODE } from '../lib/claude.js'
import { isAuthed } from '../lib/auth.js'

// Give Claude room to respond (default Vercel timeout is short).
export const maxDuration = 30

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  try {
    const data = await composeAffirmation(req.body || {})
    res.status(200).json(data)
  } catch (err) {
    res.status(STATUS_FOR_CODE[err.code] || 502).json({
      error: err.code || 'generation_failed',
    })
  }
}
