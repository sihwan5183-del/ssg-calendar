export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return toDateStr(new Date())
}

// 월요일 시작 6주(42일) 그리드
export function getMonthGrid(year: number, month: number /* 0-based */): Date[] {
  const first = new Date(year, month, 1)
  const firstWeekday = (first.getDay() + 6) % 7 // 0=월요일
  const start = new Date(year, month, 1 - firstWeekday)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export function formatYm(year: number, month: number) {
  return `${year}년 ${month + 1}월`
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}
