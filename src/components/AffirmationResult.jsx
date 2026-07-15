import { useI18n } from '../i18n.jsx'
import { BreatheHint } from './BreatheHint.jsx'
import { SourceBadge } from './SourceBadge.jsx'

// The composed affirmation card, with actions to re-phrase or start over.
// `sectionRef` is forwarded so the parent can scroll it into view; the parent
// also keys this on the affirmation text so a new one replays the entrance.
export function AffirmationResult({ result, loading, onAnother, onReset, sectionRef }) {
  const { t } = useI18n()
  return (
    <section
      ref={sectionRef}
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
            onClick={onAnother}
            disabled={loading}
            className="rounded-full bg-stone-800/90 px-5 py-2 text-sm font-600 text-amber-50 transition hover:bg-stone-800 active:scale-[0.98] disabled:opacity-50"
          >
            {t('sayAnother')}
          </button>
          <button
            onClick={onReset}
            className="rounded-full px-5 py-2 text-sm font-600 text-stone-500 transition hover:bg-white/60 hover:text-stone-700"
          >
            {t('startFresh')}
          </button>
        </div>
      </div>

      <BreatheHint />
    </section>
  )
}
