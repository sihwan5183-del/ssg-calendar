// SSG 캘린더: 웹푸시 구독 등록/해지
// deploy: mcp__Supabase__deploy_edge_function (verify_jwt=true)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: cors })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await authClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors })
    }
    const profileId = userData.user.id

    const body = await req.json()
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'calendar_app' } })

    if (body.action === 'subscribe') {
      const sub = body.subscription
      if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
        return new Response(JSON.stringify({ error: 'invalid subscription' }), { status: 400, headers: cors })
      }
      const { error } = await admin.from('push_subscriptions').upsert(
        {
          profile_id: profileId,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth_key: sub.keys.auth,
          user_agent: req.headers.get('user-agent') ?? null,
        },
        { onConflict: 'endpoint' },
      )
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    if (body.action === 'unsubscribe') {
      if (body.endpoint) {
        await admin.from('push_subscriptions').delete().eq('endpoint', body.endpoint).eq('profile_id', profileId)
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400, headers: cors })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors })
  }
})
