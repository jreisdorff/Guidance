// The React Native Firebase auth instance. The native app auto-initializes from
// GoogleService-Info.plist (iOS) / google-services.json (Android), configured in
// app.json. We use the modular API throughout.
import { getApp } from '@react-native-firebase/app'
import { getAuth } from '@react-native-firebase/auth'

export const firebaseAuth = getAuth(getApp())
