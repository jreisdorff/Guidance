import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n.jsx'

// A small "Export ▾" menu letting the user download their journal as either a
// human-readable .txt or a machine-readable .json. Mirrors CountryDropdown's
// open-state + outside-click pattern.
export function ExportMenu({ onExport }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function choose(format) {
    onExport(format)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-stone-400 transition hover:text-stone-600"
      >
        {t('exportLabel')}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 rounded-2xl bg-white p-1 text-left shadow-xl ring-1 ring-stone-200">
          <button
            onClick={() => choose('txt')}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100"
          >
            {t('exportTxt')}
          </button>
          <button
            onClick={() => choose('json')}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100"
          >
            {t('exportJson')}
          </button>
        </div>
      )}
    </div>
  )
}
