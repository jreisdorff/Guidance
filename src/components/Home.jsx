import { useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { generateAffirmation } from '../affirmations.js'
import { checkAiAvailable, generateAffirmationAI } from '../ai.js'
import { auth } from '../firebase.js'
import { addEntry, removeEntry, subscribeEntries } from '../journal.js'
import { deleteAccount } from '../account.js'
import { AffirmationResult } from './AffirmationResult.jsx'
import { Composer } from './Composer.jsx'
import { Journal } from './Journal.jsx'
import { ModeToggle } from './ModeToggle.jsx'
import { SunMark } from './icons.jsx'

// Mode preference stays in localStorage — it's just a device-level UI choice.
const MODE_KEY = 'divinity.mode.v1'

const PROMPTS = [
  'What is weighing on you right now?',
  'What are you feeling about yourself today?',
  'What thought has been circling in your mind?',
  'What is the critical voice saying to you?',
  'What do you wish you could believe about yourself?',
]

// The signed-in experience: compose an affirmation, keep a journal. `user` is
// guaranteed present here — App handles the auth gate.
export function Home({ user }) {
  const [entry, setEntry] = useState('')
  const [result, setResult] = useState(null)
  const [journal, setJournal] = useState([])
  const [prompt] = useState(() => PROMPTS[Math.floor((Date.now() / 1000) % PROMPTS.length)])
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'ai')
  const [aiAvailable, setAiAvailable] = useState(null) // null = unknown yet
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    checkAiAvailable().then(setAiAvailable)
  }, [])

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  // Live-subscribe to this user's journal in Firestore.
  useEffect(() => subscribeEntries(user.uid, setJournal), [user])

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [result])

  // Produces an affirmation, trying Claude first (when in AI mode) and quietly
  // falling back to the offline local engine on any failure.
  async function produce(text, avoid) {
    if (mode === 'ai') {
      try {
        const ai = await generateAffirmationAI(text, avoid)
        setAiAvailable(true)
        return ai
      } catch (err) {
        if (err.status === 401) {
          await signOut(auth) // session expired — the gate will take over
          return null
        }
        if (err.status === 503) {
          setAiAvailable(false)
          setNotice(
            'No API key found — add one to enable AI affirmations. Here’s one from the local engine for now.',
          )
        } else if (err.reason === 'refusal') {
          setNotice('Let’s hold this one gently — here’s a grounding affirmation instead.')
        } else {
          setNotice('Couldn’t reach the AI just now — here’s one from the local engine.')
        }
        return { ...generateAffirmation(text, avoid), source: 'local' }
      }
    }
    return { ...generateAffirmation(text, avoid), source: 'local' }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    const text = entry.trim()
    if (!text || loading) return

    setLoading(true)
    setNotice(null)
    const generated = await produce(text, result?.affirmation)
    if (!generated) return setLoading(false) // signed out; gate will take over
    // groupId anchors this moment; re-phrasings (handleAnother) reuse it so the
    // journal can group them under one card.
    const ts = Date.now()
    const record = { ts, groupId: ts, entry: text, ...generated }
    setResult(record)
    // Persist to the user's Firestore journal; the subscription refreshes the list.
    if (user) addEntry(user.uid, record).catch(() => {})
    setLoading(false)
  }

  async function handleAnother() {
    if (!result || loading) return
    setLoading(true)
    setNotice(null)
    const generated = await produce(result.entry, result.affirmation)
    if (!generated) return setLoading(false)
    // Each re-phrasing is logged as its own entry, but shares the original
    // moment's groupId so the journal can group them under one card.
    const record = {
      ts: Date.now(),
      groupId: result.groupId ?? result.ts,
      entry: result.entry,
      ...generated,
    }
    setResult(record)
    if (user) addEntry(user.uid, record).catch(() => {})
    setLoading(false)
  }

  function reset() {
    setEntry('')
    setResult(null)
    setNotice(null)
  }

  function deleteEntry(id) {
    if (user) removeEntry(user.uid, id).catch(() => {})
  }

  // Confirmation is handled by the Journal's dialog before this is called.
  function clearJournal() {
    if (!user) return
    journal.forEach((r) => removeEntry(user.uid, r.id).catch(() => {}))
  }

  // Download the signed-in user's full journal as a portable file. Runs entirely
  // in the browser — the data is already loaded, so nothing is sent anywhere; the
  // user just saves a copy of what's theirs. Supports a machine-readable JSON
  // export and a human-readable plain-text one.
  function exportJournal(format = 'json') {
    if (!user || !journal.length) return

    let contents, type, ext
    if (format === 'txt') {
      const lines = [
        'Guidance — journal export',
        `Exported ${new Date().toLocaleString()}`,
        `${journal.length} ${journal.length === 1 ? 'entry' : 'entries'}`,
      ]
      journal.forEach((r) => {
        lines.push(
          '',
          '─'.repeat(32),
          new Date(r.ts).toLocaleString() + (r.themeLabel ? ` · ${r.themeLabel}` : ''),
          '',
          'You wrote:',
          `  ${r.entry}`,
        )
        if (r.reflect) lines.push('', 'Reflection:', `  ${r.reflect}`)
        lines.push('', 'Affirmation:', `  ${r.affirmation}`)
      })
      contents = lines.join('\n') + '\n'
      type = 'text/plain'
      ext = 'txt'
    } else {
      contents = JSON.stringify(
        {
          app: 'Guidance',
          exportedAt: new Date().toISOString(),
          account: {
            uid: user.uid,
            email: user.email ?? null,
            name: user.displayName ?? null,
            phone: user.phoneNumber ?? null,
          },
          entryCount: journal.length,
          entries: journal.map((r) => ({
            id: r.id,
            date: new Date(r.ts).toISOString(),
            ts: r.ts,
            theme: r.themeLabel ?? null,
            entry: r.entry,
            reflection: r.reflect ?? null,
            affirmation: r.affirmation,
            source: r.source ?? null,
          })),
        },
        null,
        2,
      )
      type = 'application/json'
      ext = 'json'
    }

    const blob = new Blob([contents], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guidance-journal-${new Date().toISOString().slice(0, 10)}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Permanently delete the account and every journal entry, via the backend.
  // Encourages exporting first, then requires an explicit confirmation.
  async function handleDeleteAccount() {
    if (!user || deleting) return
    const ok = window.confirm(
      'Permanently delete your account and all your journal entries?\n\n' +
        'This cannot be undone. If you want to keep your entries, cancel and use Export first.',
    )
    if (!ok) return
    setDeleting(true)
    setNotice(null)
    try {
      await deleteAccount()
      await signOut(auth).catch(() => {})
      reset()
    } catch {
      setNotice('Couldn’t delete your account just now. Please try again.')
      setDeleting(false)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    reset()
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-orange-100 text-stone-700">
      {/* Sunrise glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200/70 via-orange-200/50 to-rose-200/40 blur-3xl" />
        <div className="animate-glow absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-200/50 to-amber-100/30 blur-3xl [animation-delay:2s]" />
      </div>

      <main className="relative mx-auto flex min-h-full max-w-2xl flex-col px-6 pb-16 pt-12 sm:pt-20">
        {/* Sign out — top right */}
        <button
          onClick={handleSignOut}
          className="absolute right-6 top-6 z-10 text-sm font-600 text-stone-400 underline-offset-2 transition hover:text-stone-600 hover:underline sm:top-8"
        >
          Sign out
        </button>

        {/* Header */}
        <header className="animate-rise text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center">
            <SunMark />
          </div>
          <h1 className="font-serif text-4xl font-500 tracking-tight text-stone-800 sm:text-5xl">
            Guidance
          </h1>

          <ModeToggle mode={mode} setMode={setMode} aiAvailable={aiAvailable} />
        </header>

        <Composer
          prompt={prompt}
          entry={entry}
          setEntry={setEntry}
          onSubmit={handleSubmit}
          loading={loading}
          notice={notice}
        />

        {/* Loading placeholder */}
        {loading && !result && (
          <div className="animate-rise mt-10 rounded-3xl bg-white/60 p-10 text-center shadow-xl shadow-orange-900/5 ring-1 ring-white/60 backdrop-blur">
            <div className="mx-auto h-10 w-10">
              <SunMark />
            </div>
            <p className="mt-4 font-serif text-lg italic text-stone-500">
              Composing something just for you…
            </p>
          </div>
        )}

        {result && (
          <AffirmationResult
            key={result.affirmation}
            result={result}
            loading={loading}
            onAnother={handleAnother}
            onReset={reset}
            sectionRef={resultRef}
          />
        )}

        <Journal
          journal={journal}
          onDelete={deleteEntry}
          onClear={clearJournal}
          onExport={exportJournal}
        />

        <footer className="mt-auto pt-16 text-center text-xs text-stone-400">
          {mode === 'ai' && aiAvailable ? (
            <p>Affirmations are written live 🌅</p>
          ) : (
            <p>Everything you write stays on this device. Only for you. 🌅</p>
          )}
          <button
            onClick={handleSignOut}
            className="mt-3 text-stone-400 underline-offset-2 transition hover:text-stone-600 hover:underline"
          >
            Sign out
          </button>
          <p className="mt-4 text-stone-400">
            <a href="/privacy" className="underline-offset-2 transition hover:text-stone-600 hover:underline">Privacy</a>
            <span className="px-1.5">·</span>
            <a href="/terms" className="underline-offset-2 transition hover:text-stone-600 hover:underline">Terms</a>
            <span className="px-1.5">·</span>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="underline-offset-2 transition hover:text-rose-500 hover:underline disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </button>
          </p>
        </footer>
      </main>
    </div>
  )
}
