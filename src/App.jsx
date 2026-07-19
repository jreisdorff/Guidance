import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth'
import { auth } from './firebase.js'
import { Backdrop } from './components/Backdrop.jsx'
import { SignIn } from './components/SignIn.jsx'
import { Home } from './components/Home.jsx'

// Auth gate. Fresh visitors skip the login page and go straight to the prompt:
// we sign them in anonymously (a "guest") so they can ask their free questions
// right away. The login screen only appears when someone explicitly asks for it
// (the landing "Log in" link, or a sign-out from the app) — tracked with a
// `signin` flag in the URL so it survives a reload — or as a fallback if
// anonymous sign-in isn't available.
export default function App() {
  const [user, setUser] = useState(undefined) // undefined = checking, null = signed out
  const [wantsSignIn, setWantsSignIn] = useState(
    () => new URLSearchParams(window.location.search).has('signin'),
  )
  const guestTried = useRef(false)

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), [])

  // Once we know the visitor is signed out and hasn't asked for the login page,
  // sign them in as a guest. On failure (e.g. anonymous auth disabled), fall
  // back to showing the login screen instead of stranding them on the backdrop.
  useEffect(() => {
    if (user !== null || wantsSignIn || guestTried.current) return
    guestTried.current = true
    signInAnonymously(auth).catch(() => setWantsSignIn(true))
  }, [user, wantsSignIn])

  // Take the user to the login page: remember the intent (so it survives a
  // reload and doesn't get overridden by auto-guest), then sign out.
  async function requestSignIn() {
    const url = new URL(window.location.href)
    url.searchParams.set('signin', '1')
    window.history.replaceState({}, '', url)
    guestTried.current = true
    setWantsSignIn(true)
    await signOut(auth).catch(() => {})
  }

  if (user === undefined) return <Backdrop />
  if (user === null) {
    // Either the login screen was requested, or we're mid anonymous sign-in.
    return wantsSignIn ? <SignIn /> : <Backdrop />
  }
  return <Home user={user} onRequestSignIn={requestSignIn} />
}
