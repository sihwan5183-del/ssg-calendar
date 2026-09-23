import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'
import type { Notice, RankInfo, ScheduleEntry } from '../lib/types'
import { rankedName } from '../lib/types'
import { useAuth } from '../lib/AuthContext'
import { Video, Trash2, Pencil, Megaphone, Plus } from 'lucide-react'

export default function DayDetailModal({
  rankByProfileId,
  rankFallback,
  dateStr,
  entries,
  notices,
  onClose,
  onChanged,
  onOpenNotice,
}: {
  rankByProfileId: Map<string, RankInfo>
  rankFallback: RankInfo
  dateStr: string
  entries: ScheduleEntry[]
  notices: Notice[]
  onClose: () => void
  onChanged: () => void
  onOpenNotice: () => void
}) {
  const { profile, isManager } = useAuth()
  const myEntry = entries.find((e) => e.profile_id === profile?.id)
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(myEntry?.note ?? '')
  const [saving, setSaving] = useState(false)

  const label = new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  const startEdit = () => {
    setNote(myEntry?.note ?? '')
    setEditing(true)
  }

  const save = async () => {
    if (!profile || !note.trim()) return
    setSaving(true)
    if (myEntry) {
      await supabase.from('schedule_entries').update({ note: note.trim() }).eq('id', myEntry.id)
    } else {
      await supabase.from('schedule_entries').insert({
        profile_id: profile.id,
        entry_date: dateStr,
        status: 'other',
        note: note.trim(),
        created_by: profile.id,
      })
    }
    setSaving(false)
    setEditing(false)
    onChanged()
  }

  const remove = async () => {
    if (!myEntry) return
    setSaving(true)
    await supabase.from('schedule_entries').delete().eq('id', myEntry.id)
    setSaving(false)
    setEditing(false)
    onChanged()
  }

  return (
    <Modal title={label} onClose={onClose} size="xl">
      <div className="space-y-5">
        {notices.length > 0 && (
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className={`rounded-xl border p-3 ${n.is_important ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-start gap-2">
                  <Megaphone size={16} className={n.is_important ? 'mt-0.5 text-amber-600' : 'mt-0.5 text-gray-500'} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    {n.meeting_at && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(n.meeting_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {n.content && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{n.content}</p>}
                    {n.zoom_link && (
                      <a
                        href={n.zoom_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        <Video size={14} /> 줌 회의 참여
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">일정 ({entries.length})</h3>
            <div className="flex items-center gap-3">
              {!myEntry && !editing && (
                <button onClick={startEdit} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                  <Plus size={13} /> 내 일정 추가
                </button>
              )}
              {isManager && (
                <button onClick={onOpenNotice} className="text-xs font-medium text-brand-600 hover:underline">
                  + 공지 등록
                </button>
              )}
            </div>
          </div>

          {editing && (
            <div className="mb-2 space-y-3 rounded-xl border border-gray-200 p-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 휴무, 연차, 외부감사 회의, 민석 결혼식 등 자유롭게 입력"
                rows={3}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving || !note.trim()}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  저장
                </button>
                <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
                  취소
                </button>
              </div>
            </div>
          )}

          {entries.length === 0 && !editing && (
            <p className="rounded-xl border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">등록된 일정이 없습니다.</p>
          )}

          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {entries.map((e) => {
              const rank = rankByProfileId.get(e.profile_id) ?? rankFallback
              const isMine = e.profile_id === profile?.id
              return (
                <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${rank.dot}`} />
                    <span className="truncate">
                      <span className="font-medium text-gray-800">{rankedName(rank, e.profile_name ?? '')}</span>
                      {e.note && <span className="text-gray-600">_{e.note}</span>}
                    </span>
                  </span>
                  {isMine && !editing && (
                    <span className="flex shrink-0 gap-1">
                      <button onClick={startEdit} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Pencil size={14} />
                      </button>
                      <button onClick={remove} className="rounded-full p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Modal>
  )
}
