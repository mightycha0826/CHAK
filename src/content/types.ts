/**
 * 표준 콘텐츠 스키마.
 *
 * 무대(Stage)가 박물관이든 사적지든 호텔이든, 소스가 공공 API든 손으로 쓴
 * 큐레이션이든 전부 이 형태로 정규화한다. 새 무대를 추가하려면
 * `content/stages/`에 파일 하나를 만들고 `content/index.ts`의 배열에
 * 한 줄 넣으면 끝이다.
 */

export type SpotKind = 'work' | 'person' | 'place'

export interface Spot {
  /** 태그 URL의 `?spot=` 값. 한 번 태그를 구우면 바꾸기 어렵다. */
  id: string
  kind: SpotKind
  title: string
  /** 한 줄 감성 카피 — 목록·히어로에 노출 */
  subtitle: string
  /** 전시 플래카드 메타 라인 (지정 등급 · 시대 · 구역) */
  meta: string
  /**
   * 제원표 — 도록 뒤편의 유물 목록 형식으로 그린다.
   *
   * ⚠️ 여기 적히는 건 **사실**이다. 확인되지 않은 수치·연도는 아예 넣지
   * 말 것. 대회 제출 전 현충사관리소 공식 자료로 한 번 더 대조할 것.
   */
  facts?: { label: string; value: string }[]
  /** 2~3문장 이야기 */
  story: string
  /** 관내 구역 */
  zone: string
  /** 도장에 새길 한 글자 (전서체 느낌의 한자/한글) */
  motif: string
  /** 수첩에 남기는 짧은 발췌문 — 획득 후 노출 */
  excerpt: string
  /** 출처 표기 */
  source?: string
  /**
   * 사진 키 (`src/content/photos.ts`). 없으면 검정 면으로 떨어진다.
   * 저작자·라이선스는 photos.ts에 함께 기록되어 화면에 노출된다.
   */
  photo?: string
  /** 사진이 잘리는 기준점 — 피사체가 남도록 (CSS object-position) */
  photoPosition?: string
}

export interface LatLng {
  lat: number
  lng: number
}

export interface StageMap {
  /** 도식 관내도용 0~100 좌표 (x, y 모두). 폴백이자 기본. */
  points: Record<string, { x: number; y: number }>
  /** 도식도에 얹는 구역 라벨 */
  zones?: { label: string; x: number; y: number }[]
  /** 도식도 배경 형태를 고르는 힌트 */
  terrain?: 'shrine' | 'indoor'
  /**
   * 카카오 지도용 실좌표. 있고 키가 유효하면 실지도로 렌더한다.
   * ⚠️ 아래 값들은 모두 근사값 — 현장에서 미세조정 필요.
   */
  geo?: {
    center: LatLng
    /** 카카오 확대 레벨 (작을수록 확대) */
    level: number
    points: Record<string, LatLng>
  }
}

/**
 * 무대 표지 사진.
 *
 * 없으면 검정 화면으로 그대로 떨어진다. 파일이 없거나 로드에 실패해도
 * 마찬가지 — 발표장에서 이미지 하나 때문에 첫 화면이 깨지면 안 된다.
 */
export interface StageCover {
  /** 사진 키 (`src/content/photos.ts`) */
  photo: string
  /**
   * 세로 화면에 가로 사진을 담으면 좌우가 잘린다. 피사체(동상·건물)가
   * 남도록 잘리는 기준점을 지정한다. CSS object-position 값.
   */
  position?: string
}

export interface Stage {
  /** 태그 URL의 `?m=` 값 */
  id: string
  name: string
  subtitle: string
  region: string
  /** 온보딩·인증서에 쓰는 한 줄 소개 */
  intro: string
  /** 완주 인증서 제목 */
  certificateTitle: string
  /** 출처·크레딧 표기 */
  credit: string
  /** 온보딩 표지 사진 (선택) */
  cover?: StageCover
  spots: Spot[]
  map: StageMap
}

/**
 * 카테고리 메타.
 *
 * 색은 일부러 없다. 이 앱에서 색은 인주(수집 상태) 하나뿐이고, 분류는
 * 글자로만 구분한다. 분류마다 색을 주면 화면이 알록달록해지고 정작
 * 「모았다/안 모았다」라는 유일하게 중요한 신호가 묻힌다.
 */
export const KIND: Record<SpotKind, { label: string }> = {
  work: { label: '유물' },
  person: { label: '인물' },
  place: { label: '장소' },
}
