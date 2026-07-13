// Vercel serverless function: POST /api/logout — clears the auth cookie.
import { clearCookie } from '../lib/auth.js'

export default function handler(_req, res) {
  res.setHeader('Set-Cookie', clearCookie())
  res.status(200).json({ ok: true })
}
