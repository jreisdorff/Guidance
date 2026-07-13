import { useEffect, useRef, useState } from 'react'
import { generateAffirmation } from './affirmations.js'
import {
  checkAiAvailable,
  generateAffirmationAI,
  getSession,
  login,
  logout,
} from './ai.js'

// A stable, per-device identifier. Generated once on this device and kept in
// localStorage, so the journal below is scoped to this device rather than to a
// single global key shared by anyone who opens the app.
const DEVICE_KEY = 'divinity.device.v1'

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    // Storage unavailable — fall back to a session-only id.
    return 'ephemeral'
  }
}

const DEVICE_ID = getDeviceId()
const STORAGE_KEY = `divinity.journal.v1.${DEVICE_ID}`
const MODE_KEY = `divinity.mode.v1.${DEVICE_ID}`

const PROMPTS = [
  'What is weighing on you right now?',
  'What are you feeling about yourself today?',
  'What thought has been circling in your mind?',
  'What is the critical voice saying to you?',
  'What do you wish you could believe about yourself?',
]

function loadJournal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function App() {
  const [entry, setEntry] = useState('')
  const [result, setResult] = useState(null)
  const [journal, setJournal] = useState(loadJournal)
  const [showJournal, setShowJournal] = useState(false)
  const [prompt] = useState(() => PROMPTS[Math.floor((Date.now() / 1000) % PROMPTS.length)])
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'ai')
  const [aiAvailable, setAiAvailable] = useState(null) // null = unknown yet
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [authState, setAuthState] = useState('checking') // checking | locked | open
  const [passcodeRequired, setPasscodeRequired] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    getSession().then((s) => {
      setPasscodeRequired(s.passcodeRequired)
      setAuthState(s.passcodeRequired && !s.authed ? 'locked' : 'open')
    })
    checkAiAvailable().then(setAiAvailable)
  }, [])

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(journal))
    } catch {
      /* storage may be unavailable; the app still works for the session */
    }
  }, [journal])

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
          setAuthState('locked')
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
    if (!generated) return setLoading(false) // re-locked; gate will take over
    const record = { id: `${Date.now()}`, ts: Date.now(), entry: text, ...generated }
    setResult(record)
    setJournal((prev) => [record, ...prev].slice(0, 100))
    setLoading(false)
  }

  async function handleAnother() {
    if (!result || loading) return
    setLoading(true)
    setNotice(null)
    const generated = await produce(result.entry, result.affirmation)
    if (!generated) return setLoading(false)
    setResult((prev) => ({ ...prev, ...generated }))
    setLoading(false)
  }

  function reset() {
    setEntry('')
    setResult(null)
    setNotice(null)
  }

  function deleteEntry(id) {
    setJournal((prev) => prev.filter((r) => r.id !== id))
  }

  function clearJournal() {
    if (window.confirm('Clear your whole journal? This cannot be undone.')) {
      setJournal([])
    }
  }

  if (authState === 'checking') {
    return <Backdrop />
  }
  if (authState === 'locked') {
    return <PasscodeGate onUnlock={() => setAuthState('open')} />
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-orange-100 text-stone-700">
      {/* Sunrise glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200/70 via-orange-200/50 to-rose-200/40 blur-3xl" />
        <div className="animate-glow absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-200/50 to-amber-100/30 blur-3xl [animation-delay:2s]" />
      </div>

      <main className="relative mx-auto flex min-h-full max-w-2xl flex-col px-6 pb-16 pt-12 sm:pt-20">
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

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="animate-rise mt-8 [animation-delay:120ms]"
        >
          <label
            htmlFor="entry"
            className="mb-3 block text-center font-serif text-lg italic text-stone-500"
          >
            {prompt}
          </label>
          <div className="rounded-3xl bg-white/70 p-2 shadow-xl shadow-orange-900/5 ring-1 ring-white/60 backdrop-blur">
            <textarea
              id="entry"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(e)
              }}
              rows={4}
              placeholder="Type honestly…"
              className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-lg leading-relaxed text-stone-700 placeholder:text-stone-400 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3 px-3 pb-2">
              <span className="text-xs text-stone-400">⌘ + Enter</span>
              <button
                type="submit"
                disabled={!entry.trim() || loading}
                className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-2.5 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Composing…' : 'Receive an affirmation'}
              </button>
            </div>
          </div>
          {notice && (
            <p className="animate-rise mt-3 text-center text-sm text-amber-700/80">
              {notice}
            </p>
          )}
        </form>

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

        {/* Result */}
        {result && (
          <section
            ref={resultRef}
            key={result.affirmation}
            className={`animate-rise mt-10 transition-opacity ${loading ? 'opacity-50' : ''}`}
            aria-live="polite"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white/80 p-8 shadow-2xl shadow-orange-900/10 ring-1 ring-white/70 backdrop-blur sm:p-10">
              <div className="animate-glow pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/40 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <p className="text-sm font-600 uppercase tracking-widest text-amber-600/80">
                  {result.themeLabel}
                </p>
                <SourceBadge source={result.source} />
              </div>
              <p className="relative mt-3 text-stone-500">{result.reflect}</p>
              <blockquote className="relative mt-5 font-serif text-2xl leading-relaxed text-stone-800 sm:text-[1.7rem]">
                {result.affirmation}
              </blockquote>

              <div className="relative mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAnother}
                  disabled={loading}
                  className="rounded-full bg-stone-800/90 px-5 py-2 text-sm font-600 text-amber-50 transition hover:bg-stone-800 active:scale-[0.98] disabled:opacity-50"
                >
                  Say it another way
                </button>
                <button
                  onClick={reset}
                  className="rounded-full px-5 py-2 text-sm font-600 text-stone-500 transition hover:bg-white/60 hover:text-stone-700"
                >
                  Start fresh
                </button>
              </div>
            </div>

            <BreatheHint />
          </section>
        )}

        {/* Journal */}
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowJournal((s) => !s)}
              className="flex items-center gap-2 text-sm font-600 text-stone-500 transition hover:text-stone-700"
            >
              <span
                className={`transition-transform ${showJournal ? 'rotate-90' : ''}`}
              >
                ›
              </span>
              Your journal
              {journal.length > 0 && (
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-stone-400">
                  {journal.length}
                </span>
              )}
            </button>
            {showJournal && journal.length > 0 && (
              <button
                onClick={clearJournal}
                className="text-xs text-stone-400 transition hover:text-rose-500"
              >
                Clear all
              </button>
            )}
          </div>

          {showJournal && (
            <div className="animate-rise mt-4 space-y-3">
              {journal.length === 0 && (
                <p className="rounded-2xl bg-white/50 px-5 py-6 text-center text-sm text-stone-400">
                  Nothing here yet. What you share will be saved privately on this
                  device, for you to return to.
                </p>
              )}
              {journal.map((r) => (
                <article
                  key={r.id}
                  className="group rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-3">
                    <time className="text-xs uppercase tracking-wider text-stone-400">
                      {formatDate(r.ts)}
                    </time>
                    <button
                      onClick={() => deleteEntry(r.id)}
                      className="text-xs text-stone-300 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                      aria-label="Delete entry"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-2 text-sm italic text-stone-500">“{r.entry}”</p>
                  <p className="mt-3 font-serif text-lg leading-relaxed text-stone-700">
                    {r.affirmation}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-auto pt-16 text-center text-xs text-stone-400">
          {mode === 'ai' && aiAvailable ? (
            <p>
              Affirmations are written live 🌅
            </p>
          ) : (
            <p>Everything you write stays on this device. Only for you. 🌅</p>
          )}
          {passcodeRequired && (
            <button
              onClick={async () => {
                await logout()
                reset()
                setAuthState('locked')
              }}
              className="mt-3 text-stone-400 underline-offset-2 transition hover:text-stone-600 hover:underline"
            >
              Lock
            </button>
          )}
        </footer>
      </main>
    </div>
  )
}

function Backdrop({ children }) {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-orange-100 text-stone-700">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200/70 via-orange-200/50 to-rose-200/40 blur-3xl" />
        <div className="animate-glow absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-200/50 to-amber-100/30 blur-3xl [animation-delay:2s]" />
      </div>
      <div className="relative w-full px-6 py-16">{children}</div>
    </div>
  )
}

function PasscodeGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!code.trim() || busy) return
    setBusy(true)
    setError(false)
    const ok = await login(code)
    setBusy(false)
    if (ok) onUnlock()
    else {
      setError(true)
      setCode('')
    }
  }

  return (
    <Backdrop>
      <div className="animate-rise mx-auto max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center">
          <SunMark />
        </div>
        <h1 className="font-serif text-4xl font-500 tracking-tight text-stone-800">
          Guidance
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-balance text-stone-500">
          Enter your passcode to come in.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 rounded-3xl bg-white/70 p-2 shadow-xl shadow-orange-900/5 ring-1 ring-white/60 backdrop-blur"
        >
          <input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setError(false)
            }}
            autoFocus
            autoComplete="current-password"
            placeholder="Passcode"
            className="w-full rounded-2xl bg-transparent px-4 py-3 text-center text-lg tracking-wide text-stone-700 placeholder:text-stone-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!code.trim() || busy}
            className="mt-1 w-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Opening…' : 'Enter'}
          </button>
        </form>

        {error && (
          <p className="animate-rise mt-4 text-sm text-rose-500">
            That passcode isn’t right. Try again
          </p>
        )}
      </div>
    </Backdrop>
  )
}

