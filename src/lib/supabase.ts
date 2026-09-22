import { createClient } from '@supabase/supabase-js'

// anon(publishable) key는 클라이언트에 노출돼도 안전하도록 설계된 키입니다(RLS로 실제 접근 제어).
// ssg-erp2와 동일한 Supabase 프로젝트/계정을 그대로 사용합니다 (로그인 계정 공유).
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ebggtghzqtxfylbhqfoh.supabase.co'
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ2d0Z2h6cXR4ZnlsYmhxZm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDk4MzgsImV4cCI6MjA5NjgyNTgzOH0.bPqIVbrnh2I9pi9rBQzQNOXQcG8v5WbBauZynkED_-Q'

// ssg-erp2와 같은 erp2 스키마를 그대로 사용 (profiles/roles/teams/stores/schedule_entries/notices 공유)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'erp2' },
  auth: { persistSession: true, autoRefreshToken: true },
})
