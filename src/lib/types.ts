export type RoleCode = 'super_admin' | 'admin' | 'director' | 'store_manager' | 'seller'

export type Profile = {
  id: string
  loginId: string
  name: string
  storeId: string | null
  position: string | null
  roleCode: RoleCode
  roleLevel: number
  teamId: string | null
  teamName: string | null
}

export type EntryStatus =
  | 'work'
  | 'vacation'
  | 'off'
  | 'annual'
  | 'unpaid'
  | 'family_event'
  | 'meeting'
  | 'other'
  | 'field_work'

export const ENTRY_CATEGORIES: { value: EntryStatus; label: string; color: string; dot: string }[] = [
  { value: 'off', label: '휴무', color: 'bg-rose-50 text-rose-700 border-rose-300', dot: 'bg-rose-500' },
  { value: 'annual', label: '연차', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
  { value: 'vacation', label: '휴가', color: 'bg-sky-50 text-sky-700 border-sky-300', dot: 'bg-sky-500' },
  { value: 'meeting', label: '회의', color: 'bg-violet-50 text-violet-700 border-violet-300', dot: 'bg-violet-500' },
  { value: 'field_work', label: '외근', color: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  { value: 'unpaid', label: '무급', color: 'bg-zinc-100 text-zinc-700 border-zinc-300', dot: 'bg-zinc-500' },
  { value: 'family_event', label: '경조사', color: 'bg-purple-50 text-purple-700 border-purple-300', dot: 'bg-purple-500' },
  { value: 'other', label: '기타', color: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500' },
]

export function categoryOf(status: string) {
  return ENTRY_CATEGORIES.find((c) => c.value === status) ?? ENTRY_CATEGORIES[ENTRY_CATEGORIES.length - 1]
}

export type ScheduleEntry = {
  id: string
  profile_id: string
  entry_date: string // YYYY-MM-DD
  status: EntryStatus
  note: string | null
  created_by: string | null
  profile_name?: string
  store_name?: string
  team_id?: string | null
}

export type NoticeScope = 'all' | 'by_team' | 'by_store' | 'by_person'

export type Notice = {
  id: string
  title: string
  content: string
  author_id: string | null
  start_date: string
  end_date: string | null
  meeting_at: string | null // timestamptz
  zoom_link: string | null
  is_important: boolean
  scope: NoticeScope
  target_team_ids: string[]
  target_store_ids: string[]
  target_profile_ids: string[]
  remind_morning_of: boolean
  created_at: string
  author_name?: string
}

export type Team = { id: string; name: string; team_lead_name: string | null }
export type Store = { id: string; pos_name: string; team_id: string | null }
