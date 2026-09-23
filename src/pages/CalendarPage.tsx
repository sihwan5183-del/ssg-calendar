import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { getMonthGrid, WEEKDAY_LABELS, formatYm, toDateStr, todayStr, fmtTime } from '../lib/dateUtils'
import { RANK_GROUPS, rankGroupOf, type Notice, type Profile, type ScheduleEntry, type Store, type Team } from '../lib/types'
import DayDetailModal from '../components/DayDetailModal'
import NoticeModal from '../components/NoticeModal'
import Sidebar, { type ViewKey } from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import MembersView from '../components/MembersView'
import NoticesView from '../components/NoticesView'
import AdminView from '../components/AdminView'
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push'
import { ChevronLeft, ChevronRight, LogOut, Bell, BellOff, CalendarDays, Search, ChevronDown, Menu } from 'lucide-react'

export default function CalendarPage() {
  const { profile, signOut, isManager } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [roster, setRoster] = useState<Profile[]>([])
  const [filterTeamId, setFilterTeamId] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())
  const [showDayModal, setShowDayModal] = useState(false)
  const [noticeDate, setNoticeDate] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ViewKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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
        .select('id, profile_id, entry_date, status, note, created_by, profiles!schedule_entries_profile_id_fkey(name, store_id, position)')
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
        const p = e.profiles as unknown as { name: string; store_id: string | null; position: string | null } | null
        const store = p?.store_id ? storesById.get(p.store_id) : undefined
        return {
          id: e.id,
          profile_id: e.profile_id,
          entry_date: e.entry_date,
          status: e.status,
          note: e.note,
          created_by: e.created_by,
          profile_name: p?.name ?? '(알 수 없음)',
          profile_position: p?.position ?? null,
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
      if (activeView === 'mine' && e.profile_id !== profile?.id) continue
      if (searchQuery && !(e.profile_name ?? '').includes(searchQuery)) continue
      if (!map.has(e.entry_date)) map.set(e.entry_date, [])
      map.get(e.entry_date)!.push(e)
    }
    return map
  }, [entries, filterTeamId, activeView, profile?.id, searchQuery])

  const noticesForDate = useCallback(
    (dateStr: string) => {
      const list = notices.filter((n) => n.start_date <= dateStr && (!n.end_date || n.end_date >= dateStr))
      return searchQuery ? list.filter((n) => n.title.includes(searchQuery) || n.content.includes(searchQuery)) : list
    },
    [notices, searchQuery],
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
  const goToday = () => {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth())
    setSelectedDate(todayStr())
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
  const selectedEntries = entries.filter((e) => e.entry_date === selectedDate)
  const selectedNotices = noticesForDate(selectedDate)
  const todayNotices = noticesForDate(today)
  const badgeCount = todayNotices.filter((n) => n.meeting_at || n.is_important).length
  const monthLabel = formatYm(year, month)

  const NavContent = (
    <Sidebar
      active={activeView}
      onChange={(v) => {
        setActiveView(v)
        setMobileNavOpen(false)
      }}
      isManager={isManager}
    />
  )

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 lg:hidden">
            <Menu size={20} />
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <CalendarDays size={19} />
          </span>
          <div className="hidden sm:block">
            <p className="text-base font-bold leading-tight text-gray-900">사내 팀 캘린더</p>
            <p className="text-[11px] leading-tight text-gray-400">함께 만드는 더 좋은 오늘</p>
          </div>
        </div>

        <div className="relative mx-3 hidden max-w-md flex-1 sm:block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="직원 또는 일정 검색"
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => setActiveView('notices')} className="relative rounded-full p-2 text-gray-500 hover:bg-gray-50">
            <Bell size={19} />
            {badgeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {badgeCount}
              </span>
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 hover:bg-gray-50 sm:pr-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {profile?.name?.slice(-1) ?? '?'}
              </span>
              <span className="hidden text-sm font-semibold text-gray-800 sm:inline">{profile?.name}</span>
              <ChevronDown size={14} className="hidden text-gray-400 sm:inline" />
            </button>
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
                  <p className="px-3 py-1.5 text-xs text-gray-400">{profile?.position ?? profile?.roleCode}</p>
                  <button
                    onClick={togglePush}
                    disabled={pushBusy}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    {pushOn ? <Bell size={15} /> : <BellOff size={15} />} 푸시 알림 {pushOn ? '끄기' : '켜기'}
                  </button>
                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <LogOut size={15} /> 로그아웃
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden h-full lg:block">{NavContent}</div>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} />
            <div className="absolute inset-y-0 left-0 shadow-xl">{NavContent}</div>
          </div>
        )}

        {activeView === 'members' && (
          <div className="flex-1 overflow-y-auto">
            <MembersView roster={roster} stores={stores} teams={teams} searchQuery={searchQuery} />
          </div>
        )}

        {activeView === 'notices' && (
          <div className="flex-1 overflow-y-auto">
            <NoticesView notices={notices} searchQuery={searchQuery} isManager={isManager} onCreate={() => setNoticeDate(today)} />
          </div>
        )}

        {activeView === 'admin' && (
          <div className="flex-1 overflow-y-auto">
            <AdminView entries={entries} notices={notices} roster={roster} monthLabel={monthLabel} onCreateNotice={() => setNoticeDate(today)} />
          </div>
        )}

        {(activeView === 'all' || activeView === 'mine') && (
          <>
            <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button onClick={goPrevMonth} className="rounded-full p-1.5 hover:bg-gray-100">
                    <ChevronLeft size={20} />
                  </button>
                  <h1 className="w-36 text-center text-xl font-bold text-gray-900">{monthLabel}</h1>
                  <button onClick={goNextMonth} className="rounded-full p-1.5 hover:bg-gray-100">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filterTeamId}
                    onChange={(e) => setFilterTeamId(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-600"
                  >
                    <option value="all">전체팀</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {RANK_GROUPS.map((g) => (
                  <span key={g.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} /> {g.label}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> 회의(공지)
                </span>
              </div>

              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 text-xs sm:text-sm">
                {WEEKDAY_LABELS.map((w, i) => (
                  <div
                    key={w}
                    className={`bg-gray-50 py-2 text-center font-medium ${i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {w}
                  </div>
                ))}
                {grid.map((d) => {
                  const dateStr = toDateStr(d)
                  const inMonth = d.getMonth() === month
                  const dayEntries = entriesByDate.get(dateStr) ?? []
                  const dayMeetingNotices = noticesForDate(dateStr).filter((n) => n.meeting_at)
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate

                  const badges: { key: string; label: string; cls: string }[] = [
                    ...dayMeetingNotices.map((n) => ({
                      key: `n-${n.id}`,
                      label: `회의 ${fmtTime(n.meeting_at as string)}`,
                      cls: 'bg-violet-50 text-violet-700 border-violet-300',
                    })),
                    ...dayEntries.map((e) => ({
                      key: e.id,
                      label: e.note ? `${e.profile_name} ${e.note}` : e.profile_name ?? '',
                      cls: rankGroupOf(e.profile_position).color,
                    })),
                  ]

                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate(dateStr)
                        setShowDayModal(true)
                      }}
                      className={`p-1.5 text-left align-top transition hover:bg-brand-50 ${
                        !inMonth ? 'bg-gray-50/60 opacity-40' : isSelected ? 'bg-brand-50' : 'bg-white'
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] sm:text-xs ${
                          isToday ? 'bg-brand-600 font-semibold text-white' : isSelected ? 'font-bold text-brand-700' : 'text-gray-700'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {badges.map((b) => (
                          <div key={b.key} className={`break-words rounded border px-1 py-0.5 text-[10px] font-medium leading-tight ${b.cls}`}>
                            {b.label}
                          </div>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </main>

            <div className="hidden h-full lg:block">
              <RightPanel
                dateStr={selectedDate}
                isToday={selectedDate === today}
                dayEntries={selectedEntries}
                dayNotices={selectedNotices}
                teams={teams}
                stores={stores}
                onGoToday={goToday}
                onOpenDetail={() => setShowDayModal(true)}
              />
            </div>
          </>
        )}
      </div>

      {showDayModal && (
        <DayDetailModal
          dateStr={selectedDate}
          entries={selectedEntries}
          notices={selectedNotices}
          onClose={() => setShowDayModal(false)}
          onChanged={() => loadMonth()}
          onOpenNotice={() => {
            setShowDayModal(false)
            setNoticeDate(selectedDate)
          }}
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
