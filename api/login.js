// Vercel serverless function: POST /api/login  { passcode }
// Verifies the passcode server-side and, on success, sets the auth cookie.
import { verifyPasscode, authCookie, passcodeRequired } from '../lib/auth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  if (!passcodeRequired()) {
    return res.status(200).json({ ok: true }) // gate disabled — nothing to check
  }
  const { passcode } = req.body || {}
  if (verifyPasscode(passcode)) {
    res.setHeader('Set-Cookie', authCookie())
    return res.status(200).json({ ok: true })
  }
  return res.status(401).json({ error: 'bad_passcode' })
}
