import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BD7itu-ttSOCBH1DqFeIx91jgBrSXZumPJupqwL8m6jMtZf0FMtEajQDqFrvSyE7VkEy1QYDXe4oubWrHG_GCCY'
const FUNCTIONS_BASE = 'https://ebggtghzqtxfylbhqfoh.supabase.co/functions/v1'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

async function callFn(path: string, body: unknown) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  const res = await fetch(`${FUNCTIONS_BASE}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  return res.json().catch(() => ({}))
}

export async function subscribeToPush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }
  await callFn('manage-push-subscription', { action: 'subscribe', subscription: sub.toJSON() })
  return { ok: true }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await callFn('manage-push-subscription', { action: 'unsubscribe', endpoint: sub.endpoint })
    await sub.unsubscribe()
  }
}

export async function sendNoticePushNow(noticeId: string) {
  return callFn('send-notice-push', { notice_id: noticeId })
}
