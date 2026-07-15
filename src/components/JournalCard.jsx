import { useState } from 'react'
import { formatTime } from '../format.js'

// One journal moment as an accordion: the collapsed preview shows what was
// written (with time + a "N ways" badge for re-phrased moments); expanding
// reveals the affirmation response(s). Remove stays at the top-right.
export function JournalCard({ group: g, onRequestRemove }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="rounded-2xl bg-white/60 ring-1 ring-white/60 backdrop-blur">
      <div className="flex items-start gap-3 p-5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span
            className={`mt-0.5 shrink-0 text-stone-300 transition-transform ${
              open ? 'rotate-90' : ''
            }`}
          >
            ›
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <time className="text-xs uppercase tracking-wider text-stone-400">
                {formatTime(g.items[0].ts)}
              </time>
              {g.items.length > 1 && (
                <span className="text-xs text-stone-300">{g.items.length} ways</span>
              )}
            </div>
            <p className="mt-2 text-sm italic text-stone-500">“{g.entry}”</p>
          </div>
        </button>
        <button
          onClick={() => onRequestRemove(g.items.map((it) => it.id))}
          className="shrink-0 text-xs text-stone-400 transition hover:text-rose-500"
          aria-label="Remove this entry"
        >
          Remove
        </button>
      </div>
      {open && (
        <div className="space-y-3 pb-5 pl-10 pr-5">
          {g.items.map((r, i) => (
            <div
              key={r.id}
              className={i > 0 ? 'border-t border-stone-200/60 pt-3' : ''}
            >
              <p className="font-serif text-lg leading-relaxed text-stone-700">
                {r.affirmation}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