function ModeToggle({ mode, setMode, aiAvailable }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-1.5">
      <div className="inline-flex rounded-full bg-white/60 p-1 text-sm shadow-sm ring-1 ring-white/60 backdrop-blur">
        <button
          onClick={() => setMode('ai')}
          className={`rounded-full px-4 py-1.5 font-600 transition ${
            mode === 'ai'
              ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          ✨ Custom affirmations
        </button>
        <button
          onClick={() => setMode('local')}
          className={`rounded-full px-4 py-1.5 font-600 transition ${
            mode === 'local'
              ? 'bg-stone-800 text-amber-50 shadow'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          🌿 Offline
        </button>
      </div>
      {mode === 'ai' && aiAvailable === false && (
        <p className="text-xs text-amber-700/70">
          No API key found — add one to enable AI. Using the local engine.
        </p>
      )}
    </div>
  )
}

function SourceBadge({ source }) {
  if (source === 'ai') {
    return (
<></>
    )
  }
  return (
    <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-600 text-stone-500 ring-1 ring-stone-200/60">
      🌿 Local engine
    </span>
  )
}

function SunMark() {
  return (
    <svg viewBox="0 0 32 32" className="animate-breathe h-full w-full drop-shadow">
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f43f5e" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="8.5" fill="url(#sun)" />
      <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.85">
        <line x1="16" y1="2.5" x2="16" y2="5.5" />
        <line x1="16" y1="26.5" x2="16" y2="29.5" />
        <line x1="2.5" y1="16" x2="5.5" y2="16" />
        <line x1="26.5" y1="16" x2="29.5" y2="16" />
        <line x1="6.5" y1="6.5" x2="8.6" y2="8.6" />
        <line x1="23.4" y1="23.4" x2="25.5" y2="25.5" />
        <line x1="25.5" y1="6.5" x2="23.4" y2="8.6" />
        <line x1="8.6" y1="23.4" x2="6.5" y2="25.5" />
      </g>
    </svg>
  )
}

function BreatheHint() {
  return (
    <p className="mt-6 text-center text-sm text-stone-400">
      Read it slowly. Take one full breath before you move on.
    </p>
  )
}
