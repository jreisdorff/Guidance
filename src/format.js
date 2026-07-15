// Date/time formatting helpers for the journal.

// Just the time within a day's group, e.g. "3:45 PM".
export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// A friendly header for a day: "Today", "Yesterday", else "Monday, July 13".
export function dateLabel(ts) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const day = startOfDay(new Date(ts))
  const today = startOfDay(new Date())
  const diffDays = Math.round((today - day) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
