import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { getMonthGrid, WEEKDAY_LABELS, formatYm, toDateStr, todayStr } from '../lib/dateUtils'
import { categoryOf, type Notice, type Profile, type ScheduleEntry, type Store, type Team } from '../lib/types'
import DayDetailModal from '../components/DayDetailModal'
import NoticeModal from '../components/NoticeModal'
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push'
import { ChevronLeft, ChevronRight, LogOut, Bell, BellOff, Megaphone } from 'lucide-react'

export default function CalendarPage() {
  const { profile, signOut } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [roster, setRoster] = useState<Profile[]>([])
  const [filterTeamId, setFilterTeamId] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [noticeDate, setNoticeDate] = useState<string | null>(null)
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  const grid = useMemo(() => getMonthGrid(year, month), [year, month])
  const gridStart = toDateStr(grid[0])
  const gridEnd = toDateStr(grid[grid.length - 1])

  // 기준 데이터 (팀/매장/전체 인원) - 최초 1회
  useEffect(() => {
    ;(async () => {
      const [{ data: teamsData }, { data: storesData }, { data: profilesData }] = await Promise.all([
        supabase.from('teams').select('id, name, team_lead_name').eq('active', true).order('name'),
        supabase.from('stores').select('id, pos_name, team_id').eq('active', true).order('pos_name'),
        supabase
          .from('profiles')
          .select('id, login_id, name, store_id, position, role_id, roles!inner(code, level), status')
          .eq('status', 'active')
          .order('name'),
      ])
      setTeams(teamsData ?? [])
      setStores(storesData ?? [])
      setRoster(
        (profilesData ?? []).map((p) => {
          const roleRow = p.roles as unknown as { code: Profile['roleCode']; level: number }
          return {
            id: p.id,
            loginId: p.login_id,
            name: p.name,
            storeId: p.store_id,
            position: p.position,
            roleCode: roleRow.code,
            roleLevel: roleRow.level,
            teamId: null,
            teamName: null,
          }
        }),
      )
    })()
  }, [])

  useEffect(() => {
    if (!isPushSupported()) return
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setPushOn(!!sub)
    })
  }, [])

  const storesById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores])

  const loadMonth = useCallback(async () => {
    const [{ data: entryData }, { data: noticeData }] = await Promise.all([
      supabase
        .from('schedule_entries')
        .select('id, profile_id, entry_date, status, note, created_by, profiles!schedule_entries_profile_id_fkey(name, store_id)')
        .gte('entry_date', gridStart)
        .lte('entry_date', gridEnd),
      supabase
        .from('notices')
        .select('*')
        .lte('start_date', gridEnd)
        .or(`end_date.is.null,end_date.gte.${gridStart}`),
    ])

    setEntries(
      (entryData ?? []).map((e) => {
        const p = e.profiles as unknown as { name: string; store_id: string | null } | null
        const store = p?.store_id ? storesById.get(p.store_id) : undefined
        return {
          id: e.id,
          profile_id: e.profile_id,
          entry_date: e.entry_date,
          status: e.status,
          note: e.note,
          created_by: e.created_by,
          profile_name: p?.name ?? '(알 수 없음)',
          store_name: store?.pos_name,
          team_id: store?.team_id ?? null,
        }
      }),
    )
    setNotices(noticeData ?? [])
  }, [gridStart, gridEnd, storesById])

  useEffect(() => {
    loadMonth()
  }, [loadMonth])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>()
    for (const e of entries) {
      if (filterTeamId !== 'all' && e.team_id !== filterTeamId) continue
      if (!map.has(e.entry_date)) map.set(e.entry_date, [])
      map.get(e.entry_date)!.push(e)
    }
    return map
  }, [entries, filterTeamId])

  const noticesForDate = useCallback(
    (dateStr: string) => notices.filter((n) => n.start_date <= dateStr && (!n.end_date || n.end_date >= dateStr)),
    [notices],
  )

  const goPrevMonth = () => {
    const d = new Date(year, month - 1, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }
  const goNextMonth = () => {
    const d = new Date(year, month + 1, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const togglePush = async () => {
    setPushBusy(true)
    if (pushOn) {
      await unsubscribeFromPush()
      setPushOn(false)
    } else {
      const res = await subscribeToPush()
      setPushOn(res.ok)
    }
    setPushBusy(false)
  }

  const today = todayStr()

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{profile?.teamName ?? '전체'}</p>
            <p className="text-sm font-semibold text-gray-800">{profile?.name}님</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePush}
              disabled={pushBusy}
              title={pushOn ? '푸시 알림 끄기' : '푸시 알림 켜기'}
              className={`rounded-full p-2 ${pushOn ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}
            >
              {pushOn ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
            <button onClick={signOut} title="로그아웃" className="rounded-full bg-gray-100 p-2 text-gray-500">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-2 py-4 sm:px-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button onClick={goPrevMonth} className="rounded-full p-1.5 hover:bg-gray-100">
              <ChevronLeft size={20} />
            </button>
            <h1 className="w-32 text-center text-lg font-bold text-gray-900">{formatYm(year, month)}</h1>
            <button onClick={goNextMonth} className="rounded-full p-1.5 hover:bg-gray-100">
              <ChevronRight size={20} />
            </button>
          </div>
          <select
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-600"
          >
            <option value="all">전체 팀</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 text-xs sm:text-sm">
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={w} className={`bg-gray-50 py-1.5 text-center font-medium ${i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-gray-500'}`}>
              {w}
            </div>
          ))}
          {grid.map((d) => {
            const dateStr = toDateStr(d)
            const inMonth = d.getMonth() === month
            const dayEntries = entriesByDate.get(dateStr) ?? []
            const dayNotices = noticesForDate(dateStr)
            const isToday = dateStr === today
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[76px] sm:min-h-[92px] bg-white p-1 text-left align-top transition hover:bg-brand-50 ${!inMonth ? 'opacity-40' : ''}`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] sm:text-xs ${
                    isToday ? 'bg-brand-600 font-semibold text-white' : 'text-gray-700'
                  }`}
                >
                  {d.getDate()}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayNotices.slice(0, 1).map((n) => (
                    <div key={n.id} className="flex items-center gap-0.5 truncate rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-800">
                      <Megaphone size={9} className="shrink-0" />
                      <span className="truncate">{n.title}</span>
                    </div>
                  ))}
                  {dayEntries.slice(0, 3).map((e) => (
                    <div key={e.id} className="flex items-center gap-1 truncate text-[10px] sm:text-[11px]">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryOf(e.status).dot}`} />
                      <span className="truncate text-gray-600">{e.profile_name}</span>
                    </div>
                  ))}
                  {dayEntries.length > 3 && <p className="text-[10px] text-gray-400">+{dayEntries.length - 3}명 더</p>}
                </div>
              </button>
            )
          })}
        </div>
      </main>

      {selectedDate && (
        <DayDetailModal
          dateStr={selectedDate}
          entries={entries.filter((e) => e.entry_date === selectedDate)}
          notices={noticesForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onChanged={() => {
            loadMonth()
          }}
          onOpenNotice={() => setNoticeDate(selectedDate)}
        />
      )}

      {noticeDate && (
        <NoticeModal
          dateStr={noticeDate}
          teams={teams}
          stores={stores}
          roster={roster}
          onClose={() => setNoticeDate(null)}
          onSaved={() => {
            setNoticeDate(null)
            loadMonth()
          }}
        />
      )}
    </div>
  )
}
