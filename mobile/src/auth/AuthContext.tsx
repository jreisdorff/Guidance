// App-wide auth state, backed by React Native Firebase. Firebase persists the
// session natively across restarts, so there's no manual token storage. Every
// API call fetches a fresh Firebase ID token (they expire hourly).
//
// Google: native picker → Google ID token → Firebase credential.
// Phone: Firebase sends an SMS code → we confirm it in LoginScreen.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
} from '@react-native-firebase/auth'
import { firebaseAuth } from './firebase'
import { getGoogleIdToken, signOutGoogle, GoogleSignInCancelled } from './google'

// Types derived from the modular API (avoids mixing the deprecated
// FirebaseAuthTypes namespace, whose shapes differ from the modular ones).
export type FbUser = NonNullable<typeof firebaseAuth.currentUser>
export type Confirmation = Awaited<ReturnType<typeof signInWithPhoneNumber>>

type AuthState = {
  loading: boolean // true while restoring the session on launch
  user: FbUser | null
  signingIn: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPhone: (phoneNumber: string) => Promise<Confirmation>
  // Guest mode: a real (anonymous) Firebase user, so the backend still gets a
  // valid token. Lets people try a few questions before signing in for real.
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<FbUser | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    setSigningIn(true)
    try {
      const idToken = await getGoogleIdToken()
      const credential = GoogleAuthProvider.credential(idToken)
      await signInWithCredential(firebaseAuth, credential)
    } catch (err) {
      if (err instanceof GoogleSignInCancelled) return // user backed out
      throw err
    } finally {
      setSigningIn(false)
    }
  }

  function signInWithPhone(phoneNumber: string) {
    return signInWithPhoneNumber(firebaseAuth, phoneNumber)
  }

  async function signInAsGuest() {
    await firebaseSignInAnonymously(firebaseAuth)
  }

  async function signOut() {
    await signOutGoogle()
    await firebaseSignOut(firebaseAuth)
  }

  async function getToken() {
    return (await firebaseAuth.currentUser?.getIdToken()) ?? null
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        signingIn,
        signInWithGoogle,
        signInWithPhone,
        signInAsGuest,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
