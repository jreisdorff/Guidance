// Thin wrapper over @react-native-google-signin/google-signin.
//
// This runs the NATIVE Google account picker, so it requires a development or
// production build (config plugin in app.json) — it does NOT work in Expo Go.
// See mobile/README.md for the Google Cloud setup.

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config'

let configured = false

export function configureGoogle() {
  if (configured) return
  GoogleSignin.configure({
    // webClientId makes Google return an ID token; the backend verifies it
    // against this same client ID (audience).
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  })
  configured = true
}

export class GoogleSignInCancelled extends Error {
  constructor() {
    super('cancelled')
    this.name = 'GoogleSignInCancelled'
  }
}

// Runs the native sign-in and returns the Google ID token. Throws
// GoogleSignInCancelled if the user dismisses the picker.
export async function signInWithGoogle(): Promise<string> {
  configureGoogle()
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

  try {
    await GoogleSignin.signIn()
  } catch (err: any) {
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleSignInCancelled()
    }
    throw err
  }

  // getTokens() reliably returns the current idToken across library versions.
  const { idToken } = await GoogleSignin.getTokens()
  if (!idToken) throw new Error('no_id_token')
  return idToken
}

export async function signOutGoogle() {
  try {
    await GoogleSignin.signOut()
  } catch {
    // ignore — signing out locally is what matters
  }
}
