import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import SunMark from '../components/SunMark'
import GradientButton from '../components/GradientButton'
import CountryPicker from '../components/CountryPicker'
import LanguageToggle from '../components/LanguageToggle'
import { COUNTRIES, formatPhone } from '../countries'
import { useAuth, type Confirmation } from '../auth/AuthContext'
import { useI18n } from '../i18n'
import { PRIVACY_URL, TERMS_URL } from '../config'
import { colors, fonts } from '../theme'

type Step = 'choose' | 'phone' | 'code'

export default function LoginScreen() {
  const { signInWithGoogle, signInWithPhone, signingIn } = useAuth()
  const { t } = useI18n()
  const [step, setStep] = useState<Step>('choose')
  const [countryIso, setCountryIso] = useState('US')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [code, setCode] = useState('')
  const country = COUNTRIES.find((c) => c.iso === countryIso) ?? COUNTRIES[0]
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0) // seconds until "Resend" re-enables

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function onGoogle() {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch {
      setError(t('errGoogle'))
    } finally {
      setBusy(false)
    }
  }

  async function requestCode() {
    if (!phoneDigits || busy) return
    setBusy(true)
    setError(null)
    try {
      // Country code is prepended automatically → full E.164, e.g. +15550001234.
      const conf = await signInWithPhone(`+${country.dial}${phoneDigits}`)
      setConfirmation(conf)
      setStep('code')
      setCode('')
      setCooldown(30)
    } catch {
      setError(t('errSendCode'))
    } finally {
      setBusy(false)
    }
  }

  function onSendCode() {
    requestCode()
  }

  async function onResend() {
    if (cooldown > 0 || busy) return
    await requestCode()
  }

  function changeNumber() {
    setStep('phone')
    setCode('')
    setConfirmation(null)
    setError(null)
  }

  async function onConfirm() {
    if (!code.trim() || busy || !confirmation) return
    setBusy(true)
    setError(null)
    try {
      await confirmation.confirm(code.trim())
      // onAuthStateChanged takes over from here.
    } catch {
      setError(t('errCode'))
      setBusy(false)
    }
  }

  const loading = busy || signingIn

  // Auto-submit once a full 6-digit code is present (covers SMS autofill).
  useEffect(() => {
    if (step === 'code' && code.length === 6 && !loading && confirmation) {
      onConfirm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return (
    <View style={styles.container}>
      <LanguageToggle style={styles.langTop} />

      <View style={styles.hero}>
        <SunMark size={56} />
        <Text style={styles.title}>Guidance</Text>
        <Text style={styles.subtitle}>{t('signInSubtitle')}</Text>
      </View>

      <View style={styles.card}>
        {step === 'choose' && (
          <View style={styles.stack}>
            {/* TODO: re-enable later
            <Pressable
              style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}
              onPress={onGoogle}
              disabled={loading}
            >
              <GoogleG />
              <Text style={styles.googleText}>{t('continueGoogle')}</Text>
            </Pressable>
            */}
            <GradientButton
              label={t('continuePhone')}
              onPress={() => {
                setStep('phone')
                setError(null)
              }}
              disabled={loading}
            />
          </View>
        )}

        {step === 'phone' && (
          <View style={styles.stack}>
            <View style={styles.phoneRow}>
              <CountryPicker
                value={countryIso}
                onChange={(iso) => {
                  setCountryIso(iso)
                  setError(null)
                }}
                disabled={loading}
              />
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={formatPhone(phoneDigits, country.dial)}
                onChangeText={(t) =>
                  setPhoneDigits(t.replace(/\D/g, '').slice(0, country.max))
                }
                placeholder={country.dial === '1' ? '(555) 000-0000' : t('phonePlaceholder')}
                placeholderTextColor={colors.stone400}
                keyboardType="phone-pad"
                autoFocus
                editable={!loading}
              />
            </View>
            <GradientButton
              label={t('sendCode')}
              onPress={onSendCode}
              disabled={!phoneDigits}
              loading={loading}
            />
            <Pressable onPress={() => setStep('choose')} hitSlop={8}>
              <Text style={styles.link}>{t('back')}</Text>
            </Pressable>
          </View>
        )}

        {step === 'code' && (
          <View style={styles.stack}>
            <Text style={styles.hint}>
              {t('codeSentTo', {
                number: `+${country.dial} ${formatPhone(phoneDigits, country.dial)}`,
              })}
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              placeholderTextColor={colors.stone300}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6}
              autoFocus
              editable={!loading}
            />
            <GradientButton
              label={t('verify')}
              onPress={onConfirm}
              disabled={!code.trim()}
              loading={loading}
            />
            <View style={styles.codeActions}>
              <Pressable onPress={changeNumber} hitSlop={8} disabled={loading}>
                <Text style={styles.link}>{t('changeNumber')}</Text>
              </Pressable>
              <Pressable onPress={onResend} hitSlop={8} disabled={cooldown > 0 || loading}>
                <Text style={[styles.link, (cooldown > 0 || loading) && styles.linkDisabled]}>
                  {cooldown > 0 ? t('resendIn', { n: cooldown }) : t('resendCode')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {loading && step === 'choose' && (
        <ActivityIndicator color={colors.rose500} style={styles.spinner} />
      )}

      <View style={styles.legal}>
        <Text style={styles.crisis}>{t('crisisNote')}</Text>
        <Text style={styles.agree}>
          {t('agreeBefore')}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            {t('terms')}
          </Text>
          {t('agreeAnd')}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            {t('privacyPolicy')}
          </Text>
          .
        </Text>
      </View>
    </View>
  )
}

function GoogleG() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 40,
  },
  langTop: { position: 'absolute', top: 64, right: 24, zIndex: 10 },
  hero: { alignItems: 'center', gap: 14 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 46,
    color: colors.stone800,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.stone500,
    textAlign: 'center',
    maxWidth: 300,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.ring,
    padding: 20,
  },
  stack: { gap: 12 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.stone200,
  },
  googleText: { fontFamily: fonts.sansSemibold, color: colors.stone700, fontSize: 16 },
  pressed: { opacity: 0.9 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ring,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: fonts.sans,
    fontSize: 18,
    color: colors.stone700,
    textAlign: 'center',
  },
  phoneRow: { flexDirection: 'row', gap: 6 },
  phoneInput: { flex: 1, textAlign: 'left' },
  codeInput: { fontSize: 26, letterSpacing: 8 },
  hint: { fontFamily: fonts.sans, color: colors.stone500, fontSize: 15, textAlign: 'center' },
  link: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 14, textAlign: 'center' },
  linkDisabled: { opacity: 0.5 },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 2,
  },
  error: {
    fontFamily: fonts.sans,
    color: colors.rose500,
    fontSize: 14,
    textAlign: 'center',
  },
  spinner: { marginTop: -20 },
  legal: { gap: 12, alignItems: 'center', paddingHorizontal: 8 },
  crisis: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  agree: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  legalLink: { color: colors.stone500, textDecorationLine: 'underline' },
})
