// The warm sunrise background used by the loading gate and the sign-in screen.
export function Backdrop({ children }) {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-orange-100 text-stone-700">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200/70 via-orange-200/50 to-rose-200/40 blur-3xl" />
        <div className="animate-glow absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-200/50 to-amber-100/30 blur-3xl [animation-delay:2s]" />
      </div>
      <div className="relative w-full px-6 py-16">{children}</div>
    </div>
  )
}
