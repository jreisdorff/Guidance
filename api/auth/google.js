// Vercel serverless function: POST /api/auth/google  { idToken }
// Verifies a Google ID token from the mobile app and returns our own session
// JWT plus the user. The app then sends that token as `Authorization: Bearer`.
import {
  verifyGoogleIdToken,
  issueSessionToken,
  STATUS_FOR_CODE,
} from '../../lib/googleAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  try {
    const { idToken } = req.body || {}
    const user = await verifyGoogleIdToken(idToken)
    const token = issueSessionToken(user)
    return res.status(200).json({ token, user })
  } catch (err) {
    return res
      .status(STATUS_FOR_CODE[err.code] || 401)
      .json({ error: err.code || 'bad_google_token' })
  }
}
