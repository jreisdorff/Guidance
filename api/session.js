// Vercel serverless function: GET /api/session
// Tells the frontend whether a passcode is required and whether this visitor
// is already authenticated (has a valid cookie).
import { passcodeRequired, isAuthed } from '../lib/auth.js'

export default function handler(req, res) {
  res.status(200).json({
    passcodeRequired: passcodeRequired(),
    authed: isAuthed(req),
  })
}
