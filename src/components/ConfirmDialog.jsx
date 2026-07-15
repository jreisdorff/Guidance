import { useEffect } from 'react'

// A small styled confirmation modal for destructive actions, in the app's own
// voice rather than the browser's default confirm(). Closes on Escape or a
// click on the backdrop.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-rise relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl ring-1 ring-stone-200"
      >
        <h2 className="font-serif text-xl text-stone-800">{title}</h2>
        {message && (
          <p className="mt-2 text-sm leading-relaxed text-stone-500">{message}</p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full px-4 py-2.5 text-sm font-600 text-stone-500 ring-1 ring-stone-200 transition hover:bg-stone-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-600 text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600 active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
