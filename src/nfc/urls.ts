/**
 * 태그에 굽는 URL과 앱이 읽는 URL의 규칙.
 *
 * 형식: `<base>/?m=<무대id>&spot=<스팟id>`
 *
 * ⚠️ 실물 태그를 굽고 나면 base를 바꾸기 어렵다. 굽기 전에 프로덕션
 * 도메인을 확정하고 `.env`의 `VITE_TAG_BASE_URL`에 고정할 것.
 */

const FALLBACK_BASE = 'https://chak.pages.dev'

/** 태그에 기록할 때 쓰는 뿌리 주소. 배포 도메인으로 고정한다. */
export function tagBaseUrl(): string {
  const configured = import.meta.env.VITE_TAG_BASE_URL as string | undefined
  if (configured) return configured.replace(/\/+$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return FALLBACK_BASE
}

/** 물리 태그에 기록할 스팟 URL. */
export function spotUrl(stageId: string, spotId: string, base = tagBaseUrl()): string {
  return `${base}/?m=${encodeURIComponent(stageId)}&spot=${encodeURIComponent(spotId)}`
}

export interface TagRef {
  stageId: string | null
  spotId: string | null
}

/**
 * 임의 문자열에서 무대/스팟을 관대하게 추출.
 * 태그가 URL이 아닌 텍스트 레코드로 구워졌거나, 도메인이 바뀐 경우도 건진다.
 */
export function parseTagPayload(raw: string): TagRef {
  const s = (raw ?? '').trim()
  if (!s) return { stageId: null, spotId: null }

  try {
    const u = new URL(s)
    return {
      stageId: u.searchParams.get('m'),
      spotId: u.searchParams.get('spot'),
    }
  } catch {
    // URL이 아니면 쿼리스트링 조각으로 시도
  }

  const m = /(?:^|[?&])m=([^&\s]+)/.exec(s)
  const spot = /(?:^|[?&])spot=([^&\s]+)/.exec(s)
  return {
    stageId: m ? decodeURIComponent(m[1]) : null,
    spotId: spot ? decodeURIComponent(spot[1]) : null,
  }
}
