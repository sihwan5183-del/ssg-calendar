import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_RANK_GROUPS, RANK_COLOR_PALETTE, autoRankKey, paletteOf, rankedName, type Profile, type RankGroupKey } from '../lib/types'

type RankSettingRow = { key: string; label: string; color_key: string }
type OverrideRow = { profile_id: string; rank_key: string }

export default function RankSettingsPanel({
  roster,
  rankSettings,
  overrides,
  onChanged,
}: {
  roster: Profile[]
  rankSettings: RankSettingRow[]
  overrides: OverrideRow[]
  onChanged: () => void
}) {
  const [query, setQuery] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const settingsByKey = new Map(rankSettings.map((r) => [r.key, r]))
  const overrideByProfile = new Map(overrides.map((o) => [o.profile_id, o.rank_key]))

  const groups = DEFAULT_RANK_GROUPS.map((g) => {
    const row = settingsByKey.get(g.key)
    return { key: g.key, label: row?.label ?? g.label, colorKey: row?.color_key ?? g.colorKey }
  })

  const changeGroupColor = async (key: string, colorKey: string) => {
    setSavingKey(key)
    setError(null)
    const { error: err } = await supabase.schema('calendar_app').from('rank_settings').update({ color_key: colorKey }).eq('key', key)
    if (err) setError(`저장 실패: ${err.message}`)
    setSavingKey(null)
    onChanged()
  }

  const changePersonRank = async (profileId: string, rankKey: string) => {
    setSavingKey(profileId)
    setError(null)
    const { error: err } =
      rankKey === 'auto'
        ? await supabase.schema('calendar_app').from('person_rank_overrides').delete().eq('profile_id', profileId)
        : await supabase.schema('calendar_app').from('person_rank_overrides').upsert({ profile_id: profileId, rank_key: rankKey })
    if (err) setError(`저장 실패: ${err.message}`)
    setSavingKey(null)
    onChanged()
  }

  const filtered = query ? roster.filter((p) => p.name.includes(query) || (p.position ?? '').includes(query)) : roster

  return (
    <div className="space-y-8">
      {error && <div className="rounded-lg bg-rose-950/60 px-3 py-2 text-sm text-rose-300">{error}</div>}
      <section>
        <h2 className="mb-1 text-base font-semibold text-gray-100">그룹별 색상</h2>
        <p className="mb-3 text-xs text-gray-500">캘린더에서 이 색으로 표시됩니다. 인사이동으로 그룹 구성이 바뀌어도 색은 그대로 유지돼요.</p>
        <div className="space-y-2">
          {groups.map((g) => {
            const pal = paletteOf(g.colorKey)
            return (
              <div key={g.key} className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 p-3">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-200">
                  <span className={`h-3 w-3 rounded-full ${pal.dot}`} /> {g.label}
                </span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {RANK_COLOR_PALETTE.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => changeGroupColor(g.key, c.key)}
                      disabled={savingKey === g.key}
                      title={c.name}
                      className={`h-6 w-6 rounded-full ${c.swatch} ${g.colorKey === c.key ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-gray-300' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-gray-100">직원별 그룹 지정</h2>
        <p className="mb-3 text-xs text-gray-500">
          기본은 직급명으로 자동 판단됩니다. 인사이동 등으로 다르게 지정하고 싶으면 여기서 직접 바꿔주세요.
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 또는 직급 검색"
          className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-brand-400 focus:outline-none"
        />
        <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
          {filtered.map((p) => {
            const auto = autoRankKey(p.position)
            const effective = (overrideByProfile.get(p.id) ?? auto) as RankGroupKey
            const isOverridden = overrideByProfile.has(p.id)
            const effectiveLabel = settingsByKey.get(effective)?.label ?? DEFAULT_RANK_GROUPS.find((g) => g.key === effective)?.label ?? effective
            return (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-200">{rankedName({ label: effectiveLabel }, p.name)}</p>
                  <p className="truncate text-xs text-gray-500">
                    {p.position ?? '직급 없음'}
                    {isOverridden && <span className="ml-1 text-brand-500">· 수동 지정됨</span>}
                  </p>
                </div>
                <select
                  value={effective}
                  onChange={(e) => changePersonRank(p.id, e.target.value)}
                  disabled={savingKey === p.id}
                  className="shrink-0 rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-gray-300"
                >
                  {DEFAULT_RANK_GROUPS.map((g) => (
                    <option key={g.key} value={g.key}>
                      {settingsByKey.get(g.key)?.label ?? g.label}
                    </option>
                  ))}
                </select>
                {isOverridden && (
                  <button
                    onClick={() => changePersonRank(p.id, 'auto')}
                    disabled={savingKey === p.id}
                    className="shrink-0 text-xs text-gray-500 hover:text-gray-300"
                  >
                    자동으로
                  </button>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && <p className="py-6 text-center text-sm text-gray-500">검색 결과가 없습니다.</p>}
        </div>
      </section>
    </div>
  )
}
