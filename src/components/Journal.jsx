import { useState } from 'react'
import { formatTime } from '../format.js'
import { groupByDate, groupRephrasings, recentThemes } from '../journal-utils.js'
import { ConfirmDialog } from './ConfirmDialog.jsx'
import { ExportMenu } from './ExportMenu.jsx'

// The collapsible journal: recent-theme chips, search, and the day-grouped list
// of entries (with re-phrasings of one moment collapsed into a single card).
// Owns its own display state (open/closed, search query); the parent owns the
// data and the delete/clear/export actions.
export function Journal({ journal, onDelete, onClear, onExport }) {
  const [showJournal, setShowJournal] = useState(false)
  const [journalQuery, setJournalQuery] = useState('')
  // Pending destructive action awaiting confirmation:
  //   null | { type: 'clear' } | { type: 'entry', id }
  const [confirm, setConfirm] = useState(null)

  function runConfirm() {
    if (!confirm) return
    if (confirm.type === 'clear') onClear()
    else if (confirm.type === 'entry') onDelete(confirm.id)
    setConfirm(null)
  }

  const journalQ = journalQuery.trim().toLowerCase()
  const filteredJournal = journalQ
    ? journal.filter(
        (r) =>
          (r.entry || '').toLowerCase().includes(journalQ) ||
          (r.affirmation || '').toLowerCase().includes(journalQ),
      )
    : journal
  const themes = recentThemes(journal)

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowJournal((s) => !s)}
          className="flex items-center gap-2 text-sm font-600 text-stone-500 transition hover:text-stone-700"
        >
          <span className={`transition-transform ${showJournal ? 'rotate-90' : ''}`}>
            ›
          </span>
          Your journal
          {journal.length > 0 && (
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-stone-400">
              {journal.length}
            </span>
          )}
        </button>
        {showJournal && journal.length > 0 && (
          <div className="flex items-center gap-4">
            <ExportMenu onExport={onExport} />
            <button
              onClick={() => setConfirm({ type: 'clear' })}
              className="text-xs text-stone-400 transition hover:text-rose-500"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {showJournal && (
        <div className="animate-rise mt-4 space-y-6">
          {journal.length === 0 && (
            <p className="rounded-2xl bg-white/50 px-5 py-6 text-center text-sm text-stone-400">
              Nothing here yet. What you share will be saved to your account,
              for you to return to.
            </p>
          )}
          {themes.length > 0 && !journalQ && (
            <div className="rounded-2xl bg-white/40 px-5 py-4">
              <p className="text-xs uppercase tracking-widest text-stone-400">
                Lately, you’ve been feeling
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {themes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/70 px-3 py-1 text-sm text-stone-600 ring-1 ring-white/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {journal.length > 5 && (
            <input
              type="search"
              value={journalQuery}
              onChange={(e) => setJournalQuery(e.target.value)}
              placeholder="Search your journal…"
              className="w-full rounded-2xl bg-white/60 px-4 py-2.5 text-sm text-stone-700 ring-1 ring-white/60 placeholder:text-stone-400 focus:outline-none"
            />
          )}
          {journalQ && filteredJournal.length === 0 && (
            <p className="rounded-2xl bg-white/50 px-5 py-6 text-center text-sm text-stone-400">
              No entries match “{journalQuery.trim()}”.
            </p>
          )}
          {groupByDate(filteredJournal).map((group) => (
            <div key={group.label} className="space-y-3">
              <h3 className="px-1 text-xs font-600 uppercase tracking-widest text-stone-400">
                {group.label}
              </h3>
              {groupRephrasings(group.items).map((g) => (
                <article
                  key={g.gid}
                  className="group rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-3">
                    <time className="text-xs uppercase tracking-wider text-stone-400">
                      {formatTime(g.items[0].ts)}
                    </time>
                    {g.items.length > 1 && (
                      <span className="text-xs text-stone-300">
                        {g.items.length} ways
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm italic text-stone-500">“{g.entry}”</p>
                  <div className="mt-3 space-y-3">
                    {g.items.map((r, i) => (
                      <div
                        key={r.id}
                        className={`flex items-start justify-between gap-3 ${
                          i > 0 ? 'border-t border-stone-200/60 pt-3' : ''
                        }`}
                      >
                        <p className="font-serif text-lg leading-relaxed text-stone-700">
                          {r.affirmation}
                        </p>
                        <button
                          onClick={() => setConfirm({ type: 'entry', id: r.id })}
                          className="shrink-0 text-xs text-stone-400 transition hover:text-rose-500"
                          aria-label="Remove this entry"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'clear' ? 'Clear your journal?' : 'Remove this entry?'}
        message={
          confirm?.type === 'clear'
            ? 'Are you sure you want to remove your journal entries? This can’t be undone. If you’d like to keep them, cancel and Export first.'
            : 'Are you sure you want to remove this entry? This can’t be undone.'
        }
        confirmLabel={confirm?.type === 'clear' ? 'Clear all' : 'Remove'}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </section>
  )
}
