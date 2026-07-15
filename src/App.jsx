import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase.js'
import { Backdrop } from './components/Backdrop.jsx'
import { SignIn } from './components/SignIn.jsx'
import { Home } from './components/Home.jsx'

// Auth gate: a calm backdrop while we check, the sign-in screen when signed out,
// and the signed-in app (Home) once there's a user.
export default function App() {
  const [user, setUser] = useState(undefined) // undefined = checking, null = signed out

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), [])

  if (user === undefined) return <Backdrop />
  if (user === null) return <SignIn />
  return <Home user={user} />
}
