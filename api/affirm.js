// Vercel serverless function: POST /api/affirm
import { composeAffirmation, STATUS_FOR_CODE } from '../lib/claude.js'
import {
  bearerToken,
  verifyFirebaseToken,
  STATUS_FOR_CODE as AUTH_STATUS,
} from '../lib/firebaseAdmin.js'
import { canGenerate, markFreeUsed } from '../lib/subscription.js'

// Give Claude room to respond (default Vercel timeout is short).
export const maxDuration = 30

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  // Web and mobile both send a Firebase ID token as `Authorization: Bearer`.
  let decoded
  try {
    decoded = await verifyFirebaseToken(bearerToken(req))
  } catch (err) {
    return res.status(AUTH_STATUS[err.code] || 401).json({ error: err.code || 'unauthorized' })
  }
  // The free-question / subscription quota applies to the mobile app only (it's
  // the one with the paywall). The web app is unlimited, as before.
  const isMobile = (req.headers['x-guidance-client'] || '') === 'mobile'
  let gate = { allowed: true, subscribed: true }
  if (isMobile) {
    try {
      gate = await canGenerate(decoded.uid)
    } catch (err) {
      return res.status(AUTH_STATUS[err.code] || 500).json({ error: err.code || 'quota_failed' })
    }
  }
  if (!gate.allowed) return res.status(402).json({ error: 'payment_required' })
  try {
    const data = await composeAffirmation(req.body || {})
    // Only count the free question once the generation actually succeeded.
    if (isMobile && !gate.subscribed) await markFreeUsed(decoded.uid).catch(() => {})
    res.status(200).json(data)
  } catch (err) {
    res.status(STATUS_FOR_CODE[err.code] || 502).json({
      error: err.code || 'generation_failed',
    })
  }
}
