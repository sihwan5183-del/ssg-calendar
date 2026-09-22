import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'
import { ENTRY_CATEGORIES, categoryOf, type EntryStatus, type Notice, type ScheduleEntry } from '../lib/types'
import { useAuth } from '../lib/AuthContext'
import { Video, Trash2, Pencil, Megaphone } from 'lucide-react'

export default function DayDetailModal({
  dateStr,
  entries,
  notices,
  onClose,
  onChanged,
  onOpenNotice,
}: {
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
  const [status, setStatus] = useState<EntryStatus>(myEntry?.status ?? 'annual')
  const [note, setNote] = useState(myEntry?.note ?? '')
  const [saving, setSaving] = useState(false)

  const label = new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  const save = async () => {
    if (!profile) return
    setSaving(true)
    if (myEntry) {
      await supabase.from('schedule_entries').update({ status, note: note || null }).eq('id', myEntry.id)
    } else {
      await supabase.from('schedule_entries').insert({
        profile_id: profile.id,
        entry_date: dateStr,
        status,
        note: note || null,
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

  const others = entries.filter((e) => e.profile_id !== profile?.id)

  return (
    <Modal title={label} onClose={onClose}>
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
            <h3 className="text-sm font-medium text-gray-500">내 일정</h3>
            {isManager && (
              <button onClick={onOpenNotice} className="text-xs font-medium text-brand-600 hover:underline">
                + 공지 등록
              </button>
            )}
          </div>

          {!editing && myEntry && (
            <div className={`flex items-center justify-between rounded-xl border p-3 ${categoryOf(myEntry.status).color}`}>
              <div>
                <span className="text-sm font-semibold">{categoryOf(myEntry.status).label}</span>
                {myEntry.note && <p className="mt-0.5 text-xs opacity-80">{myEntry.note}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(true)} className="rounded-full p-1.5 hover:bg-white/60">
                  <Pencil size={15} />
                </button>
                <button onClick={remove} className="rounded-full p-1.5 hover:bg-white/60">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )}

          {!editing && !myEntry && (
            <button
              onClick={() => setEditing(true)}
              className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600"
            >
              + 내 일정 등록 (휴무·연차·휴가·회의 등)
            </button>
          )}

          {editing && (
            <div className="space-y-3 rounded-xl border border-gray-200 p-3">
              <div className="flex flex-wrap gap-1.5">
                {ENTRY_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setStatus(c.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      status === c.value ? c.color + ' ring-2 ring-offset-1' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="메모 (선택)"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
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
        </div>

        {others.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500">다른 직원 일정 ({others.length})</h3>
            <ul className="space-y-1.5">
              {others.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-800">
                    {e.profile_name} {e.store_name && <span className="text-xs text-gray-400">· {e.store_name}</span>}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryOf(e.status).color}`}>{categoryOf(e.status).label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
