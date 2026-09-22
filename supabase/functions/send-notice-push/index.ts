// SSG 캘린더: 공지 등록 직후 즉시 웹푸시 발송
// deploy: mcp__Supabase__deploy_edge_function (verify_jwt=true)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = 'BD7itu-ttSOCBH1DqFeIx91jgBrSXZumPJupqwL8m6jMtZf0FMtEajQDqFrvSyE7VkEy1QYDXe4oubWrHG_GCCY'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// deno-lint-ignore no-explicit-any
async function resolveTargets(admin: any, notice: any): Promise<string[]> {
  if (notice.scope === 'all') {
    const { data } = await admin.from('profiles').select('id').eq('status', 'active')
    return (data ?? []).map((p: { id: string }) => p.id)
  }
  if (notice.scope === 'by_person') {
    return notice.target_profile_ids ?? []
  }
  if (notice.scope === 'by_store') {
    const { data } = await admin
      .from('profiles')
      .select('id')
      .eq('status', 'active')
      .in('store_id', notice.target_store_ids ?? [])
    return (data ?? []).map((p: { id: string }) => p.id)
  }
  if (notice.scope === 'by_team') {
    const { data: stores } = await admin.from('stores').select('id').in('team_id', notice.target_team_ids ?? [])
    const storeIds = (stores ?? []).map((s: { id: string }) => s.id)
    if (storeIds.length === 0) return []
    const { data } = await admin.from('profiles').select('id').eq('status', 'active').in('store_id', storeIds)
    return (data ?? []).map((p: { id: string }) => p.id)
  }
  return []
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: cors })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userErr } = await authClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors })
    }

    const { notice_id } = await req.json()
    const erp2Admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'erp2' } })
    const { data: notice, error: noticeErr } = await erp2Admin.from('notices').select('*').eq('id', notice_id).single()
    if (noticeErr || !notice) {
      return new Response(JSON.stringify({ error: 'notice not found' }), { status: 404, headers: cors })
    }

    const targetIds = await resolveTargets(erp2Admin, notice)
    if (targetIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const calAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'calendar_app' } })
    const { data: vapidPrivate } = await calAdmin.rpc('get_vapid_private_key')
    webpush.setVapidDetails('mailto:admin@ssg-calendar.app', VAPID_PUBLIC_KEY, vapidPrivate as string)

    const { data: subs } = await calAdmin.from('push_subscriptions').select('*').in('profile_id', targetIds)

    const payload = JSON.stringify({
      title: notice.is_important ? `[중요] ${notice.title}` : notice.title,
      body: (notice.content ?? '').slice(0, 120),
      url: '/',
      noticeId: notice.id,
    })

    let sent = 0
    for (const sub of subs ?? []) {
      const { error: logErr } = await calAdmin
        .from('notice_push_log')
        .insert({ notice_id: notice.id, profile_id: sub.profile_id, kind: 'immediate' })
      if (logErr) continue // 이미 발송됨(중복 방지)
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload)
        sent++
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await calAdmin.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('push send error', err)
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors })
  }
})
