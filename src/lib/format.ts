/** 획득 일시 → "7월 22일" */
export function formatDay(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 인증서용 — "2026년 7월 22일" */
export function formatFullDate(iso: string | Date = new Date()): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 일기 머리말 느낌의 짧은 날짜 — "七月 二十二日" 대신 읽기 쉬운 쪽으로 */
export function formatDiaryDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${weekday}요일`
}

/**
 * 진동 — 지원하지 않으면 조용히 무시.
 *
 * 콜드 탭으로 열린 페이지는 아직 사용자 제스처가 없어 브라우저가 vibrate를
 * 막고 콘솔에 경고를 남긴다. 미리 걸러 조용히 넘어간다.
 */
export function haptic(pattern: number | number[]) {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
    navigator.vibrate?.(pattern)
  } catch {
    /* noop */
  }
}
