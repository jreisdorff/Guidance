// The entry form: a prompt, the textarea, and the submit button. Owns no state
// itself — the parent holds `entry` so it can generate an affirmation from it.
export function Composer({ prompt, entry, setEntry, onSubmit, loading, notice }) {
  return (
    <form onSubmit={onSubmit} className="animate-rise mt-8 [animation-delay:120ms]">
      <label
        htmlFor="entry"
        className="mb-3 block text-center font-serif text-lg italic text-stone-500"
      >
        {prompt}
      </label>
      <div className="rounded-3xl bg-white/70 p-2 shadow-xl shadow-orange-900/5 ring-1 ring-white/60 backdrop-blur">
        <textarea
          id="entry"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSubmit(e)
          }}
          rows={4}
          placeholder="Type honestly…"
          className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-lg leading-relaxed text-stone-700 placeholder:text-stone-400 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-2">
          <span className="text-xs text-stone-400">⌘ + Enter</span>
          <button
            type="submit"
            disabled={!entry.trim() || loading}
            className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-2.5 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Composing…' : 'Receive an affirmation'}
          </button>
        </div>
      </div>
      {notice && (
        <p className="animate-rise mt-3 text-center text-sm text-amber-700/80">
          {notice}
        </p>
      )}
    </form>
  )
}
