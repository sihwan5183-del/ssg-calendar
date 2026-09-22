import { Megaphone, Video, Plus } from 'lucide-react'
import type { Notice } from '../lib/types'

export default function NoticesView({
  notices,
  searchQuery,
  isManager,
  onCreate,
}: {
  notices: Notice[]
  searchQuery: string
  isManager: boolean
  onCreate: () => void
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
        {filtered.map((n) => (
          <div key={n.id} className={`rounded-xl border p-4 ${n.is_important ? 'border-rose-200 bg-rose-50' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.is_important ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Megaphone size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <span className="shrink-0 text-xs text-gray-400">{n.start_date}</span>
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
        ))}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-400">공지가 없습니다.</p>}
      </div>
    </div>
  )
}
