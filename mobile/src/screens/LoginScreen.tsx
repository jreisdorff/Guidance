import { useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import { GoogleSigninButton } from '@react-native-google-signin/google-signin'
import SunMark from '../components/SunMark'
import { useAuth } from '../auth/AuthContext'
import { colors, fonts } from '../theme'

export default function LoginScreen() {
  const { signIn, signingIn } = useAuth()
  const [busy, setBusy] = useState(false)

  async function onPress() {
    setBusy(true)
    try {
      await signIn()
    } catch (err: any) {
      Alert.alert(
        'Sign-in failed',
        err?.message ?? 'Something went wrong signing in. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  const loading = busy || signingIn

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <SunMark size={56} />
        <Text style={styles.title}>Guidance</Text>
        <Text style={styles.subtitle}>
          A quiet space to set down what you're feeling — and be reminded of the
          worth that was always yours.
        </Text>
      </View>

      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator color={colors.rose500} />
        ) : (
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Light}
            onPress={onPress}
            disabled={loading}
          />
        )}
        <Text style={styles.legal}>Sign in with Google to come in.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 56,
  },
  hero: { alignItems: 'center', gap: 16 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 46,
    color: colors.stone800,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 26,
    color: colors.stone500,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: { alignItems: 'center', gap: 14 },
  legal: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 14 },
})
