import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import GradientButton from './GradientButton'
import { useI18n } from '../i18n'
import { useSubscription } from '../subscription'
import { colors, fonts } from '../theme'

// Shown in place of the composer once a non-subscriber has used their free
// question. Sells the 7-day free trial; the store handles the trial and the
// $0.99/month billing after it, and the backend records the entitlement.
export default function Paywall() {
  const { t } = useI18n()
  const { subscribed, priceString, purchase, restore } = useSubscription()
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const price = priceString ?? t('paywallPriceFallback')

  if (subscribed) return null

  async function onBuy() {
    setBusy('buy')
    setError(null)
    try {
      await purchase()
    } catch {
      setError(t('paywallError'))
    } finally {
      setBusy(null)
    }
  }

  async function onRestore() {
    setBusy('restore')
    setError(null)
    try {
      await restore()
    } catch {
      setError(t('paywallError'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('paywallTitle')}</Text>
      <Text style={styles.body}>{t('paywallBody')}</Text>

      <View style={styles.cta}>
        <GradientButton
          label={busy === 'buy' ? t('subscribing') : t('paywallCta')}
          onPress={onBuy}
          loading={busy === 'buy'}
          disabled={busy !== null}
        />
      </View>
      <Text style={styles.priceNote}>{t('paywallPriceNote', { price })}</Text>

      <Pressable onPress={onRestore} hitSlop={8} disabled={busy !== null}>
        <Text style={styles.restore}>
          {busy === 'restore' ? t('restoring') : t('paywallRestore')}
        </Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.terms}>{t('paywallTerms', { price })}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardStrong,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.ring,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#7c2d12',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.stone800,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.stone500,
    textAlign: 'center',
  },
  cta: { alignSelf: 'stretch', alignItems: 'center', marginTop: 6 },
  priceNote: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    color: colors.stone600,
    textAlign: 'center',
  },
  restore: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    color: colors.stone500,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.rose500,
    textAlign: 'center',
  },
  terms: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    color: colors.stone400,
    textAlign: 'center',
    marginTop: 4,
  },
})
