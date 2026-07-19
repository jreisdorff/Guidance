// Subscription entitlement + free-question quota, shared by the local dev
// server (server/index.js) and the Vercel functions (api/*.js).
//
// Access model: each user gets FREE_LIMIT free questions, after which they must
// subscribe. The subscription (a $0.99/month auto-renewable product with a
// 7-day free trial) is bought in the app through the App Store; the app hands us
// the receipt, we verify it with Apple, and store the expiry on the user doc.
// /api/affirm then allows a request when the user is subscribed or still within
// their free quota.

import { getDb } from './firebaseAdmin.js'

export const FREE_LIMIT = 1

const APPLE_PROD = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt'

function userDoc(uid) {
  return getDb().doc(`users/${uid}`)
}

// Verifies an iOS receipt with Apple. Tries production first and falls back to
// sandbox (status 21007), as Apple recommends. Returns the furthest expiry (ms)
// found among auto-renewable transactions, and whether it's still active.
export async function verifyAppleReceipt(receipt) {
  const password = process.env.APPLE_SHARED_SECRET
  if (!password) throw fail('not_configured')
  const payload = JSON.stringify({
    'receipt-data': receipt,
    password,
    'exclude-old-transactions': true,
  })

  async function call(url) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
    return res.json()
  }

  let data = await call(APPLE_PROD)
  if (data.status === 21007) data = await call(APPLE_SANDBOX)
  if (data.status !== 0) throw fail('invalid_receipt')

  const infos = data.latest_receipt_info || []
  let expiresMs = 0
  for (const item of infos) {
    const ms = Number(item.expires_date_ms || 0)
    if (ms > expiresMs) expiresMs = ms
  }
  return { active: expiresMs > Date.now(), expiresMs: expiresMs || null }
}

// The user's current entitlement + free usage from Firestore.
export async function readEntitlement(uid) {
  const snap = await userDoc(uid).get()
  const d = snap.exists ? snap.data() || {} : {}
  const expiresMs = Number(d.subExpiresMs || 0)
  return {
    active: expiresMs > Date.now(),
    expiresMs: expiresMs || null,
    freeUsed: Number(d.freeUsed || 0),
  }
}

// Records a verified subscription expiry on the user doc.
export async function saveEntitlement(uid, expiresMs) {
  await userDoc(uid).set({ subExpiresMs: expiresMs || 0 }, { merge: true })
}

// Counts one free question against the user.
export async function markFreeUsed(uid) {
  const { FieldValue } = await import('firebase-admin/firestore')
  await userDoc(uid).set({ freeUsed: FieldValue.increment(1) }, { merge: true })
}

// Gate for /api/affirm. Returns true if the request should be allowed (the user
// is subscribed, or still has a free question). Does NOT consume the free
// question — call markFreeUsed after a successful generation.
export async function canGenerate(uid) {
  const ent = await readEntitlement(uid)
  if (ent.active) return { allowed: true, subscribed: true }
  if (ent.freeUsed < FREE_LIMIT) return { allowed: true, subscribed: false }
  return { allowed: false, subscribed: false }
}

function fail(code) {
  const err = new Error(code)
  err.code = code
  return err
}
