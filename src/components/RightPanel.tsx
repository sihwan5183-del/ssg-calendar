import { Clock, Users, Video, Megaphone, Plus } from 'lucide-react'
import type { Notice, RankInfo, ScheduleEntry, Team, Store } from '../lib/types'
import { rankedName } from '../lib/types'

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function audienceLabel(n: Notice, teams: Team[], stores: Store[]) {
  if (n.scope === 'all') return '전체 인원'
  if (n.scope === 'by_team') return `${n.target_team_ids.map((id) => teams.find((t) => t.id === id)?.name).filter(Boolean).join(', ') || '팀'} 대상`
  if (n.scope === 'by_store') return `${n.target_store_ids.map((id) => stores.find((s) => s.id === id)?.pos_name).filter(Boolean).join(', ') || '매장'} 대상`
  return `참석자 ${n.target_profile_ids.length}명`
}

export default function RightPanel({
  rankByProfileId,
  rankFallback,
  dateStr,
  isToday,
  dayEntries,
  dayNotices,
  teams,
  stores,
  onGoToday,
  onOpenDetail,
}: {
  rankByProfileId: Map<string, RankInfo>
  rankFallback: RankInfo
  dateStr: string
  isToday: boolean
  dayEntries: ScheduleEntry[]
  dayNotices: Notice[]
  teams: Team[]
  stores: Store[]
  onGoToday: () => void
  onOpenDetail: () => void
}) {
  const label = new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
  const prefix = isToday ? '오늘' : `${new Date(dateStr).getDate()}일`
  const meetings = dayNotices.filter((n) => n.meeting_at)
  const important = dayNotices.filter((n) => n.is_important)

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-100">{label}</h2>
        {!isToday && (
          <button onClick={onGoToday} className="shrink-0 rounded-full border border-gray-700 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-800">
            오늘로 이동
          </button>
        )}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">
            {prefix} 부재 <span className="text-gray-500">({dayEntries.length})</span>
          </h3>
          {dayEntries.length > 0 && (
            <button onClick={onOpenDetail} className="text-xs font-medium text-brand-500 hover:underline">
              더보기 &gt;
            </button>
          )}
        </div>
        {dayEntries.length === 0 ? (
          <p className="rounded-lg bg-gray-950 px-3 py-3 text-xs text-gray-500">등록된 일정이 없습니다.</p>
        ) : (
          <ul className="space-y-1.5">
            {dayEntries.slice(0, 5).map((e) => {
              const rank = rankByProfileId.get(e.profile_id) ?? rankFallback
              return (
                <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${rank.dot}`} />
                    <span className="truncate font-medium text-gray-200">{rankedName(rank, e.profile_name ?? '')}</span>
                  </span>
                  <span className="truncate text-xs text-gray-500">{e.note}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">
            {prefix} 회의 <span className="text-gray-500">({meetings.length})</span>
          </h3>
          {meetings.length > 0 && (
            <button onClick={onOpenDetail} className="text-xs font-medium text-brand-500 hover:underline">
              더보기 &gt;
            </button>
          )}
        </div>
        <div className="space-y-2">
          {meetings.slice(0, 2).map((n) => (
            <div key={n.id} className="rounded-xl border-l-4 border-violet-500 bg-violet-950/40 p-3">
              <p className="text-sm font-semibold text-gray-100">{n.title}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                <Clock size={13} /> {fmtTime(n.meeting_at as string)}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Users size={13} /> {audienceLabel(n, teams, stores)}
              </p>
              {n.zoom_link && (
                <a
                  href={n.zoom_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                >
                  <Video size={13} /> Zoom 참여
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">
            중요 공지 <span className="text-gray-500">({important.length})</span>
          </h3>
          {important.length > 0 && (
            <button onClick={onOpenDetail} className="text-xs font-medium text-brand-500 hover:underline">
              더보기 &gt;
            </button>
          )}
        </div>
        <div className="space-y-2">
          {important.slice(0, 2).map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl bg-rose-950/50 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                <Megaphone size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-100">{n.title}</p>
                {n.content && <p className="mt-0.5 truncate text-xs text-gray-500">{n.content}</p>}
                <button onClick={onOpenDetail} className="mt-2 rounded-full bg-gray-900 px-3 py-1 text-[11px] font-medium text-gray-300 shadow-sm hover:bg-gray-800">
                  공지 확인
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={onOpenDetail}
        className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <Plus size={16} /> 일정 등록
      </button>
    </aside>
  )
}
