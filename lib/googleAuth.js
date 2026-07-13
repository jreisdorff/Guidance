// Google sign-in for the mobile app — shared by the local dev server
// (server/index.js) and the Vercel serverless function (api/auth/google.js).
//
// Flow: the mobile app signs in with Google on-device and gets a Google ID
// token. It POSTs that to /api/auth/google. Here we VERIFY the Google token,
// then issue OUR OWN session JWT that the app sends as `Authorization: Bearer`
// on later requests (e.g. /api/affirm). This keeps the web app's cookie/passcode
// gate (lib/auth.js) completely untouched — mobile uses tokens, web uses cookies.

import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'

const SESSION_MAX_AGE = '30d'

// The OAuth client IDs whose ID tokens we accept, comma-separated in the env.
// The native @react-native-google-signin library mints ID tokens whose audience
// is the WEB client ID (even on iOS/Android), so that one must be included.
export function acceptedClientIds() {
  return (process.env.GOOGLE_CLIENT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function jwtSecret() {
  return process.env.JWT_SECRET || ''
}

export function googleAuthConfigured() {
  return acceptedClientIds().length > 0 && jwtSecret().length > 0
}

let _client
function googleClient() {
  if (!_client) _client = new OAuth2Client()
  return _client
}

// Verifies a Google ID token and returns the user, or throws an Error with a
// `.code`. Throws 'not_configured' if the server env isn't set up.
export async function verifyGoogleIdToken(idToken) {
  if (!googleAuthConfigured()) throw fail('not_configured')
  if (!idToken) throw fail('bad_google_token')

  let ticket
  try {
    ticket = await googleClient().verifyIdToken({
      idToken: String(idToken),
      audience: acceptedClientIds(),
    })
  } catch {
    throw fail('bad_google_token')
  }

  const payload = ticket.getPayload()
  if (!payload?.sub) throw fail('bad_google_token')

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  }
}

// Signs our own session token carrying the user's identity.
export function issueSessionToken(user) {
  return jwt.sign(
    { sub: user.sub, email: user.email, name: user.name, picture: user.picture },
    jwtSecret(),
    { expiresIn: SESSION_MAX_AGE },
  )
}

// Verifies a session token we issued. Returns the payload, or null if invalid.
export function verifySessionToken(token) {
  if (!token || !jwtSecret()) return null
  try {
    return jwt.verify(token, jwtSecret())
  } catch {
    return null
  }
}

// Pulls the bearer token out of the Authorization header, or '' if absent.
export function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1].trim() : ''
}

// True if the request carries a valid session token we issued (mobile clients).
export function isBearerAuthed(req) {
  return Boolean(verifySessionToken(bearerToken(req)))
}

function fail(code) {
  const err = new Error(code)
  err.code = code
  return err
}

// Maps a googleAuth error code to the HTTP status the client expects.
export const STATUS_FOR_CODE = {
  not_configured: 503,
  bad_google_token: 401,
}
