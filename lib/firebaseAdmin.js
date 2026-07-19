// Firebase Authentication verification — shared by the local dev server
// (server/index.js) and the Vercel serverless functions (api/*.js).
//
// Web and mobile clients sign in with Firebase (Google or phone), obtain a
// Firebase ID token, and send it as `Authorization: Bearer <token>`. Here we
// verify that token with the Firebase Admin SDK. No custom JWT and no per-app
// Google client verification — Firebase is the single source of identity.

import admin from 'firebase-admin'

let _app
// Initializes the Admin SDK once, using a service-account JSON provided in the
// environment (FIREBASE_SERVICE_ACCOUNT — the file from Firebase Console →
// Project settings → Service accounts). Returns null if not configured.
function getApp() {
  if (_app) return _app
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null
  if (admin.apps.length) {
    _app = admin.app()
    return _app
  }
  let creds
  try {
    // Accept either raw JSON or base64-encoded JSON (easier to store in envs).
    const text = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8')
    creds = JSON.parse(text)
  } catch {
    throw fail('not_configured')
  }
  _app = admin.initializeApp({ credential: admin.credential.cert(creds) })
  return _app
}

export function firebaseConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT)
}

// Firestore handle (admin). Throws not_configured if the service account is
// missing. Shared by the subscription/entitlement helpers.
export function getDb() {
  const app = getApp()
  if (!app) throw fail('not_configured')
  return admin.firestore(app)
}

// Verifies a Firebase ID token. Returns the decoded token (uid, and whichever
// of email / phone_number the user signed in with). Throws Error with `.code`.
export async function verifyFirebaseToken(idToken) {
  const app = getApp()
  if (!app) throw fail('not_configured')
  if (!idToken) throw fail('unauthorized')
  try {
    return await admin.auth(app).verifyIdToken(String(idToken))
  } catch {
    throw fail('unauthorized')
  }
}

// Permanently deletes a user: all of their journal data (the users/{uid}
// document and its `entries` subcollection) and then the auth account itself.
// Runs with admin privileges, so it needs no recent-login re-auth from the
// client and isn't limited by client-side security rules.
export async function deleteUserAccount(uid) {
  const app = getApp()
  if (!app) throw fail('not_configured')
  if (!uid) throw fail('unauthorized')
  const db = admin.firestore(app)
  await db.recursiveDelete(db.doc(`users/${uid}`))
  await admin.auth(app).deleteUser(uid)
}

// Pulls the bearer token out of the Authorization header, or '' if absent.
export function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1].trim() : ''
}

// True if the request carries a valid Firebase ID token. Never throws.
export async function isRequestAuthed(req) {
  try {
    await verifyFirebaseToken(bearerToken(req))
    return true
  } catch {
    return false
  }
}

function fail(code) {
  const err = new Error(code)
  err.code = code
  return err
}

export const STATUS_FOR_CODE = {
  not_configured: 503,
  unauthorized: 401,
  delete_failed: 500,
}
