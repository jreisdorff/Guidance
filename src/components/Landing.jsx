import { useI18n } from '../i18n.jsx'
import { LanguageToggle } from './LanguageToggle.jsx'
import { SunMark } from './icons.jsx'

// The public marketing page. It's a separate page from the app itself (which
// lives at "/"), so the nav "Log in" and the hero CTA are plain links back to
// the app root, where the sign-in / guest flow takes over.
export function Landing() {
  const { t } = useI18n()

  const steps = [
    { n: '1', title: t('landingStep1Title'), body: t('landingStep1Body') },
    { n: '2', title: t('landingStep2Title'), body: t('landingStep2Body') },
    { n: '3', title: t('landingStep3Title'), body: t('landingStep3Body') },
  ]

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-orange-100 text-stone-700">
      {/* Sunrise glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200/70 via-orange-200/50 to-rose-200/40 blur-3xl" />
        <div className="animate-glow absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-200/50 to-amber-100/30 blur-3xl [animation-delay:2s]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <a href="/landing" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center">
              <SunMark />
            </span>
            <span className="font-serif text-xl font-500 tracking-tight text-stone-800">
              Guidance
            </span>
          </a>
          <div className="flex items-center gap-5">
            <LanguageToggle />
            <a
              href="/?signin"
              className="rounded-full bg-white/70 px-5 py-2 text-sm font-600 text-stone-700 shadow ring-1 ring-white/60 backdrop-blur transition hover:bg-white active:scale-[0.98]"
            >
              {t('logIn')}
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6">
        <section className="animate-rise mx-auto max-w-2xl pt-14 text-center sm:pt-24">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <SunMark />
          </div>
          <p className="text-sm font-600 uppercase tracking-widest text-amber-600/80">
            {t('landingEyebrow')}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-500 leading-tight tracking-tight text-stone-800 sm:text-6xl">
            {t('landingTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-stone-500">
            {t('landingSubtitle')}
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <a
              href="/"
              className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-8 py-3.5 font-600 text-white shadow-lg shadow-rose-500/20 transition hover:brightness-105 active:scale-[0.98]"
            >
              {t('landingCta')}
            </a>
            <p className="text-sm text-stone-400">{t('landingCtaNote')}</p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto mt-24 max-w-4xl">
          <h2 className="text-center font-serif text-2xl font-500 text-stone-800">
            {t('landingHow')}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-3xl bg-white/60 p-6 text-center shadow-xl shadow-orange-900/5 ring-1 ring-white/60 backdrop-blur"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 font-700 text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 font-serif text-lg text-stone-800">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-stone-400">
            {t('landingPrivacyNote')}
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-24 pb-16 text-center text-xs text-stone-400">
          <div className="flex items-center justify-center gap-3">
            <a
              href="/privacy"
              className="underline-offset-2 transition hover:text-stone-600 hover:underline"
            >
              {t('privacyShort')}
            </a>
            <span>·</span>
            <a
              href="/terms"
              className="underline-offset-2 transition hover:text-stone-600 hover:underline"
            >
              {t('terms')}
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
