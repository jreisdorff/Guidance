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

// `groupId` anchors a moment: re-phrasings of the same entry share it, so the
// journal can collapse them into one card (mirrors the web app).
export type JournalItem = Guidance & {
  id: string
  entry: string
  ts: number
  groupId?: number
}

const db = getFirestore(getApp())

function entriesCol(uid: string) {
  return collection(db, 'users', uid, 'entries')
}

export function addEntry(
  uid: string,
  record: { entry: string; ts: number; groupId?: number } & Guidance,
) {
  return addDoc(entriesCol(uid), record)
}

export function subscribeEntries(
  uid: string,
  cb: (items: JournalItem[]) => void,
) {
  const q = query(entriesCol(uid), orderBy('ts', 'desc'))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JournalItem, 'id'>) }))),
    (err: { code?: string; message?: string }) =>
      console.error('journal subscription error:', err.code, err.message),
  )
}

export function removeEntry(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, 'entries', id))
}
