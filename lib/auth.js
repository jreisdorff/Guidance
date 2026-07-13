// Passcode gate — shared by the local dev server and the Vercel functions.
//
// The passcode lives only in the environment (DIVINITY_PASSCODE) and is checked
// server-side. On success we set an HTTP-only cookie holding a hash of the
// passcode; every protected request re-verifies that cookie. The browser never
// sees the passcode itself, and page scripts can't read the cookie.
//
// If DIVINITY_PASSCODE is not set, the gate is disabled and the site is open
// (handy for local dev). Set it in .env locally and in Vercel's env vars in
// production to turn the gate on.

import crypto from 'node:crypto'

const COOKIE = 'divinity_auth'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function getPasscode() {
  return process.env.DIVINITY_PASSCODE || ''
}

export function passcodeRequired() {
  return getPasscode().length > 0
}

function expectedToken() {
  return crypto
    .createHash('sha256')
    .update(`divinity:${getPasscode()}`)
    .digest('hex')
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  try {
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export function verifyPasscode(input) {
  const pass = getPasscode()
  if (!pass) return false
  return safeEqual(String(input ?? ''), pass)
}

function parseCookies(req) {
  if (req.cookies) return req.cookies // Vercel populates this
  const header = req.headers?.cookie || ''
  const out = {}
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > -1) {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
    }
  }
  return out
}

export function isAuthed(req) {
  if (!passcodeRequired()) return true
  const token = parseCookies(req)[COOKIE]
  return token ? safeEqual(token, expectedToken()) : false
}

function secureFlag() {
  return process.env.VERCEL || process.env.NODE_ENV === 'production'
    ? '; Secure'
    : ''
}

export function authCookie() {
  return `${COOKIE}=${expectedToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}${secureFlag()}`
}

export function clearCookie() {
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureFlag()}`
}
