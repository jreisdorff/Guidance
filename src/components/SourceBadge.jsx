import { useI18n } from '../i18n.jsx'

// Marks where an affirmation came from. AI affirmations are unbadged; the local
// engine gets a subtle tag so it's clear the AI wasn't reached.
export function SourceBadge({ source }) {
  const { t } = useI18n()
  if (source === 'ai') {
    return <></>
  }
  return (
    <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-600 text-stone-500 ring-1 ring-stone-200/60">
      {t('localEngine')}
    </span>
  )
}
