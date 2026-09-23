import { CalendarDays, User, Megaphone, Users, Settings } from 'lucide-react'

export type ViewKey = 'all' | 'mine' | 'notices' | 'members' | 'admin'

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof CalendarDays; managerOnly?: boolean }[] = [
  { key: 'all', label: '전체 일정', icon: CalendarDays },
  { key: 'mine', label: '내 일정', icon: User },
  { key: 'notices', label: '공지', icon: Megaphone },
  { key: 'members', label: '구성원', icon: Users },
  { key: 'admin', label: '관리자', icon: Settings, managerOnly: true },
]

export default function Sidebar({
  active,
  onChange,
  isManager,
}: {
  active: ViewKey
  onChange: (v: ViewKey) => void
  isManager: boolean
}) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-gray-800 bg-gray-900 px-3 py-4">
      <nav className="space-y-1">
        {NAV_ITEMS.filter((item) => !item.managerOnly || isManager).map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-500/15 text-brand-500' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center pt-8 text-center">
        <svg width="96" height="72" viewBox="0 0 96 72" fill="none" className="mb-3 opacity-90">
          <rect x="8" y="40" width="18" height="28" rx="3" fill="#DBE6FE" />
          <circle cx="17" cy="28" r="9" fill="#3B6FE0" />
          <rect x="30" y="30" width="20" height="38" rx="3" fill="#3B6FE0" />
          <circle cx="40" cy="16" r="10" fill="#2F59C4" />
          <rect x="56" y="40" width="18" height="28" rx="3" fill="#DBE6FE" />
          <circle cx="65" cy="28" r="9" fill="#3B6FE0" />
        </svg>
        <p className="text-xs leading-relaxed text-gray-500">
          좋은 팀이
          <br />
          좋은 결과를 만듭니다.
        </p>
      </div>
    </aside>
  )
}
