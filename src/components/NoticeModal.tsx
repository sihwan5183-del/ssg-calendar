import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'
import { sendNoticePushNow } from '../lib/push'
import type { NoticeScope, Profile, Store, Team } from '../lib/types'
import { useAuth } from '../lib/AuthContext'

export default function NoticeModal({
  dateStr,
  teams,
  stores,
  roster,
  onClose,
  onSaved,
}: {
  dateStr: string
  teams: Team[]
  stores: Store[]
  roster: Profile[]
  onClose: () => void
  onSaved: () => void
}) {
  const { profile } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [zoomLink, setZoomLink] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [remindMorning, setRemindMorning] = useState(true)
  const [scope, setScope] = useState<NoticeScope>('all')
  const [teamIds, setTeamIds] = useState<string[]>([])
  const [storeIds, setStoreIds] = useState<string[]>([])
  const [personIds, setPersonIds] = useState<string[]>([])
  const [personQuery, setPersonQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) => {
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  }

  const filteredRoster = personQuery ? roster.filter((p) => p.name.includes(personQuery)) : roster.slice(0, 20)

  const submit = async () => {
    if (!title.trim() || !profile) {
      setError('제목을 입력해주세요.')
      return
    }
    if (scope === 'by_team' && teamIds.length === 0) {
      setError('대상 팀을 선택해주세요.')
      return
    }
    if (scope === 'by_store' && storeIds.length === 0) {
      setError('대상 매장을 선택해주세요.')
      return
    }
    if (scope === 'by_person' && personIds.length === 0) {
      setError('대상 인원을 선택해주세요.')
      return
    }
    setSaving(true)
    setError(null)
    const meetingAt = meetingTime ? new Date(`${dateStr}T${meetingTime}:00+09:00`).toISOString() : null
    const { data, error: insertErr } = await supabase
      .from('notices')
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: profile.id,
        start_date: dateStr,
        end_date: dateStr,
        meeting_at: meetingAt,
        zoom_link: zoomLink.trim() || null,
        is_important: isImportant,
        remind_morning_of: remindMorning,
        scope,
        target_team_ids: scope === 'by_team' ? teamIds : [],
        target_store_ids: scope === 'by_store' ? storeIds : [],
        target_profile_ids: scope === 'by_person' ? personIds : [],
      })
      .select('id')
      .single()

    if (insertErr || !data) {
      setSaving(false)
      setError('공지 등록에 실패했습니다: ' + insertErr?.message)
      return
    }

    await sendNoticePushNow(data.id)
    setSaving(false)
    onSaved()
  }

  return (
    <Modal title="공지 등록" onClose={onClose} size="xl">
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 (예: 전체 회의)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">회의 시간 (선택)</label>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-[2]">
            <label className="mb-1 block text-xs font-medium text-gray-500">줌 링크 (선택)</label>
            <input
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">알림 대상</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { v: 'all', l: '전체' },
              { v: 'by_team', l: '팀별' },
              { v: 'by_store', l: '매장별' },
              { v: 'by_person', l: '개인별' },
            ].map((s) => (
              <button
                key={s.v}
                onClick={() => setScope(s.v as NoticeScope)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  scope === s.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500'
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>

        {scope === 'by_team' && (
          <div className="flex flex-wrap gap-1.5">
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => toggle(teamIds, setTeamIds, t.id)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  teamIds.includes(t.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {scope === 'by_store' && (
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-gray-100 p-2">
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(storeIds, setStoreIds, s.id)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  storeIds.includes(s.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500'
                }`}
              >
                {s.pos_name}
              </button>
            ))}
          </div>
        )}

        {scope === 'by_person' && (
          <div>
            <input
              value={personQuery}
              onChange={(e) => setPersonQuery(e.target.value)}
              placeholder="이름 검색"
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {personIds.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {personIds.map((id) => {
                  const p = roster.find((r) => r.id === id)
                  return (
                    <span key={id} className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">
                      {p?.name ?? id} ✕
                    </span>
                  )
                })}
              </div>
            )}
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-gray-100 p-2">
              {filteredRoster.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggle(personIds, setPersonIds, p.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    personIds.includes(p.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} />
            중요 공지로 표시
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={remindMorning} onChange={(e) => setRemindMorning(e.target.checked)} />
            당일 오전에 알림 다시 보내기
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? '등록 중...' : '공지 등록 및 알림 발송'}
        </button>
      </div>
    </Modal>
  )
}
