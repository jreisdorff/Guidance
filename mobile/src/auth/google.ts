// Runs the native Google account picker and returns a Google ID token, which we
// exchange for a Firebase credential (see AuthContext). Requires a dev/prod
// build (config plugin) — it does NOT work in Expo Go.

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config'

let configured = false

export function configureGoogle() {
  if (configured) return
  GoogleSignin.configure({
    // webClientId is the Firebase project's OAuth web client; Firebase verifies
    // the resulting ID token against it.
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
export async function getGoogleIdToken(): Promise<string> {
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

  const { idToken } = await GoogleSignin.getTokens()
  if (!idToken) throw new Error('no_id_token')
  return idToken
}

export async function signOutGoogle() {
  try {
    await GoogleSignin.signOut()
  } catch {
    // ignore — signing out of Firebase is what matters
  }
}
