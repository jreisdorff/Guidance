// Subscription state for the app. The store (App Store) handles the 7-day free
// trial and $0.99/month billing on an auto-renewable product; here we drive the
// purchase/restore flow and reflect the backend's verified entitlement.
//
// react-native-iap is a native module, so we require it lazily: the app still
// builds/typechecks without it, and degrades gracefully (no purchases) in
// environments where it isn't linked (e.g. Expo Go).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Platform } from 'react-native'
import { useAuth } from './auth/AuthContext'
import { getSubscriptionStatus, verifySubscription } from './api/subscription'
import { SUBSCRIPTION_SKU } from './config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let IAP: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  IAP = require('react-native-iap')
} catch {
  IAP = null
}

type SubValue = {
  ready: boolean
  subscribed: boolean
  priceString: string | null
  purchase: () => Promise<void>
  restore: () => Promise<void>
  refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, getToken } = useAuth()
  const [ready, setReady] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [priceString, setPriceString] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listeners = useRef<any[]>([])

  // Verify a store receipt with our backend (source of truth) and reflect it.
  const verifyReceipt = useCallback(
    async (receipt: string) => {
      const token = await getToken()
      if (!token) return
      const status = await verifySubscription(token, receipt)
      setSubscribed(status.active)
    },
    [getToken],
  )

  // Ask the backend whether this user currently has an active entitlement.
  const refresh = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const status = await getSubscriptionStatus(token)
      setSubscribed(status.active)
    } catch {
      // keep prior state on transient failure
    }
  }, [getToken])

  useEffect(() => {
    let mounted = true
    async function init() {
      if (!IAP || Platform.OS !== 'ios') {
        if (mounted) setReady(true)
        return
      }
      try {
        await IAP.initConnection()
        const subs = await IAP.getSubscriptions({ skus: [SUBSCRIPTION_SKU] })
        const product = subs?.[0]
        if (mounted && product) {
          setPriceString(product.localizedPrice ?? product.displayPrice ?? null)
        }
        // A completed (or restored) purchase arrives here; verify and finish it.
        listeners.current.push(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          IAP.purchaseUpdatedListener(async (purchase: any) => {
            try {
              const receipt =
                purchase.transactionReceipt || (await IAP.getReceiptIOS?.())
              if (receipt) await verifyReceipt(receipt)
              await IAP.finishTransaction({ purchase, isConsumable: false })
            } catch {
              // backend refresh will reconcile on next launch
            }
          }),
          IAP.purchaseErrorListener(() => {}),
        )
      } catch {
        // store unavailable — leave subscribed as-is (backend still enforces)
      } finally {
        if (mounted) setReady(true)
      }
    }
    init()
    return () => {
      mounted = false
      listeners.current.forEach((l) => l?.remove?.())
      listeners.current = []
      IAP?.endConnection?.().catch?.(() => {})
    }
  }, [verifyReceipt])

  // Reflect server-side entitlement whenever the signed-in user changes.
  useEffect(() => {
    if (user) refresh()
    else setSubscribed(false)
  }, [user, refresh])

  const purchase = useCallback(async () => {
    if (!IAP) throw new Error('iap_unavailable')
    // The purchaseUpdatedListener handles verification once it completes.
    await IAP.requestSubscription({ sku: SUBSCRIPTION_SKU })
  }, [])

  const restore = useCallback(async () => {
    if (!IAP) throw new Error('iap_unavailable')
    const purchases = await IAP.getAvailablePurchases()
    const receipt =
      purchases?.[0]?.transactionReceipt || (await IAP.getReceiptIOS?.())
    if (receipt) await verifyReceipt(receipt)
    else await refresh()
  }, [verifyReceipt, refresh])

  return (
    <SubscriptionContext.Provider
      value={{ ready, subscribed, priceString, purchase, restore, refresh }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider')
  return ctx
}
