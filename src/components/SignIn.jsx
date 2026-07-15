import { useEffect, useRef, useState } from 'react'
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '../firebase.js'
import { useI18n } from '../i18n.jsx'
import { COUNTRIES, formatPhone } from '../phone.js'
import { Backdrop } from './Backdrop.jsx'
import { CountryDropdown } from './CountryDropdown.jsx'
import { LanguageToggle } from './LanguageToggle.jsx'
import { GoogleG, SunMark } from './icons.jsx'

export function SignIn() {
  const { t } = useI18n()
  const [step, setStep] = useState('choose') // choose | phone | code
  const [countryIso, setCountryIso] = useState('US')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0) // seconds until "Resend" re-enables
  const recaptchaRef = useRef(null)

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function withGoogle() {
    setBusy(true)
    setError('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch {
      setError(t('errGoogle'))
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

  // The invisible reCAPTCHA token is single-use, so a resend needs a fresh
  // verifier — otherwise Firebase rejects the second attempt.
  function resetVerifier() {
    try {
      window._guidanceRecaptcha?.clear()
    } catch {
      // clear() throws if the widget is already gone; ignore.
    }
    window._guidanceRecaptcha = null
  }

  const country = COUNTRIES.find((c) => c.iso === countryIso) ?? COUNTRIES[0]

  async function requestCode() {
    if (!phoneDigits || busy) return
    setBusy(true)
    setError('')
    try {
      // Country code is prepended automatically → full E.164, e.g. +15550001234.
      const e164 = `+${country.dial}${phoneDigits}`
      const conf = await signInWithPhoneNumber(auth, e164, getVerifier())
      setConfirmation(conf)
      setStep('code')
      setCode('')
      setCooldown(30)
    } catch (err) {
      console.error('phone sign-in:', err)
      resetVerifier() // so the next attempt gets a fresh challenge
      setError(t('errSendCode', { reason: err?.code || err?.message || 'unknown' }))
    } finally {
      setBusy(false)
    }
  }

  function sendCode(e) {
    e.preventDefault()
    requestCode()
  }

  async function resend() {
    if (cooldown > 0 || busy) return
    resetVerifier()
    await requestCode()
  }

  function changeNumber() {
    setStep('phone')
    setCode('')
    setConfirmation(null)
    setError('')
  }

  async function confirmCode(e) {
    e?.preventDefault()
    if (!code.trim() || busy || !confirmation) return
    setBusy(true)
    setError('')
    try {
      await confirmation.confirm(code.trim())
    } catch {
      setError(t('errCode'))
      setBusy(false)
    }
  }

  // Auto-submit once a full 6-digit code is present (covers browser SMS autofill).
  useEffect(() => {
    if (step === 'code' && code.length === 6 && !busy && confirmation) {
      confirmCode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

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
          {t('signInSubtitle')}
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
                {t('continuePhone')}
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
                  placeholder={country.dial === '1' ? '(555) 000-0000' : t('phonePlaceholder')}
                  className="w-full min-w-0 flex-1 rounded-2xl bg-white/70 pr-4 pl-2 py-3 text-left text-lg tracking-wide text-stone-700 placeholder:text-stone-400 ring-1 ring-white/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!phoneDigits || busy}
                className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
              >
                {busy ? t('sending') : t('sendCode')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('choose')
                  setError('')
                }}
                className="text-sm text-stone-400 transition hover:text-stone-600"
              >
                {t('back')}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={confirmCode} className="flex flex-col gap-3">
              <p className="text-sm text-stone-500">
                {t('codeSentTo').split('{number}')[0]}
                <span className="font-600 text-stone-700">
                  +{country.dial} {formatPhone(phoneDigits, country.dial)}
                </span>
                {t('codeSentTo').split('{number}')[1]}
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
                placeholder="123456"
                className="w-full rounded-2xl bg-white/70 px-4 py-3 text-center text-2xl tracking-[0.4em] text-stone-700 placeholder:text-stone-300 ring-1 ring-white/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!code.trim() || busy}
                className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
              >
                {busy ? t('verifying') : t('verify')}
              </button>
              <div className="flex items-center justify-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={changeNumber}
                  disabled={busy}
                  className="text-stone-400 transition hover:text-stone-600 disabled:opacity-50"
                >
                  {t('changeNumber')}
                </button>
                <span className="text-stone-300">·</span>
                <button
                  type="button"
                  onClick={resend}
                  disabled={cooldown > 0 || busy}
                  className="text-stone-400 transition hover:text-stone-600 disabled:opacity-50 disabled:hover:text-stone-400"
                >
                  {cooldown > 0 ? t('resendIn', { n: cooldown }) : t('resendCode')}
                </button>
              </div>
            </form>
          )}
        </div>

        {error && <p className="animate-rise mt-4 text-sm text-rose-500">{error}</p>}
        <p className="mx-auto mt-6 max-w-xs text-balance text-xs leading-relaxed text-stone-400">
          {t('crisisNote')}
        </p>
        <p className="mx-auto mt-3 max-w-xs text-balance text-xs leading-relaxed text-stone-400">
          {t('agreeBefore')}
          <a href="/terms" className="underline hover:text-stone-500">{t('terms')}</a>
          {t('agreeAnd')}
          <a href="/privacy" className="underline hover:text-stone-500">{t('privacyPolicy')}</a>.
        </p>
        <div className="mt-6">
          <LanguageToggle />
        </div>
        <div ref={recaptchaRef} />
      </div>
    </Backdrop>
  )
}
