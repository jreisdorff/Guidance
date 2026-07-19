// Pure helpers for shaping journal entries for display, ported from the web
// app's src/journal-utils.js.

import { dateLabel } from './format'
import type { Lang } from './i18n'
import type { JournalItem } from './journal'

export type DateGroup = { label: string; items: JournalItem[] }
export type RephraseGroup = { gid: string; entry: string; items: JournalItem[] }

// Groups entries (already sorted newest-first) into consecutive day buckets.
export function groupByDate(entries: JournalItem[], locale: Lang = 'en'): DateGroup[] {
  const groups: DateGroup[] = []
  for (const e of entries) {
    const label = dateLabel(e.ts, locale)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(e)
    else groups.push({ label, items: [e] })
  }
  return groups
}

// The feelings a person has been sitting with recently, most frequent first.
// Counts each moment once (dedupes re-phrasings by groupId) over the last 30
// days, so a heavily re-phrased entry doesn't dominate.
export function recentThemes(entries: JournalItem[], limit = 3): string[] {
  const cutoff = Date.now() - 30 * 86400000
  const seen = new Set<string | number>()
  const counts = new Map<string, number>()
  for (const e of entries) {
    if (e.ts < cutoff) continue
    const gid = e.groupId ?? e.id
    if (seen.has(gid)) continue
    seen.add(gid)
    if (!e.themeLabel) continue
    counts.set(e.themeLabel, (counts.get(e.themeLabel) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([theme]) => theme)
}

// Within a day's entries (already newest-first), collapse consecutive
// re-phrasings of one moment — entries that share a groupId — into a single
// card. Legacy entries without a groupId each stand on their own.
export function groupRephrasings(items: JournalItem[]): RephraseGroup[] {
  const groups: RephraseGroup[] = []
  for (const item of items) {
    const gid = String(item.groupId ?? item.id)
    const last = groups[groups.length - 1]
    if (last && last.gid === gid) last.items.push(item)
    else groups.push({ gid, entry: item.entry, items: [item] })
  }
  return groups
}
