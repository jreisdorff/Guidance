// Runtime config, read from EXPO_PUBLIC_* env vars. Expo inlines any variable
// prefixed with EXPO_PUBLIC_ at build time, so these are available in the bundle
// (they are not secrets — Google OAuth *client IDs* are public by design).
//
// Set them in mobile/.env for local development, or per-profile in eas.json /
// EAS project env vars for builds. See mobile/README.md.

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787'

// Web OAuth client ID — REQUIRED. The native Google Sign-In library returns an
// ID token whose audience is this web client, and the backend verifies it.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''

// iOS OAuth client ID — required for the iOS build's native sign-in.
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? ''

// The public marketing/legal site (the same pages the web app links to). Used
// for the Privacy and Terms links in the app footer.
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://guidances.net'
export const PRIVACY_URL = `${SITE_URL}/privacy`
export const TERMS_URL = `${SITE_URL}/terms`

// The App Store auto-renewable subscription product id. Create this in App
// Store Connect ($0.99/month) with a 7-day free-trial introductory offer, and
// keep this id in sync with the product id there.
export const SUBSCRIPTION_SKU =
  process.env.EXPO_PUBLIC_SUBSCRIPTION_SKU ?? 'com.jreisdorff.guidance.monthly'
