import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces'
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans'
import Background from './src/components/Background'
import AnimatedSplash from './src/components/AnimatedSplash'
import { AuthProvider, useAuth } from './src/auth/AuthContext'
import { SubscriptionProvider } from './src/subscription'
import { I18nProvider } from './src/i18n'
import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import { colors } from './src/theme'

function Loader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.rose500} size="large" />
    </View>
  )
}

function Root() {
  const { loading, user, signInAsGuest, signOut } = useAuth()
  const [wantsSignIn, setWantsSignIn] = useState(false)
  const triedGuest = useRef(false)

  // Fresh visitors skip the login screen and go straight to the prompt: sign
  // them in as a guest. Only show the login screen when it's explicitly asked
  // for, or as a fallback if anonymous sign-in isn't available.
  useEffect(() => {
    if (loading || user || wantsSignIn || triedGuest.current) return
    triedGuest.current = true
    signInAsGuest().catch(() => setWantsSignIn(true))
  }, [loading, user, wantsSignIn, signInAsGuest])

  // Take the user to the login screen: remember the intent so auto-guest doesn't
  // pull them back in, then sign the current (guest) user out.
  async function requestSignIn() {
    triedGuest.current = true
    setWantsSignIn(true)
    await signOut().catch(() => {})
  }

  if (loading) return <Loader />
  if (user) return <HomeScreen onRequestSignIn={requestSignIn} />
  return wantsSignIn ? <LoginScreen /> : <Loader />
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  })
  const [splashDone, setSplashDone] = useState(false)

  return (
    <Background>
      <StatusBar style="dark" />
      {fontsLoaded && (
        <I18nProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <Root />
            </SubscriptionProvider>
          </AuthProvider>
        </I18nProvider>
      )}
      {!splashDone && (
        <AnimatedSplash ready={fontsLoaded} onDone={() => setSplashDone(true)} />
      )}
    </Background>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
