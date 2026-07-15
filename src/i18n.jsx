import { createContext, useContext, useEffect, useState } from 'react'

// Lightweight i18n for Guidance. Two languages (English + Spanish), so a plain
// dictionary + context is cleaner than pulling in a full i18n framework.
// t(key, vars) returns the string for the current language (falling back to
// English), interpolating {placeholders}. Arrays (e.g. prompts) are returned
// as-is. `lang` ('en' | 'es') is also the BCP-47 tag we pass to Intl.

const LANG_KEY = 'guidance.lang.v1'
export const LANGUAGES = ['en', 'es']

const dict = {
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
    errSendCode: 'Could not send a code ({reason}).',
    errCode: 'That code isn’t right. Try again.',
    crisisNote:
      'A space for self-reflection, not a substitute for professional care. In crisis? Call or text 988 (US).',
    agreeBefore: 'By continuing you agree to our ',
    agreeAnd: ' and ',
    terms: 'Terms',
    privacyShort: 'Privacy',
    privacyPolicy: 'Privacy Policy',

    // Mode toggle
    modeCustom: '✨ Custom affirmations',
    modeOffline: '🌿 Offline',
    aiUnavailableNote: 'No API key found — add one to enable AI. Using the local engine.',

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

    // Result
    sayAnother: 'Say it another way',
    startFresh: 'Start fresh',
    localEngine: '🌿 Local engine',
    breathe: 'Read it slowly. Take one full breath before you move on.',

    // Footer
    writtenLive: 'Affirmations are written live 🌅',
    staysOnDevice: 'Everything you write stays on this device. Only for you. 🌅',
    deleteAccount: 'Delete account',
    deleting: 'Deleting…',

    // Journal
    yourJournal: 'Your journal',
    exportLabel: 'Export ▾',
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

    // Notices
    noticeNoKey:
      'No API key found — add one to enable AI affirmations. Here’s one from the local engine for now.',
    noticeRefusal: 'Let’s hold this one gently — here’s a grounding affirmation instead.',
    noticeUnreachable: 'Couldn’t reach the AI just now — here’s one from the local engine.',
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
    errSendCode: 'No se pudo enviar el código ({reason}).',
    errCode: 'Ese código no es correcto. Inténtalo de nuevo.',
    crisisNote:
      'Un espacio para la autorreflexión, no un sustituto de la atención profesional. ¿En crisis? Llama o envía un mensaje al 988 (EE. UU.).',
    agreeBefore: 'Al continuar, aceptas nuestros ',
    agreeAnd: ' y la ',
    terms: 'Términos',
    privacyShort: 'Privacidad',
    privacyPolicy: 'Política de Privacidad',

    // Mode toggle
    modeCustom: '✨ Afirmaciones personalizadas',
    modeOffline: '🌿 Sin conexión',
    aiUnavailableNote:
      'No se encontró una clave de API: agrega una para activar la IA. Usando el motor local.',

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

    // Result
    sayAnother: 'Dilo de otra manera',
    startFresh: 'Empezar de nuevo',
    localEngine: '🌿 Motor local',
    breathe: 'Léelo despacio. Respira hondo una vez antes de continuar.',

    // Footer
    writtenLive: 'Las afirmaciones se escriben en vivo 🌅',
    staysOnDevice: 'Todo lo que escribes permanece en este dispositivo. Solo para ti. 🌅',
    deleteAccount: 'Eliminar cuenta',
    deleting: 'Eliminando…',

    // Journal
    yourJournal: 'Tu diario',
    exportLabel: 'Exportar ▾',
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

    // Notices
    noticeNoKey:
      'No se encontró una clave de API: agrega una para activar las afirmaciones con IA. Por ahora, aquí tienes una del motor local.',
    noticeRefusal: 'Sostengamos esto con cuidado: aquí tienes una afirmación para reconectar contigo.',
    noticeUnreachable: 'No se pudo contactar con la IA en este momento: aquí tienes una del motor local.',
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

function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (LANGUAGES.includes(saved)) return saved
  } catch {
    // localStorage may be unavailable; fall through to navigator.
  }
  const nav = (navigator.language || 'en').toLowerCase()
  return nav.startsWith('es') ? 'es' : 'en'
}

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`))
}

// Pure lookup, usable outside React (e.g. building an export file).
export function translate(lang, key, vars) {
  const table = dict[lang] || dict.en
  let val = table[key]
  if (val == null) val = dict.en[key]
  if (val == null) return key
  return typeof val === 'string' ? interpolate(val, vars) : val
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // ignore write failures (private mode, etc.)
    }
  }, [lang])

  const value = {
    lang,
    setLang,
    t: (key, vars) => translate(lang, key, vars),
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
