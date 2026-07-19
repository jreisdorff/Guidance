// Lightweight i18n for the Guidance mobile app, ported from the web app's
// src/i18n.jsx. Two languages (English + Spanish), so a plain dictionary +
// context is cleaner than a full i18n framework. t(key, vars) returns the
// string for the current language (falling back to English), interpolating
// {placeholders}. Arrays (e.g. prompts) are returned as-is. `lang` ('en' | 'es')
// is also the BCP-47 tag we pass to Intl and to the backend.
//
// The choice is detected from the device locale on first launch, then persisted
// in the secure store so it survives restarts (mirrors the web's localStorage).

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { NativeModules, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const LANG_KEY = 'guidance.lang.v1'
export const LANGUAGES = ['en', 'es'] as const
export type Lang = (typeof LANGUAGES)[number]

type Dict = Record<string, string | string[]>

const dict: Record<Lang, Dict> = {
  en: {
    signOut: 'Sign out',
    changeLanguage: 'Change language',
    countryCode: 'Country code',

    // Sign-in
    signInSubtitle: 'A quiet space to set down what you’re feeling. Sign in to come in.',
    continuePhone: 'Continue with phone',
    continueGoogle: 'Continue with Google',
    sendCode: 'Send code',
    sending: 'Sending…',
    back: 'Back',
    codeSentTo: 'Enter the code we texted to {number}.',
    verify: 'Verify',
    verifying: 'Verifying…',
    changeNumber: 'Change number',
    resendIn: 'Resend in {n}s',
    resendCode: 'Resend code',
    phonePlaceholder: 'Phone number',
    errGoogle: 'Could not sign in with Google. Please try again.',
    errSendCode: 'Could not send a code. Please check the number and try again.',
    errCode: 'That code isn’t right. Try again.',
    crisisNote:
      'A space for self-reflection, not a substitute for professional care. In crisis? Call or text 988 (US).',
    agreeBefore: 'By continuing you agree to our ',
    agreeAnd: ' and ',
    terms: 'Terms',
    privacyShort: 'Privacy',
    privacyPolicy: 'Privacy Policy',

    // Composer + prompts
    entryPlaceholder: 'Type honestly…',
    receiveBtn: 'Receive an affirmation',
    composing: 'Composing…',
    composingForYou: 'Composing something just for you…',
    prompts: [
      'What is weighing on you right now?',
      'What are you feeling about yourself today?',
      'What thought has been circling in your mind?',
      'What is the critical voice saying to you?',
      'What do you wish you could believe about yourself?',
    ],

    // Guest trial (ask a few questions before signing in)
    signIn: 'Sign in',
    guestTry: 'Ask 3 questions first — no account needed',
    guestTrySub: 'Try Guidance free. You can ask 3 questions before signing in.',
    guestBanner: 'Guest · {n} of 3 free questions left',
    guestBannerLast: 'Guest · 1 free question left, then sign in',
    guestLimitTitle: 'You’ve used your 3 free questions',
    guestLimitMsg: 'Sign in or create a free account to keep asking — it only takes a moment.',
    guestSignIn: 'Sign in to continue',

    // Result
    sayAnother: 'Say it another way',
    startFresh: 'Start fresh',
    copy: 'Copy',
    copied: 'Copied',
    breathe: 'Read it slowly. Take one full breath before you move on.',

    // Footer
    writtenLive: 'Written for you 🌅',
    deleteAccount: 'Delete account',
    deleting: 'Deleting…',

    // Journal
    yourJournal: 'Your journal',
    exportLabel: 'Export',
    exportTxt: 'Text (.txt)',
    exportJson: 'JSON (.json)',
    clearAll: 'Clear all',
    latelyFeeling: 'Lately, you’ve been feeling',
    clearFilters: 'Clear filters',
    searchPlaceholder: 'Search your journal…',
    noMatches: 'No entries match your filters.',
    emptyJournal:
      'Nothing here yet. What you share will be saved to your account, for you to return to.',
    waysCount: '{n} ways',
    remove: 'Remove',

    // Confirmations
    cancel: 'Cancel',
    clearTitle: 'Clear your journal?',
    clearMsg:
      'Are you sure you want to remove your journal entries? This can’t be undone. If you’d like to keep them, cancel and Export first.',
    removeTitle: 'Remove this entry?',
    removeMsg: 'Are you sure you want to remove this entry? This can’t be undone.',
    removeMsgMulti:
      'Are you sure you want to remove this entry and its {n} affirmations? This can’t be undone.',
    deleteAccountTitle: 'Delete your account?',
    deleteAccountMsg:
      'This permanently deletes your account and every journal entry. It can’t be undone. If you’d like to keep them, cancel and Export first.',

    // Notices (mobile has no offline engine, so the copy stays gentle without
    // promising a local fallback)
    noticeNoKey:
      'Affirmations aren’t available right now. Please try again in a little while.',
    noticeRefusal:
      'Let’s hold this one gently. Try saying it a different way, or take a breath and come back.',
    noticeUnreachable: 'Couldn’t reach Guidance just now. Please try again.',
    noticeDeleteFailed: 'Couldn’t delete your account just now. Please try again.',

    // Export file
    exportTitle: 'Guidance — journal export',
    exportExported: 'Exported {date}',
    exportEntries: '{n} entries',
    exportEntry: '{n} entry',
    exportYouWrote: 'You wrote:',
    exportReflection: 'Reflection:',
    exportAffirmation: 'Affirmation:',

    // Dates
    today: 'Today',
    yesterday: 'Yesterday',
  },

  es: {
    signOut: 'Cerrar sesión',
    changeLanguage: 'Cambiar idioma',
    countryCode: 'Código de país',

    // Sign-in
    signInSubtitle:
      'Un espacio tranquilo para dejar lo que sientes. Inicia sesión para entrar.',
    continuePhone: 'Continuar con el teléfono',
    continueGoogle: 'Continuar con Google',
    sendCode: 'Enviar código',
    sending: 'Enviando…',
    back: 'Atrás',
    codeSentTo: 'Ingresa el código que enviamos a {number}.',
    verify: 'Verificar',
    verifying: 'Verificando…',
    changeNumber: 'Cambiar número',
    resendIn: 'Reenviar en {n}s',
    resendCode: 'Reenviar código',
    phonePlaceholder: 'Número de teléfono',
    errGoogle: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
    errSendCode:
      'No se pudo enviar el código. Revisa el número e inténtalo de nuevo.',
    errCode: 'Ese código no es correcto. Inténtalo de nuevo.',
    crisisNote:
      'Un espacio para la autorreflexión, no un sustituto de la atención profesional. ¿En crisis? Llama o envía un mensaje al 988 (EE. UU.).',
    agreeBefore: 'Al continuar, aceptas nuestros ',
    agreeAnd: ' y la ',
    terms: 'Términos',
    privacyShort: 'Privacidad',
    privacyPolicy: 'Política de Privacidad',

    // Composer + prompts
    entryPlaceholder: 'Escribe con sinceridad…',
    receiveBtn: 'Recibe una afirmación',
    composing: 'Creando…',
    composingForYou: 'Creando algo solo para ti…',
    prompts: [
      '¿Qué te pesa en este momento?',
      '¿Qué sientes hacia ti mismo hoy?',
      '¿Qué pensamiento ha estado dando vueltas en tu mente?',
      '¿Qué te dice la voz crítica?',
      '¿Qué te gustaría poder creer sobre ti mismo?',
    ],

    // Guest trial (ask a few questions before signing in)
    signIn: 'Iniciar sesión',
    guestTry: 'Haz 3 preguntas primero — sin cuenta',
    guestTrySub: 'Prueba Guidance gratis. Puedes hacer 3 preguntas antes de iniciar sesión.',
    guestBanner: 'Invitado · te quedan {n} de 3 preguntas gratis',
    guestBannerLast: 'Invitado · queda 1 pregunta gratis, luego inicia sesión',
    guestLimitTitle: 'Ya usaste tus 3 preguntas gratis',
    guestLimitMsg: 'Inicia sesión o crea una cuenta gratis para seguir preguntando — solo toma un momento.',
    guestSignIn: 'Inicia sesión para continuar',

    // Result
    sayAnother: 'Dilo de otra manera',
    startFresh: 'Empezar de nuevo',
    copy: 'Copiar',
    copied: 'Copiado',
    breathe: 'Léelo despacio. Respira hondo una vez antes de continuar.',

    // Footer
    writtenLive: 'Escrito para ti 🌅',
    deleteAccount: 'Eliminar cuenta',
    deleting: 'Eliminando…',

    // Journal
    yourJournal: 'Tu diario',
    exportLabel: 'Exportar',
    exportTxt: 'Texto (.txt)',
    exportJson: 'JSON (.json)',
    clearAll: 'Borrar todo',
    latelyFeeling: 'Últimamente te has sentido',
    clearFilters: 'Quitar filtros',
    searchPlaceholder: 'Busca en tu diario…',
    noMatches: 'Ninguna entrada coincide con tus filtros.',
    emptyJournal:
      'Todavía no hay nada aquí. Lo que compartas se guardará en tu cuenta, para que puedas volver a leerlo.',
    waysCount: '{n} versiones',
    remove: 'Quitar',

    // Confirmations
    cancel: 'Cancelar',
    clearTitle: '¿Borrar tu diario?',
    clearMsg:
      '¿Seguro que quieres eliminar las entradas de tu diario? Esto no se puede deshacer. Si quieres conservarlas, cancela y primero expórtalas.',
    removeTitle: '¿Quitar esta entrada?',
    removeMsg: '¿Seguro que quieres quitar esta entrada? Esto no se puede deshacer.',
    removeMsgMulti:
      '¿Seguro que quieres quitar esta entrada y sus {n} afirmaciones? Esto no se puede deshacer.',
    deleteAccountTitle: '¿Eliminar tu cuenta?',
    deleteAccountMsg:
      'Esto elimina permanentemente tu cuenta y todas las entradas de tu diario. No se puede deshacer. Si quieres conservarlas, cancela y primero expórtalas.',

    // Notices
    noticeNoKey:
      'Las afirmaciones no están disponibles en este momento. Inténtalo de nuevo en un rato.',
    noticeRefusal:
      'Sostengamos esto con cuidado. Intenta decirlo de otra manera, o respira hondo y vuelve.',
    noticeUnreachable: 'No se pudo contactar con Guidance en este momento. Inténtalo de nuevo.',
    noticeDeleteFailed: 'No se pudo eliminar tu cuenta en este momento. Inténtalo de nuevo.',

    // Export file
    exportTitle: 'Guidance — exportación del diario',
    exportExported: 'Exportado {date}',
    exportEntries: '{n} entradas',
    exportEntry: '{n} entrada',
    exportYouWrote: 'Escribiste:',
    exportReflection: 'Reflexión:',
    exportAffirmation: 'Afirmación:',

    // Dates
    today: 'Hoy',
    yesterday: 'Ayer',
  },
}

// Best-effort read of the device language, without pulling in a native
// localization module. Falls back to English on anything unexpected.
function deviceLang(): Lang {
  try {
    const raw =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier
    return String(raw ?? 'en').toLowerCase().startsWith('es') ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

function interpolate(str: string, vars?: Record<string, unknown>) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`))
}

// String lookup, usable outside React (e.g. date labels, building an export).
export function translate(lang: Lang, key: string, vars?: Record<string, unknown>): string {
  const table = dict[lang] || dict.en
  let val = table[key]
  if (val == null) val = dict.en[key]
  if (val == null) return key
  return typeof val === 'string' ? interpolate(val, vars) : String(val)
}

type I18nValue = {
  lang: Lang
  setLang: (next: Lang) => void
  t: (key: string, vars?: Record<string, unknown>) => string
  // Array-valued lookups (prompts). Falls back to English.
  list: (key: string) => string[]
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang)

  // Reconcile with a previously saved choice once, on mount.
  useEffect(() => {
    SecureStore.getItemAsync(LANG_KEY)
      .then((saved) => {
        if (saved === 'en' || saved === 'es') setLangState(saved)
      })
      .catch(() => {})
  }, [])

  function setLang(next: Lang) {
    setLangState(next)
    SecureStore.setItemAsync(LANG_KEY, next).catch(() => {})
  }

  const value: I18nValue = {
    lang,
    setLang,
    t: (key, vars) => translate(lang, key, vars),
    list: (key) => {
      const val = (dict[lang] || dict.en)[key] ?? dict.en[key]
      return Array.isArray(val) ? val : []
    },
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
