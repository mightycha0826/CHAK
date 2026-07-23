import { useSyncExternalStore } from 'react'
import { spotCode, type CardData } from '../chak/card.ts'
import type { Spot } from '../content/index.ts'

/**
 * 답사 진행 상태.
 *
 * ⚠️ 진실의 원천은 착 카드다. 관람객은 착을 들고 지점을 돌고, 각 지점 리더가
 * 카드에 방문 기록을 쓴다. 앱은 착을 폰에 댈 때 그 누적분을 읽어 등록한다.
 *
 * 그래서 여기 localStorage는 **캐시**다 — 착을 손에 들고 있지 않아도 마지막으로
 * 등록한 진행 상황을 보여주기 위한 것이지, 기록이 태어나는 곳이 아니다.
 * 카드를 다시 대면 카드 쪽이 항상 이긴다.
 *
 * 방문 시각도 등록 시각이 아니라 **카드에 찍힌 현장 시각**을 쓴다. 관람객이
 * 집에 가서 등록해도 수첩에는 현충사에서 찍은 시각이 남는다.
 */

const KEY = 'chak.progress.v1'

interface Persisted {
  /** 무대 → (스팟 → 방문 일시 ISO) */
  byStage: Record<string, Record<string, string>>
  /** 무대 → 온보딩을 지났는지 */
  started: Record<string, boolean>
  /** 무대 → 완주 인증서를 이미 봤는지 */
  celebrated: Record<string, boolean>
  /** 무대 → 마지막으로 등록한 착의 UID */
  cardSerial: Record<string, string>
}

const EMPTY: Persisted = { byStage: {}, started: {}, celebrated: {}, cardSerial: {} }

function load(): Persisted {
  if (typeof localStorage === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      byStage: parsed.byStage ?? {},
      started: parsed.started ?? {},
      celebrated: parsed.celebrated ?? {},
      cardSerial: parsed.cardSerial ?? {},
    }
  } catch {
    return EMPTY
  }
}

let state: Persisted = load()
const listeners = new Set<() => void>()

function commit(next: Persisted) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 사파리 프라이빗 모드 등 — 저장 실패해도 이번 세션은 계속 동작한다 */
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** 한 무대에서 모은 도장. `{ 스팟id: 방문일시ISO }` */
export function collectedIn(stageId: string): Record<string, string> {
  return state.byStage[stageId] ?? {}
}

export function hasStarted(stageId: string): boolean {
  return !!state.started[stageId]
}

export function hasCelebrated(stageId: string): boolean {
  return !!state.celebrated[stageId]
}

export function cardSerialFor(stageId: string): string | null {
  return state.cardSerial[stageId] ?? null
}

export function markStarted(stageId: string) {
  if (state.started[stageId]) return
  commit({ ...state, started: { ...state.started, [stageId]: true } })
}

export function markCelebrated(stageId: string) {
  if (state.celebrated[stageId]) return
  commit({ ...state, celebrated: { ...state.celebrated, [stageId]: true } })
}

export interface RegisterResult {
  /** 이번 등록으로 처음 들어온 스팟 id들 — 도장 연출은 이것만 보여준다 */
  added: string[]
  /** 카드에 있던 전체 방문 수 */
  total: number
  /** 카드 슬롯이 무대 지점과 어긋났는지 (콘텐츠를 고쳤는데 카드가 구형) */
  mismatched: boolean
}

/**
 * 착 카드에서 읽은 방문 기록을 등록한다.
 *
 * 슬롯 순서는 무대의 `spots` 배열 순서와 1:1로 대응한다. 슬롯에 새겨진 4글자
 * 코드까지 대조해서, 콘텐츠를 고친 뒤 옛 카드를 댔을 때 엉뚱한 지점에 도장이
 * 찍히는 사고를 막는다.
 */
export function registerCard(
  stageId: string,
  spots: Spot[],
  card: CardData,
  serial: string | null,
): RegisterResult {
  const current = collectedIn(stageId)
  const next: Record<string, string> = { ...current }
  const added: string[] = []
  let total = 0
  let mismatched = false

  card.slots.forEach((visit, i) => {
    if (!visit) return
    total++

    const spot = spots[i]
    // 슬롯 수가 다르거나 코드가 안 맞으면 배치가 바뀐 옛 카드다. 조용히
    // 무시하되 호출부가 안내를 띄울 수 있게 표시한다.
    if (!spot || spotCode(spot.id) !== visit.code) {
      mismatched = true
      return
    }

    const at = visit.at.toISOString()
    if (!current[spot.id]) added.push(spot.id)
    // 카드가 진실이므로 시각도 카드 쪽으로 덮어쓴다
    next[spot.id] = at
  })

  commit({
    ...state,
    started: { ...state.started, [stageId]: true },
    byStage: { ...state.byStage, [stageId]: next },
    cardSerial: serial ? { ...state.cardSerial, [stageId]: serial } : state.cardSerial,
  })

  return { added, total, mismatched }
}

/** 발표 시연용 — 지정한 스팟들만 방문 상태로 만든다. 카드 없이 상태만 조작. */
export function applyPreset(stageId: string, spotIds: string[]) {
  const now = new Date().toISOString()
  const next: Record<string, string> = {}
  const current = collectedIn(stageId)
  for (const id of spotIds) next[id] = current[id] ?? now

  commit({
    ...state,
    started: { ...state.started, [stageId]: spotIds.length > 0 },
    celebrated: { ...state.celebrated, [stageId]: false },
    byStage: { ...state.byStage, [stageId]: next },
  })
}

/** 현재 무대만 초기화. 다른 무대 진행은 건드리지 않는다. */
export function resetStage(stageId: string) {
  commit({
    ...state,
    byStage: { ...state.byStage, [stageId]: {} },
    started: { ...state.started, [stageId]: false },
    celebrated: { ...state.celebrated, [stageId]: false },
    cardSerial: { ...state.cardSerial, [stageId]: '' },
  })
}

/** 컴포넌트에서 진행 상태를 구독한다. */
export function useProgressSnapshot(): Persisted {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  )
}
