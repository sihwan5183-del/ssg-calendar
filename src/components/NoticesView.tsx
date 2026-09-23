import { Megaphone, Video, Plus, Pencil, Trash2 } from 'lucide-react'
import type { Notice } from '../lib/types'

export default function NoticesView({
  notices,
  searchQuery,
  isManager,
  myProfileId,
  isAdmin,
  onCreate,
  onEdit,
  onDelete,
}: {
  notices: Notice[]
  searchQuery: string
  isManager: boolean
  myProfileId?: string
  isAdmin: boolean
  onCreate: () => void
  onEdit: (n: Notice) => void
  onDelete: (n: Notice) => void
}) {
  const filtered = (searchQuery ? notices.filter((n) => n.title.includes(searchQuery) || n.content.includes(searchQuery)) : notices)
    .slice()
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1))

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">공지 ({filtered.length})</h1>
        {isManager && (
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={15} /> 공지 작성
          </button>
        )}
      </div>
      <div className="space-y-2.5">
        {filtered.map((n) => {
          const canEdit = n.author_id === myProfileId || isAdmin
          return (
          <div key={n.id} className={`rounded-xl border p-4 ${n.is_important ? 'border-rose-200 bg-rose-50' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.is_important ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Megaphone size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-gray-400">{n.start_date}</span>
                    {canEdit && (
                      <>
                        <button onClick={() => onEdit(n)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('이 공지를 삭제할까요?')) onDelete(n)
                          }}
                          className="rounded-full p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </span>
                </div>
                {n.content && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{n.content}</p>}
                {n.meeting_at && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    회의 시간: {new Date(n.meeting_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </p>
                )}
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
            </div>
          </div>
          )
        })}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-400">공지가 없습니다.</p>}
      </div>
    </div>
  )
}
