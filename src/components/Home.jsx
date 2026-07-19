import { useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { generateAffirmation } from '../affirmations.js'
import { checkAiAvailable, generateAffirmationAI } from '../ai.js'
import { auth } from '../firebase.js'
import { addEntry, removeEntry, subscribeEntries } from '../journal.js'
import { deleteAccount } from '../account.js'
import { useI18n } from '../i18n.jsx'
import { AffirmationResult } from './AffirmationResult.jsx'
import { Composer } from './Composer.jsx'
import { Journal } from './Journal.jsx'
import { LanguageToggle } from './LanguageToggle.jsx'
import { ModeToggle } from './ModeToggle.jsx'
import { SunMark } from './icons.jsx'

// Mode preference stays in localStorage — it's just a device-level UI choice.
const MODE_KEY = 'divinity.mode.v1'

// The signed-in experience: compose an affirmation, keep a journal. `user` is
// guaranteed present here — App handles the auth gate.
export function Home({ user, onRequestSignIn }) {
  const { t, lang } = useI18n()
  const [entry, setEntry] = useState('')
  const [result, setResult] = useState(null)
  const [journal, setJournal] = useState([])
  // Keep an index (not the text) so switching language re-localizes the prompt.
  const [promptIndex] = useState(() =>
    Math.floor((Date.now() / 1000) % t('prompts').length),
  )
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'ai')
  const [aiAvailable, setAiAvailable] = useState(null) // null = unknown yet
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const resultRef = useRef(null)

  // Guest trial: anonymous users may ask a fixed number of questions before
  // signing in. A "question" is one moment (groupId); re-phrasings reuse it.
  const GUEST_LIMIT = 3
  const isGuest = user?.isAnonymous ?? false
  const questionsAsked = new Set(journal.map((r) => r.groupId ?? r.id)).size
  const guestRemaining = Math.max(0, GUEST_LIMIT - questionsAsked)
  const guestLocked = isGuest && guestRemaining <= 0

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
    // Guests always use the AI path (the mode toggle is hidden for them).
    if (isGuest || mode === 'ai') {
      try {
        const ai = await generateAffirmationAI(text, avoid, lang)
        setAiAvailable(true)
        return ai
      } catch (err) {
        if (err.status === 401) {
          await signOut(auth) // session expired — the gate will take over
          return null
        }
        if (err.status === 503) {
          setAiAvailable(false)
          setNotice(t('noticeNoKey'))
        } else if (err.reason === 'refusal') {
          setNotice(t('noticeRefusal'))
        } else {
          setNotice(t('noticeUnreachable'))
        }
        return { ...generateAffirmation(text, avoid), source: 'local' }
      }
    }
    return { ...generateAffirmation(text, avoid), source: 'local' }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    const text = entry.trim()
    if (!text || loading || guestLocked) return

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
        t('exportTitle'),
        t('exportExported', { date: new Date().toLocaleString(lang) }),
        journal.length === 1
          ? t('exportEntry', { n: journal.length })
          : t('exportEntries', { n: journal.length }),
      ]
      journal.forEach((r) => {
        lines.push(
          '',
          '─'.repeat(32),
          new Date(r.ts).toLocaleString(lang) + (r.themeLabel ? ` · ${r.themeLabel}` : ''),
          '',
          t('exportYouWrote'),
          `  ${r.entry}`,
        )
        if (r.reflect) lines.push('', t('exportReflection'), `  ${r.reflect}`)
        lines.push('', t('exportAffirmation'), `  ${r.affirmation}`)
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
      setNotice(t('noticeDeleteFailed'))
      setDeleting(false)
    }
  }

  // Both a guest's "Sign in" and a signed-in user's "Sign out" lead to the
  // login page (App signs the current user out and remembers the intent, so
  // auto-guest doesn't just pull them back in).
  async function handleSignOut() {
    reset()
    await onRequestSignIn()
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-orange-100 text-stone-700">
      {/* Sunrise glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200/70 via-orange-200/50 to-rose-200/40 blur-3xl" />
        <div className="animate-glow absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-200/50 to-amber-100/30 blur-3xl [animation-delay:2s]" />
      </div>

      <main className="relative mx-auto flex min-h-full max-w-2xl flex-col px-6 pb-16 pt-12 sm:pt-20">
        {/* Language — top left */}
        <LanguageToggle className="absolute left-6 top-6 z-10 sm:top-8" />
        {/* Sign out — top right */}
        <button
          onClick={handleSignOut}
          className="absolute right-6 top-6 z-10 text-sm font-600 text-stone-400 underline-offset-2 transition hover:text-stone-600 hover:underline sm:top-8"
        >
          {isGuest ? t('signIn') : t('signOut')}
        </button>

        {/* Header */}
        <header className="animate-rise text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center">
            <SunMark />
          </div>
          <h1 className="font-serif text-4xl font-500 tracking-tight text-stone-800 sm:text-5xl">
            Guidance
          </h1>

          {!isGuest && (
            <ModeToggle mode={mode} setMode={setMode} aiAvailable={aiAvailable} />
          )}
        </header>

        {/* Guest trial banner — kept visible so the 3-question limit is clear */}
        {isGuest && !guestLocked && (
          <div className="mt-6 flex items-center justify-center gap-2 text-center">
            <span className="rounded-full bg-white/60 px-4 py-1.5 text-sm font-600 text-amber-700 ring-1 ring-white/60">
              {guestRemaining === 1
                ? t('guestBannerLast')
                : t('guestBanner', { n: guestRemaining })}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm font-700 text-stone-700 underline underline-offset-2 transition hover:text-stone-900"
            >
              {t('signIn')}
            </button>
          </div>
        )}

        {guestLocked ? (
          /* Trial used up — must sign in to keep asking */
          <div className="animate-rise mt-8 rounded-3xl bg-white/80 p-8 text-center shadow-xl shadow-orange-900/5 ring-1 ring-white/60 backdrop-blur">
            <h2 className="font-serif text-2xl text-stone-800">{t('guestLimitTitle')}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
              {t('guestLimitMsg')}
            </p>
            <button
              onClick={handleSignOut}
              className="mt-6 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98]"
            >
              {t('guestSignIn')}
            </button>
          </div>
        ) : (
          <Composer
            prompt={t('prompts')[promptIndex]}
            entry={entry}
            setEntry={setEntry}
            onSubmit={handleSubmit}
            loading={loading}
            notice={notice}
          />
        )}

        {/* Loading placeholder */}
        {loading && !result && (
          <div className="animate-rise mt-10 rounded-3xl bg-white/60 p-10 text-center shadow-xl shadow-orange-900/5 ring-1 ring-white/60 backdrop-blur">
            <div className="mx-auto h-10 w-10">
              <SunMark />
            </div>
            <p className="mt-4 font-serif text-lg italic text-stone-500">
              {t('composingForYou')}
            </p>
          </div>
        )}

        {result && (
          <AffirmationResult
            key={result.affirmation}
            result={result}
            loading={loading}
            onAnother={isGuest ? null : handleAnother}
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
          {(isGuest || mode === 'ai') && aiAvailable ? (
            <p>{t('writtenLive')}</p>
          ) : (
            <p>{t('staysOnDevice')}</p>
          )}
          <button
            onClick={handleSignOut}
            className="mt-3 text-stone-400 underline-offset-2 transition hover:text-stone-600 hover:underline"
          >
            {isGuest ? t('signIn') : t('signOut')}
          </button>
          <p className="mt-4 text-stone-400">
            <a href="/privacy" className="underline-offset-2 transition hover:text-stone-600 hover:underline">{t('privacyShort')}</a>
            <span className="px-1.5">·</span>
            <a href="/terms" className="underline-offset-2 transition hover:text-stone-600 hover:underline">{t('terms')}</a>
            {!isGuest && (
              <>
                <span className="px-1.5">·</span>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="underline-offset-2 transition hover:text-rose-500 hover:underline disabled:opacity-50"
                >
                  {deleting ? t('deleting') : t('deleteAccount')}
                </button>
              </>
            )}
          </p>
        </footer>
      </main>
    </div>
  )
}
