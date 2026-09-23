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

// 직급(직책)에 따른 색상 구분 — 휴무/연차 등 일정 종류가 아니라 "누구인지"로 색이 정해짐
// 기본 그룹: 대표·이사·실장은 한 색, 영업이사·영업팀장·팀장은 각각 다른 색, 그 외 전 직원은 기본색
// 관리자가 색상/직원별 소속 그룹을 조정할 수 있음(calendar_app.rank_settings / person_rank_overrides)
export type RankGroupKey = 'exec' | 'director' | 'head' | 'sales_director' | 'sales_team_lead' | 'team_lead' | 'default'

export type RankInfo = { key: RankGroupKey; label: string; colorKey: string; color: string; dot: string }

// 관리자가 고를 수 있는 색상 팔레트 (Tailwind 팔레트 이름 -> 실제 클래스)
export const RANK_COLOR_PALETTE: { key: string; name: string; color: string; dot: string; swatch: string }[] = [
  { key: 'slate', name: '슬레이트', color: 'bg-slate-700 text-slate-50 border-slate-500', dot: 'bg-slate-400', swatch: 'bg-slate-600' },
  { key: 'rose', name: '로즈', color: 'bg-rose-700 text-rose-50 border-rose-500', dot: 'bg-rose-400', swatch: 'bg-rose-500' },
  { key: 'orange', name: '오렌지', color: 'bg-orange-700 text-orange-50 border-orange-500', dot: 'bg-orange-400', swatch: 'bg-orange-500' },
  { key: 'amber', name: '앰버', color: 'bg-amber-700 text-amber-50 border-amber-500', dot: 'bg-amber-400', swatch: 'bg-amber-500' },
  { key: 'teal', name: '틸', color: 'bg-teal-700 text-teal-50 border-teal-500', dot: 'bg-teal-400', swatch: 'bg-teal-500' },
  { key: 'emerald', name: '에메랄드', color: 'bg-emerald-700 text-emerald-50 border-emerald-500', dot: 'bg-emerald-400', swatch: 'bg-emerald-500' },
  { key: 'sky', name: '스카이', color: 'bg-sky-700 text-sky-50 border-sky-500', dot: 'bg-sky-400', swatch: 'bg-sky-500' },
  { key: 'blue', name: '블루', color: 'bg-blue-700 text-blue-50 border-blue-500', dot: 'bg-blue-400', swatch: 'bg-blue-500' },
  { key: 'violet', name: '바이올렛', color: 'bg-violet-700 text-violet-50 border-violet-500', dot: 'bg-violet-400', swatch: 'bg-violet-500' },
  { key: 'purple', name: '퍼플', color: 'bg-purple-700 text-purple-50 border-purple-500', dot: 'bg-purple-400', swatch: 'bg-purple-500' },
  { key: 'pink', name: '핑크', color: 'bg-pink-700 text-pink-50 border-pink-500', dot: 'bg-pink-400', swatch: 'bg-pink-500' },
]

export function paletteOf(colorKey: string) {
  return RANK_COLOR_PALETTE.find((c) => c.key === colorKey) ?? RANK_COLOR_PALETTE[7]
}

// 기본값(DB 조회 실패 시 폴백용) — 실제 표시는 rank_settings 테이블 값을 우선 사용
export const DEFAULT_RANK_GROUPS: { key: RankGroupKey; label: string; colorKey: string }[] = [
  { key: 'exec', label: '대표', colorKey: 'slate' },
  { key: 'director', label: '이사', colorKey: 'purple' },
  { key: 'head', label: '실장', colorKey: 'teal' },
  { key: 'sales_director', label: '영업이사', colorKey: 'rose' },
  { key: 'sales_team_lead', label: '영업팀장', colorKey: 'orange' },
  { key: 'team_lead', label: '팀장', colorKey: 'orange' },
  { key: 'default', label: '일반 직원', colorKey: 'blue' },
]

// position 텍스트로 그룹을 자동 추정(관리자가 직접 지정하지 않은 사람의 기본값)
export function autoRankKey(position: string | null | undefined): RankGroupKey {
  const p = (position ?? '').trim()
  if (p.includes('영업이사')) return 'sales_director'
  if (p.includes('영업팀장')) return 'sales_team_lead'
  if (p.includes('팀장')) return 'team_lead'
  if (p.includes('대표') || p.includes('대장')) return 'exec'
  if (p.includes('이사')) return 'director'
  if (p.includes('실장')) return 'head'
  return 'default'
}

export const RANK_GROUPS = DEFAULT_RANK_GROUPS.map((g) => ({ ...g, ...paletteOf(g.colorKey) }))

export function rankGroupOf(position: string | null | undefined): RankInfo {
  const key = autoRankKey(position)
  const g = DEFAULT_RANK_GROUPS.find((x) => x.key === key)!
  const pal = paletteOf(g.colorKey)
  return { key: g.key, label: g.label, colorKey: g.colorKey, color: pal.color, dot: pal.dot }
}

export function rankedName(rank: { label: string }, name: string): string {
  return `${rank.label}_${name}`
}

export type ScheduleEntry = {
  id: string
  profile_id: string
  entry_date: string // YYYY-MM-DD
  status: EntryStatus
  note: string | null
  created_by: string | null
  profile_name?: string
  profile_position?: string | null
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
