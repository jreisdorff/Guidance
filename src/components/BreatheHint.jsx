import { useI18n } from '../i18n.jsx'

export function BreatheHint() {
  const { t } = useI18n()
  return <p className="mt-6 text-center text-sm text-stone-400">{t('breathe')}</p>
}
