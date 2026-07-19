# Subscription setup (Guidance mobile)

The mobile app gives **1 free question**, then requires a subscription: a
**7-day free trial** that renews at **$0.99/month**. The store handles the trial
and billing; the backend verifies the App Store receipt and records entitlement.

The code is in place, but it can't function until the steps below are done, and
purchases can only be tested on a real device or the iOS sandbox.

## 1. App Store Connect

1. In **App Store Connect → your app → Subscriptions**, create a subscription
   group and an **auto-renewable subscription**:
   - Product ID: **`com.jreisdorff.guidance.monthly`** (keep in sync with
     `EXPO_PUBLIC_SUBSCRIPTION_SKU` / `mobile/src/config.ts`).
   - Price: **$0.99/month**.
2. Add an **Introductory Offer → Free trial → 7 days** to that product.
3. Under **App Information → App-Specific Shared Secret**, generate/copy the
   shared secret (used by the backend to verify receipts).
4. Create a **Sandbox tester** (Users and Access → Sandbox) to test purchases.

## 2. Backend env

Set on the backend (local `.env` and Vercel project env):

- `APPLE_SHARED_SECRET` — the App-Specific Shared Secret from step 1.3.
- `FIREBASE_SERVICE_ACCOUNT` — already required; entitlement + free-question
  count are stored on the user's Firestore doc (`users/{uid}`:
  `subExpiresMs`, `freeUsed`).

Backend endpoints (already implemented, in `server/index.js` and `api/*.js`):

- `POST /api/affirm` — for the mobile client (sends `X-Guidance-Client: mobile`)
  it returns **402** once the free question is used and the user isn't
  subscribed. The web app is unlimited (no header) and unaffected.
- `POST /api/verify-subscription` — `{ receipt }` → verifies with Apple, records
  expiry, returns `{ active, expiresAt }`.
- `GET /api/subscription-status` → `{ active, expiresAt }`.

## 3. Install the native module + rebuild

`react-native-iap` is a native module, so a new dev/build is required:

```bash
cd mobile
npm install                 # picks up react-native-iap
npx expo prebuild --clean   # regenerates ios/ with the StoreKit capability
npx expo run:ios            # or: eas build --profile development --platform ios
```

In **Xcode → Signing & Capabilities**, ensure **In-App Purchase** is enabled for
the app target (Expo prebuild usually adds it; verify after a bare build).

## 4. Test

Run on a device/simulator signed in with the **sandbox tester**. First question
works; the second shows the paywall; "Start 7-day free trial" runs the StoreKit
purchase; on success the app calls `/api/verify-subscription` and unlocks.
"Restore purchase" re-verifies an existing subscription.

## Notes / limitations

- **Enforcement is header-based for platform.** The quota only applies when the
  request carries `X-Guidance-Client: mobile`. This keeps the web app free, but
  a technically savvy user could omit the header to bypass the *free-question*
  gate. The *subscription* entitlement itself is verified server-side against
  Apple, so paid access is genuine.
- **Anonymous users can subscribe** (the subscription is tied to the Apple ID,
  not the app account). Signing in with phone still just saves the journal.
- Consider Apple **App Store Server Notifications** (webhooks) later, to keep
  `subExpiresMs` fresh on renewals/cancellations without the app re-verifying.
