import type { Profile, Store, Team } from '../lib/types'

export default function MembersView({
  roster,
  stores,
  teams,
  searchQuery,
}: {
  roster: Profile[]
  stores: Store[]
  teams: Team[]
  searchQuery: string
}) {
  const storesById = new Map(stores.map((s) => [s.id, s]))
  const teamsById = new Map(teams.map((t) => [t.id, t]))

  const filtered = searchQuery
    ? roster.filter((p) => p.name.includes(searchQuery) || (p.position ?? '').includes(searchQuery))
    : roster

  const grouped = new Map<string, Profile[]>()
  for (const p of filtered) {
    const store = p.storeId ? storesById.get(p.storeId) : undefined
    const team = store?.team_id ? teamsById.get(store.team_id) : undefined
    const key = team?.name ?? '소속 미지정'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(p)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900">구성원 ({filtered.length}명)</h1>
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([teamName, members]) => (
          <div key={teamName}>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">{teamName}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {members.map((m) => {
                const store = m.storeId ? storesById.get(m.storeId) : undefined
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {m.name.slice(-1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{m.name}</p>
                      <p className="truncate text-xs text-gray-400">
                        {m.position ?? ''} {store && `· ${store.pos_name}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>}
      </div>
    </div>
  )
}
