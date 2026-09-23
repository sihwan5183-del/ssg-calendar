import { useState } from 'react'
import { Plus, CalendarDays, Megaphone, Users, Palette } from 'lucide-react'
import type { Notice, Profile, ScheduleEntry } from '../lib/types'
import RankSettingsPanel from './RankSettingsPanel'

export default function AdminView({
  entries,
  notices,
  roster,
  monthLabel,
  onCreateNotice,
  rankSettings,
  rankOverrides,
  onRankChanged,
}: {
  entries: ScheduleEntry[]
  notices: Notice[]
  roster: Profile[]
  monthLabel: string
  onCreateNotice: () => void
  rankSettings: { key: string; label: string; color_key: string }[]
  rankOverrides: { profile_id: string; rank_key: string }[]
  onRankChanged: () => void
}) {
  const [tab, setTab] = useState<'summary' | 'rank'>('summary')

  const stats = [
    { label: `${monthLabel} 등록된 일정`, value: entries.length, icon: CalendarDays },
    { label: `${monthLabel} 공지`, value: notices.length, icon: Megaphone },
    { label: '재직 중 구성원', value: roster.length, icon: Users },
  ]

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">관리자</h1>
        {tab === 'summary' && (
          <button
            onClick={onCreateNotice}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={15} /> 공지 작성
          </button>
        )}
      </div>

      <div className="mb-5 flex gap-1 border-b border-gray-100">
        <button
          onClick={() => setTab('summary')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
            tab === 'summary' ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-400'
          }`}
        >
          <CalendarDays size={15} /> 요약
        </button>
        <button
          onClick={() => setTab('rank')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
            tab === 'rank' ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-400'
          }`}
        >
          <Palette size={15} /> 직급 색상 설정
        </button>
      </div>

      {tab === 'summary' ? (
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border border-gray-100 p-4">
                <Icon size={18} className="mb-2 text-brand-500" />
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="mt-0.5 text-xs text-gray-400">{s.label}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <RankSettingsPanel roster={roster} rankSettings={rankSettings} overrides={rankOverrides} onChanged={onRankChanged} />
      )}
    </div>
  )
}
