import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile, RoleCode } from './types'

type AuthState = {
  loading: boolean
  session: Session | null
  profile: Profile | null
  signIn: (loginId: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isManager: boolean // 점장 이상 (level >= 40) - 공지 등록 가능
  isAdmin: boolean // 이사급 이상 (level >= 80)
}

const AuthContext = createContext<AuthState | null>(null)

const ROLE_LEVEL: Record<RoleCode, number> = {
  super_admin: 100,
  admin: 80,
  director: 60,
  store_manager: 40,
  seller: 20,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadProfile = async (userId: string) => {
    const { data: p, error } = await supabase
      .from('profiles')
      .select('id, login_id, name, store_id, position, role_id, roles!inner(code, level)')
      .eq('id', userId)
      .single()
    if (error || !p) {
      setProfile(null)
      return
    }
    const roleRow = p.roles as unknown as { code: RoleCode; level: number }

    let teamId: string | null = null
    let teamName: string | null = null
    if (p.store_id) {
      const { data: store } = await supabase.from('stores').select('id, team_id').eq('id', p.store_id).single()
      if (store?.team_id) {
        teamId = store.team_id
        const { data: team } = await supabase.from('teams').select('name').eq('id', store.team_id).single()
        teamName = team?.name ?? null
      }
    }

    setProfile({
      id: p.id,
      loginId: p.login_id,
      name: p.name,
      storeId: p.store_id,
      position: p.position,
      roleCode: roleRow.code,
      roleLevel: roleRow.level ?? ROLE_LEVEL[roleRow.code] ?? 20,
      teamId,
      teamName,
    })
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (loginId: string, password: string) => {
    // 아이디 -> 합성 이메일 조회 (ssg-erp2와 동일한 RPC, anon 허용)
    const { data: email, error: lookupError } = await supabase.rpc('get_login_email', {
      p_login_id: loginId,
    })
    if (lookupError || !email) {
      return { error: '존재하지 않는 아이디입니다.' }
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const roleLevel = profile?.roleLevel ?? 0

  return (
    <AuthContext.Provider
      value={{
        loading,
        session,
        profile,
        signIn,
        signOut,
        isManager: roleLevel >= 40,
        isAdmin: roleLevel >= 80,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
