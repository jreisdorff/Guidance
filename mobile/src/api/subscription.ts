// Client for the subscription endpoints on the shared backend. The backend is
// the source of truth for entitlement: it verifies the App Store receipt with
// Apple and records the expiry, and /api/affirm enforces it.

import { API_URL } from '../config'
import { ApiError } from './client'

export type SubStatus = { active: boolean; expiresAt: number | null }

// What the backend currently believes about this user's subscription.
export async function getSubscriptionStatus(token: string): Promise<SubStatus> {
  const res = await fetch(`${API_URL}/api/subscription-status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new ApiError(res.status)
  return res.json() as Promise<SubStatus>
}

// Hand a fresh App Store receipt to the backend to verify with Apple and record.
export async function verifySubscription(token: string, receipt: string): Promise<SubStatus> {
  const res = await fetch(`${API_URL}/api/verify-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receipt, platform: 'ios' }),
  })
  if (!res.ok) throw new ApiError(res.status)
  return res.json() as Promise<SubStatus>
}
