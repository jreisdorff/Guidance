// Brand + provider SVG marks.

export function SunMark() {
  return (
    <svg viewBox="0 0 32 32" className="animate-breathe h-full w-full drop-shadow">
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f43f5e" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="8.5" fill="url(#sun)" />
      <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.85">
        <line x1="16" y1="2.5" x2="16" y2="5.5" />
        <line x1="16" y1="26.5" x2="16" y2="29.5" />
        <line x1="2.5" y1="16" x2="5.5" y2="16" />
        <line x1="26.5" y1="16" x2="29.5" y2="16" />
        <line x1="6.5" y1="6.5" x2="8.6" y2="8.6" />
        <line x1="23.4" y1="23.4" x2="25.5" y2="25.5" />
        <line x1="25.5" y1="6.5" x2="23.4" y2="8.6" />
        <line x1="8.6" y1="23.4" x2="6.5" y2="25.5" />
      </g>
    </svg>
  )
}

export function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}
