# Guidance (mobile)

The **Guidance** mobile app — an Expo (React Native) client for the same backend
that powers the Guidance web app. People sign in with Google and get a piece of
guidance written by Claude for whatever they're feeling.

It shares the backend in this repo (`../server/index.js` locally, `../api/*.js`
on Vercel). Mobile authenticates with a session **JWT** the backend issues after
verifying a Google sign-in — the web app's passcode/cookie gate is untouched.

> **Google sign-in uses a native module, so it does NOT run in Expo Go.** You
> need a development build (below). Everything else is standard Expo.

## Stack

- Expo SDK 57 (React Native 0.86, React 19), TypeScript
- `@react-native-google-signin/google-signin` — native Google account picker
- `expo-secure-store` — session token kept in the device keychain
- EAS Build for dev/preview/production builds

## 1. Install

```bash
cd mobile
npm install
```

## 2. Google Cloud setup (one time)

In the [Google Cloud Console](https://console.cloud.google.com/) → **APIs &
Services → Credentials**, create OAuth 2.0 client IDs:

1. **Web application** — used as the token *audience*. Copy its client ID.
2. **iOS** — set the bundle ID to `com.jreisdorff.guidance` (or your own; keep it
   in sync with `app.json` → `ios.bundleIdentifier`). Copy its client ID.
3. **Android** — set the package to `com.jreisdorff.guidance` and the **SHA-1**
   from your EAS Android keystore. Get it after the first EAS build, or via
   `eas credentials` → Android.

## 3. Configure env

```bash
cp .env.example .env
```

Fill in:

- `EXPO_PUBLIC_API_URL` — your backend URL (see the file's comments for
  simulator/emulator/device/production values).
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — the **Web** client ID from step 2.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — the **iOS** client ID from step 2.

Then in `app.json`, replace `REPLACE_WITH_REVERSED_IOS_CLIENT_ID` in the
google-signin plugin's `iosUrlScheme` with your reversed iOS client ID
(`com.googleusercontent.apps.<iOS client ID>`).

Finally, on the **backend** (`../.env`), set:

- `GOOGLE_CLIENT_IDS` — comma-separated, must include the **Web** client ID
  (add the iOS one too, e.g. `WEB_ID,IOS_ID`).
- `JWT_SECRET` — a long random string (`openssl rand -hex 32`).

## 4. Build a dev client and run

Native modules require a development build (Expo Go won't work):

```bash
npm install -g eas-cli   # if needed
eas login

# Cloud builds:
eas build --profile development --platform ios
eas build --profile development --platform android

# …or build & run locally (needs Xcode / Android Studio):
npx expo run:ios
npx expo run:android
```

Install the resulting dev build on a simulator/emulator or device, then start
the bundler and open it in that build:

```bash
npx expo start --dev-client
```

## 5. Local backend

From the repo root, run the backend the app talks to:

```bash
cd ..
npm run dev   # web app + backend on :8787
# or just the API:
npm run server
```

Make sure `EXPO_PUBLIC_API_URL` points at a host the device can reach (a LAN IP
for a physical device; `10.0.2.2` for the Android emulator).

## 6. Store submission (later)

Build production binaries and submit with EAS:

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

You'll need an Apple Developer account and a Google Play Console account, plus
store listings, icons, and screenshots (not included in this scaffold).
