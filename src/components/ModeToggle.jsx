import { useI18n } from '../i18n.jsx'

// Switches between AI-written ("Custom") and on-device ("Offline") affirmations.
export function ModeToggle({ mode, setMode, aiAvailable }) {
  const { t } = useI18n()
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
          {t('modeCustom')}
        </button>
        <button
          onClick={() => setMode('local')}
          className={`rounded-full px-4 py-1.5 font-600 transition ${
            mode === 'local'
              ? 'bg-stone-800 text-amber-50 shadow'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {t('modeOffline')}
        </button>
      </div>
      {mode === 'ai' && aiAvailable === false && (
        <p className="text-xs text-amber-700/70">{t('aiUnavailableNote')}</p>
      )}
    </div>
  )
}
