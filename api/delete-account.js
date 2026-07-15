// Vercel serverless function: POST /api/delete-account
// Permanently deletes the authenticated user's account and all their journal
// data. The caller proves identity with a Firebase ID token; we delete the uid
// that token belongs to (never a uid from the request body).
import {
  bearerToken,
  deleteUserAccount,
  verifyFirebaseToken,
  STATUS_FOR_CODE,
} from '../lib/firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  let decoded
  try {
    decoded = await verifyFirebaseToken(bearerToken(req))
  } catch (err) {
    return res
      .status(STATUS_FOR_CODE[err.code] || 401)
      .json({ error: err.code || 'unauthorized' })
  }
  try {
    await deleteUserAccount(decoded.uid)
    res.status(200).json({ ok: true })
  } catch (err) {
    res
      .status(STATUS_FOR_CODE[err.code] || 500)
      .json({ error: err.code || 'delete_failed' })
  }
}
