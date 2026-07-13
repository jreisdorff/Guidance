// App-wide auth state. Holds the session token + user, persists them in the
// device keychain (expo-secure-store), and exposes signIn / signOut.
//
// signIn: native Google picker -> Google ID token -> POST /api/auth/google ->
// our session token, which we store and send as Bearer on later requests.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import * as SecureStore from 'expo-secure-store'
import {
  signInWithGoogle,
  signOutGoogle,
  GoogleSignInCancelled,
} from './google'
import { exchangeGoogleToken, type GoogleAuthResult } from '../api/client'

type User = GoogleAuthResult['user']

type AuthState = {
  loading: boolean // true while restoring a saved session on launch
  token: string | null
  user: User | null
  signingIn: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const TOKEN_KEY = 'guidance.session.token'
const USER_KEY = 'guidance.session.user'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  // Restore a saved session on launch.
  useEffect(() => {
    ;(async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ])
        if (savedToken) {
          setToken(savedToken)
          setUser(savedUser ? JSON.parse(savedUser) : null)
        }
      } catch {
        // ignore — treat as logged out
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function signIn() {
    setSigningIn(true)
    try {
      const idToken = await signInWithGoogle()
      const { token: sessionToken, user: signedInUser } =
        await exchangeGoogleToken(idToken)
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, sessionToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(signedInUser)),
      ])
      setToken(sessionToken)
      setUser(signedInUser)
    } catch (err) {
      if (err instanceof GoogleSignInCancelled) return // user backed out — no-op
      throw err
    } finally {
      setSigningIn(false)
    }
  }

  async function signOut() {
    await signOutGoogle()
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ])
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ loading, token, user, signingIn, signIn, signOut }}
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
