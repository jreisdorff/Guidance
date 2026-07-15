// Date/time formatting helpers for the journal. `locale` is the active language
// code ('en' | 'es'), used both as the Intl locale and to look up day labels.

import { translate } from './i18n.jsx'

// Just the time within a day's group, e.g. "3:45 PM".
export function formatTime(ts, locale = 'en') {
  return new Date(ts).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// A friendly header for a day: "Today", "Yesterday", else a localized full date.
export function dateLabel(ts, locale = 'en') {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const day = startOfDay(new Date(ts))
  const today = startOfDay(new Date())
  const diffDays = Math.round((today - day) / 86400000)
  if (diffDays === 0) return translate(locale, 'today')
  if (diffDays === 1) return translate(locale, 'yesterday')
  return new Date(ts).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
