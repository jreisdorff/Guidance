// Local development server. Mirrors the Vercel serverless functions in api/*.js
// but as one long-lived Express process, so `npm run dev` works without the
// Vercel CLI. Both paths share the same logic in lib/claude.js.
//
// In production on Vercel, this file is NOT used — api/affirm.js and
// api/health.js are deployed as serverless functions instead.

import 'dotenv/config'
import express from 'express'
import { aiAvailable, composeAffirmation, STATUS_FOR_CODE } from '../lib/claude.js'
import {
  bearerToken,
  deleteUserAccount,
  verifyFirebaseToken,
  STATUS_FOR_CODE as AUTH_STATUS,
} from '../lib/firebaseAdmin.js'
import {
  canGenerate,
  markFreeUsed,
  readEntitlement,
  saveEntitlement,
  verifyAppleReceipt,
} from '../lib/subscription.js'

const PORT = process.env.PORT || 8787

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ aiAvailable: aiAvailable() })
})

app.post('/api/affirm', async (req, res) => {
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
    res.json(data)
  } catch (err) {
    res
      .status(STATUS_FOR_CODE[err.code] || 502)
      .json({ error: err.code || 'generation_failed' })
  }
})

// The backend's view of the user's subscription (source of truth for the app).
app.get('/api/subscription-status', async (req, res) => {
  let decoded
  try {
    decoded = await verifyFirebaseToken(bearerToken(req))
  } catch (err) {
    return res.status(AUTH_STATUS[err.code] || 401).json({ error: err.code || 'unauthorized' })
  }
  try {
    const ent = await readEntitlement(decoded.uid)
    res.json({ active: ent.active, expiresAt: ent.expiresMs })
  } catch (err) {
    res.status(AUTH_STATUS[err.code] || 500).json({ error: err.code || 'status_failed' })
  }
})

// Verify an App Store receipt with Apple and record the entitlement.
app.post('/api/verify-subscription', async (req, res) => {
  let decoded
  try {
    decoded = await verifyFirebaseToken(bearerToken(req))
  } catch (err) {
    return res.status(AUTH_STATUS[err.code] || 401).json({ error: err.code || 'unauthorized' })
  }
  const receipt = req.body?.receipt
  if (!receipt) return res.status(400).json({ error: 'missing_receipt' })
  try {
    const { active, expiresMs } = await verifyAppleReceipt(receipt)
    await saveEntitlement(decoded.uid, expiresMs)
    res.json({ active, expiresAt: expiresMs })
  } catch (err) {
    res.status(AUTH_STATUS[err.code] || 502).json({ error: err.code || 'verify_failed' })
  }
})

app.post('/api/delete-account', async (req, res) => {
  let decoded
  try {
    decoded = await verifyFirebaseToken(bearerToken(req))
  } catch (err) {
    return res
      .status(AUTH_STATUS[err.code] || 401)
      .json({ error: err.code || 'unauthorized' })
  }
  try {
    await deleteUserAccount(decoded.uid)
    res.json({ ok: true })
  } catch (err) {
    res
      .status(AUTH_STATUS[err.code] || 500)
      .json({ error: err.code || 'delete_failed' })
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
