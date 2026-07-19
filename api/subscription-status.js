// Vercel serverless function: GET /api/subscription-status
// Returns the backend's view of the authenticated user's subscription — the
// source of truth the app reflects.
import {
  bearerToken,
  verifyFirebaseToken,
  STATUS_FOR_CODE,
} from '../lib/firebaseAdmin.js'
import { readEntitlement } from '../lib/subscription.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
    const ent = await readEntitlement(decoded.uid)
    res.status(200).json({ active: ent.active, expiresAt: ent.expiresMs })
  } catch (err) {
    res
      .status(STATUS_FOR_CODE[err.code] || 500)
      .json({ error: err.code || 'status_failed' })
  }
}
