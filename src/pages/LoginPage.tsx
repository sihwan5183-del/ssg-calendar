import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/AuthContext'
import { CalendarDays } from 'lucide-react'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!loginId || !password) return
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(loginId.trim(), password)
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
            <CalendarDays size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">SSG 캘린더</h1>
          <p className="text-sm text-gray-500">사내 팀 공유 캘린더</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">아이디</label>
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="ERP 계정 아이디"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="비밀번호"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>
          <p className="pt-1 text-center text-xs text-gray-400">기존 ERP(ssg-erp2) 계정으로 로그인합니다</p>
        </form>
      </div>
    </div>
  )
}
