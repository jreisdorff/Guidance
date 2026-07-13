// Per-user journal in Cloud Firestore (users/{uid}/entries), mirroring the web
// app. Ordered by `ts` (client ms) so ordering is stable immediately.
import { getApp } from '@react-native-firebase/app'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from '@react-native-firebase/firestore'
import type { Guidance } from './api/client'

export type JournalItem = Guidance & { id: string; entry: string; ts: number }

const db = getFirestore(getApp())

function entriesCol(uid: string) {
  return collection(db, 'users', uid, 'entries')
}

export function addEntry(
  uid: string,
  record: { entry: string; ts: number } & Guidance,
) {
  return addDoc(entriesCol(uid), record)
}

export function subscribeEntries(
  uid: string,
  cb: (items: JournalItem[]) => void,
) {
  const q = query(entriesCol(uid), orderBy('ts', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JournalItem, 'id'>) })))
  })
}

export function removeEntry(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, 'entries', id))
}
