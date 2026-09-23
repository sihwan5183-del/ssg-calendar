import { DEFAULT_RANK_GROUPS, rankedName, type Profile, type RankInfo, type Store } from '../lib/types'

export default function MembersView({
  roster,
  stores,
  rankByProfileId,
  rankFallback,
  searchQuery,
}: {
  roster: Profile[]
  stores: Store[]
  rankByProfileId: Map<string, RankInfo>
  rankFallback: RankInfo
  searchQuery: string
}) {
  const storesById = new Map(stores.map((s) => [s.id, s]))

  const filtered = searchQuery
    ? roster.filter((p) => p.name.includes(searchQuery) || (p.position ?? '').includes(searchQuery))
    : roster

  const grouped = new Map<string, Profile[]>()
  for (const p of filtered) {
    const rank = rankByProfileId.get(p.id) ?? rankFallback
    if (!grouped.has(rank.key)) grouped.set(rank.key, [])
    grouped.get(rank.key)!.push(p)
  }
  const orderedGroups = DEFAULT_RANK_GROUPS.map((g) => g.key).filter((k) => grouped.has(k))

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900">구성원 ({filtered.length}명)</h1>
      <div className="space-y-6">
        {orderedGroups.map((key) => {
          const members = grouped.get(key)!
          const rank = rankByProfileId.get(members[0].id) ?? rankFallback
          return (
            <div key={key}>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                <span className={`h-2.5 w-2.5 rounded-full ${rank.dot}`} /> {rank.label} ({members.length}명)
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {members.map((m) => {
                  const mRank = rankByProfileId.get(m.id) ?? rankFallback
                  const store = m.storeId ? storesById.get(m.storeId) : undefined
                  return (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${mRank.color}`}>
                        {m.name.slice(-1)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{rankedName(mRank, m.name)}</p>
                        <p className="truncate text-xs text-gray-400">{store ? store.pos_name : m.position ?? ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>}
      </div>
    </div>
  )
}
