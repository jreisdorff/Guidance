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
import { AuthProvider, useAuth } from './src/auth/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import { colors } from './src/theme'

function Root() {
  const { loading, token } = useAuth()

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.rose500} size="large" />
      </View>
    )
  }

  return token ? <HomeScreen /> : <LoginScreen />
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

  return (
    <Background>
      <StatusBar style="dark" />
      {fontsLoaded ? (
        <AuthProvider>
          <Root />
        </AuthProvider>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={colors.rose500} size="large" />
        </View>
      )}
    </Background>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
