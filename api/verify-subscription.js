// Vercel serverless function: POST /api/verify-subscription
// The app sends a fresh App Store receipt; we verify it with Apple and record
// the resulting entitlement (expiry) on the authenticated user's doc.
import {
  bearerToken,
  verifyFirebaseToken,
  STATUS_FOR_CODE,
} from '../lib/firebaseAdmin.js'
import { saveEntitlement, verifyAppleReceipt } from '../lib/subscription.js'

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
  const receipt = req.body?.receipt
  if (!receipt) return res.status(400).json({ error: 'missing_receipt' })
  try {
    const { active, expiresMs } = await verifyAppleReceipt(receipt)
    await saveEntitlement(decoded.uid, expiresMs)
    res.status(200).json({ active, expiresAt: expiresMs })
  } catch (err) {
    res
      .status(STATUS_FOR_CODE[err.code] || 502)
      .json({ error: err.code || 'verify_failed' })
  }
}
