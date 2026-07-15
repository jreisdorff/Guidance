import { useI18n } from '../i18n.jsx'

// A tiny switch showing the other language as its call to action
// (English ⇄ Español). Used on both the sign-in screen and the app.
export function LanguageToggle({ className = '' }) {
  const { lang, setLang, t } = useI18n()
  return (
    <button
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      aria-label={t('changeLanguage')}
      className={`text-sm font-600 text-stone-400 underline-offset-2 transition hover:text-stone-600 hover:underline ${className}`}
    >
      {lang === 'es' ? 'English' : 'Español'}
    </button>
  )
}
