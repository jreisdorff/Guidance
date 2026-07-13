import { useEffect, useRef, useState } from 'react'
import { generateAffirmation } from './affirmations.js'
import { checkAiAvailable, generateAffirmationAI } from './ai.js'
import { auth } from './firebase.js'
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { addEntry, subscribeEntries, removeEntry } from './journal.js'

// The journal now lives per-user in Firestore (src/journal.js). Mode preference
// stays in localStorage — it's just a device-level UI choice.
const MODE_KEY = 'divinity.mode.v1'

const PROMPTS = [
  'What is weighing on you right now?',
  'What are you feeling about yourself today?',
  'What thought has been circling in your mind?',
  'What is the critical voice saying to you?',
  'What do you wish you could believe about yourself?',
]

// Just the time within a day's group, e.g. "3:45 PM".
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// A friendly header for a day: "Today", "Yesterday", else "Monday, July 13".
function dateLabel(ts) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const day = startOfDay(new Date(ts))
  const today = startOfDay(new Date())
  const diffDays = Math.round((today - day) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// Groups entries (already sorted newest-first) into consecutive day buckets.
function groupByDate(entries) {
  const groups = []
  for (const e of entries) {
    const label = dateLabel(e.ts)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(e)
    else groups.push({ label, items: [e] })
  }
  return groups
}

export default function App() {
  const [entry, setEntry] = useState('')
  const [result, setResult] = useState(null)
  const [journal, setJournal] = useState([])
  const [showJournal, setShowJournal] = useState(false)
  const [prompt] = useState(() => PROMPTS[Math.floor((Date.now() / 1000) % PROMPTS.length)])
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'ai')
  const [aiAvailable, setAiAvailable] = useState(null) // null = unknown yet
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [user, setUser] = useState(undefined) // undefined = checking, null = signed out
  const resultRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    checkAiAvailable().then(setAiAvailable)
    return unsub
  }, [])

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  // Live-subscribe to this user's journal in Firestore.
  useEffect(() => {
    if (!user) {
      setJournal([])
      return
    }
    return subscribeEntries(user.uid, setJournal)
  }, [user])

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
    const record = { ts: Date.now(), entry: text, ...generated }
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
    setResult((prev) => ({ ...prev, ...generated }))
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

  function clearJournal() {
    if (!user) return
    if (window.confirm('Clear your whole journal? This cannot be undone.')) {
      journal.forEach((r) => removeEntry(user.uid, r.id).catch(() => {}))
    }
  }

  if (user === undefined) {
    return <Backdrop />
  }
  if (user === null) {
    return <SignIn />
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
          onClick={async () => {
            await signOut(auth)
            reset()
          }}
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
            <div className="animate-rise mt-4 space-y-6">
              {journal.length === 0 && (
                <p className="rounded-2xl bg-white/50 px-5 py-6 text-center text-sm text-stone-400">
                  Nothing here yet. What you share will be saved to your account,
                  for you to return to.
                </p>
              )}
              {groupByDate(journal).map((group) => (
                <div key={group.label} className="space-y-3">
                  <h3 className="px-1 text-xs font-600 uppercase tracking-widest text-stone-400">
                    {group.label}
                  </h3>
                  {group.items.map((r) => (
                    <article
                      key={r.id}
                      className="group rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <time className="text-xs uppercase tracking-wider text-stone-400">
                          {formatTime(r.ts)}
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
              ))}
            </div>
          )}
        </section>

        <footer className="mt-auto pt-16 text-center text-xs text-stone-400">
          {mode === 'ai' && aiAvailable ? (
            <p>Affirmations are written live 🌅</p>
          ) : (
            <p>Everything you write stays on this device. Only for you. 🌅</p>
          )}
          <button
            onClick={async () => {
              await signOut(auth)
              reset()
            }}
            className="mt-3 text-stone-400 underline-offset-2 transition hover:text-stone-600 hover:underline"
          >
            Sign out
          </button>
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

// Country dial codes for the phone sign-in dropdown. `dial` has no leading "+";
// `max` caps the national number length (used for masking and validation).
const COUNTRIES = [
  { iso: 'US', name: 'United States', dial: '1', flag: '🇺🇸', max: 10 },
  { iso: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦', max: 10 },
  { iso: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧', max: 10 },
  { iso: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺', max: 9 },
  { iso: 'IN', name: 'India', dial: '91', flag: '🇮🇳', max: 10 },
  { iso: 'IE', name: 'Ireland', dial: '353', flag: '🇮🇪', max: 9 },
  { iso: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪', max: 11 },
  { iso: 'FR', name: 'France', dial: '33', flag: '🇫🇷', max: 9 },
  { iso: 'ES', name: 'Spain', dial: '34', flag: '🇪🇸', max: 9 },
  { iso: 'IT', name: 'Italy', dial: '39', flag: '🇮🇹', max: 10 },
  { iso: 'NL', name: 'Netherlands', dial: '31', flag: '🇳🇱', max: 9 },
  { iso: 'MX', name: 'Mexico', dial: '52', flag: '🇲🇽', max: 10 },
  { iso: 'BR', name: 'Brazil', dial: '55', flag: '🇧🇷', max: 11 },
  { iso: 'JP', name: 'Japan', dial: '81', flag: '🇯🇵', max: 10 },
  { iso: 'KR', name: 'South Korea', dial: '82', flag: '🇰🇷', max: 10 },
  { iso: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿', max: 9 },
  { iso: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬', max: 8 },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪', max: 9 },
]

// Progressive display mask. NANP (+1) numbers get "(XXX) XXX-XXXX"; everything
// else is grouped into threes. Input is digits only.
function formatPhone(digits, dial) {
  const d = digits.replace(/\D/g, '')
  if (dial === '1') {
    if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`
    if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    if (d.length > 0) return `(${d}`
    return ''
  }
  return d.replace(/(.{3})(?=.)/g, '$1 ').trim()
}

// Custom country picker: collapsed shows flag + code + ISO abbreviation
// (e.g. "🇺🇸 +1 US"); expanded lists flag + code + full country name. A native
// <select> can't differ between the two, hence the custom control.
function CountryDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = COUNTRIES.find((c) => c.iso === value) ?? COUNTRIES[0]

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Country code"
        className="flex items-center gap-1.5 rounded-2xl bg-white/70 px-3 py-3 text-sm text-stone-700 ring-1 ring-white/60 focus:outline-none"
      >
        <span>{selected.flag}</span>
        <span>+{selected.dial}</span>
        <span className="text-stone-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 max-h-64 w-64 overflow-auto rounded-2xl bg-white p-1 text-left shadow-xl ring-1 ring-stone-200">
          {COUNTRIES.map((c) => (
            <button
              key={c.iso}
              type="button"
              onClick={() => {
                onChange(c.iso)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-stone-100 ${
                c.iso === value ? 'bg-stone-50 font-600' : ''
              }`}
            >
              <span>{c.flag}</span>
              <span className="w-10 shrink-0 text-stone-500">+{c.dial}</span>
              <span className="text-stone-700">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SignIn() {
  const [step, setStep] = useState('choose') // choose | phone | code
  const [countryIso, setCountryIso] = useState('US')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const recaptchaRef = useRef(null)

  async function withGoogle() {
    setBusy(true)
    setError('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch {
      setError('Could not sign in with Google. Please try again.')
      setBusy(false)
    }
  }

  function getVerifier() {
    if (!window._guidanceRecaptcha) {
      window._guidanceRecaptcha = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'invisible',
      })
    }
    return window._guidanceRecaptcha
  }

  const country = COUNTRIES.find((c) => c.iso === countryIso) ?? COUNTRIES[0]

  async function sendCode(e) {
    e.preventDefault()
    if (!phoneDigits || busy) return
    setBusy(true)
    setError('')
    try {
      // Country code is prepended automatically → full E.164, e.g. +15550001234.
      const e164 = `+${country.dial}${phoneDigits}`
      const conf = await signInWithPhoneNumber(auth, e164, getVerifier())
      setConfirmation(conf)
      setStep('code')
    } catch (err) {
      console.error('phone sign-in:', err)
      setError(`Could not send a code (${err?.code || err?.message || 'unknown'}).`)
    } finally {
      setBusy(false)
    }
  }

  async function confirmCode(e) {
    e.preventDefault()
    if (!code.trim() || busy || !confirmation) return
    setBusy(true)
    setError('')
    try {
      await confirmation.confirm(code.trim())
    } catch {
      setError('That code isn’t right. Try again.')
      setBusy(false)
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
          A quiet space to set down what you’re feeling. Sign in to come in.
        </p>

        <div className="mt-8 rounded-3xl bg-white/70 p-6 shadow-xl shadow-orange-900/5 ring-1 ring-white/60 backdrop-blur">
          {step === 'choose' && (
            <div className="flex flex-col gap-3">
              {/* TODO: re-enable later
              <button
                onClick={withGoogle}
                disabled={busy}
                className="flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 font-600 text-stone-700 shadow ring-1 ring-stone-200 transition hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
              >
                <GoogleG />
                Continue with Google
              </button>
              */}
              <button
                onClick={() => {
                  setStep('phone')
                  setError('')
                }}
                disabled={busy}
                className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
              >
                Continue with phone
              </button>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={sendCode} className="flex flex-col gap-3">
              <div className="flex gap-1.5">
                <CountryDropdown
                  value={countryIso}
                  onChange={(iso) => {
                    setCountryIso(iso)
                    setError('')
                  }}
                />
                <input
                  type="tel"
                  value={formatPhone(phoneDigits, country.dial)}
                  onChange={(e) =>
                    setPhoneDigits(
                      e.target.value.replace(/\D/g, '').slice(0, country.max ?? 15),
                    )
                  }
                  autoFocus
                  placeholder={country.dial === '1' ? '(555) 000-0000' : 'Phone number'}
                  className="w-full min-w-0 flex-1 rounded-2xl bg-white/70 pr-4 pl-2 py-3 text-left text-lg tracking-wide text-stone-700 placeholder:text-stone-400 ring-1 ring-white/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!phoneDigits || busy}
                className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
              >
                {busy ? 'Sending…' : 'Send code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('choose')
                  setError('')
                }}
                className="text-sm text-stone-400 transition hover:text-stone-600"
              >
                Back
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={confirmCode} className="flex flex-col gap-3">
              <p className="text-sm text-stone-500">Enter the code we texted you.</p>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                placeholder="123456"
                className="w-full rounded-2xl bg-white/70 px-4 py-3 text-center text-2xl tracking-[0.4em] text-stone-700 placeholder:text-stone-300 ring-1 ring-white/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!code.trim() || busy}
                className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
              >
                {busy ? 'Verifying…' : 'Verify'}
              </button>
            </form>
          )}
        </div>

        {error && <p className="animate-rise mt-4 text-sm text-rose-500">{error}</p>}
        <div ref={recaptchaRef} />
      </div>
    </Backdrop>
  )
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
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
    return <></>
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
