// Per-user journal, stored in Cloud Firestore under users/{uid}/entries.
// Ordered by `ts` (client milliseconds) so ordering/grouping is stable
// immediately, without waiting for a server timestamp to resolve.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from './firebase.js'

function entriesCol(uid) {
  return collection(db, 'users', uid, 'entries')
}

// Saves one affirmation for the user. `record` is { entry, ts, themeLabel,
// reflect, affirmation, source }.
export function addEntry(uid, record) {
  return addDoc(entriesCol(uid), record)
}

// Subscribes to the user's entries (newest first). Returns an unsubscribe fn.
export function subscribeEntries(uid, cb) {
  const q = query(entriesCol(uid), orderBy('ts', 'desc'))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error('journal subscription error:', err.code, err.message),
  )
}

export function removeEntry(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'entries', id))
}
