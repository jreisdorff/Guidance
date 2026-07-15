import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { COUNTRIES } from '../phone.js'

// Custom country picker: collapsed shows flag + code + ISO abbreviation
// (e.g. "🇺🇸 +1 US"); expanded lists flag + code + full country name. A native
// <select> can't differ between the two, hence the custom control.
export function CountryDropdown({ value, onChange }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = COUNTRIES.find((c) => c.iso === value) ?? COUNTRIES[0]

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('countryCode')}
        className="flex items-center gap-1.5 rounded-2xl bg-white/70 px-3 py-3 text-sm text-stone-700 ring-1 ring-white/60 focus:outline-none"
      >
        <span>{selected.flag}</span>
        <span>+{selected.dial}</span>
        <span className="text-stone-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 max-h-64 w-64 overflow-auto rounded-2xl bg-white p-1 text-left shadow-xl ring-1 ring-stone-200">
          {COUNTRIES.map((c) => (
            <button
              key={c.iso}
              type="button"
              onClick={() => {
                onChange(c.iso)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-stone-100 ${
                c.iso === value ? 'bg-stone-50 font-600' : ''
              }`}
            >
              <span>{c.flag}</span>
              <span className="w-10 shrink-0 text-stone-500">+{c.dial}</span>
              <span className="text-stone-700">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
