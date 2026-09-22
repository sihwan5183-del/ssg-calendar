// SSG 캘린더: 매일 아침 당일 공지 리마인드 푸시 (pg_cron -> net.http_post 로 호출됨)
// deploy: mcp__Supabase__deploy_edge_function (verify_jwt=true, anon key를 Bearer로 사용해 호출)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = 'BD7itu-ttSOCBH1DqFeIx91jgBrSXZumPJupqwL8m6jMtZf0FMtEajQDqFrvSyE7VkEy1QYDXe4oubWrHG_GCCY'

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

Deno.serve(async (_req: Request) => {
  try {
    const erp2Admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'erp2' } })
    const calAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'calendar_app' } })

    const todayKst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const y = todayKst.getFullYear()
    const m = String(todayKst.getMonth() + 1).padStart(2, '0')
    const d = String(todayKst.getDate()).padStart(2, '0')
    const todayStr = `${y}-${m}-${d}`

    const { data: notices, error } = await erp2Admin
      .from('notices')
      .select('*')
      .eq('remind_morning_of', true)
      .lte('start_date', todayStr)
      .or(`end_date.is.null,end_date.gte.${todayStr}`)
    if (error) throw error

    const { data: vapidPrivate } = await calAdmin.rpc('get_vapid_private_key')
    webpush.setVapidDetails('mailto:admin@ssg-calendar.app', VAPID_PUBLIC_KEY, vapidPrivate as string)

    let totalSent = 0
    for (const notice of notices ?? []) {
      const targetIds = await resolveTargets(erp2Admin, notice)
      if (targetIds.length === 0) continue
      const { data: subs } = await calAdmin.from('push_subscriptions').select('*').in('profile_id', targetIds)
      const payload = JSON.stringify({
        title: `[오늘 일정] ${notice.title}`,
        body: (notice.content ?? '').slice(0, 120),
        url: '/',
        noticeId: notice.id,
      })
      for (const sub of subs ?? []) {
        const { error: logErr } = await calAdmin
          .from('notice_push_log')
          .insert({ notice_id: notice.id, profile_id: sub.profile_id, kind: 'morning_reminder' })
        if (logErr) continue // 오늘 이미 발송됨(중복 방지)
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload)
          totalSent++
        } catch (err) {
          const statusCode = (err as { statusCode?: number })?.statusCode
          if (statusCode === 404 || statusCode === 410) {
            await calAdmin.from('push_subscriptions').delete().eq('id', sub.id)
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: totalSent }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
