// `.ts` 확장자를 명시하는 이유: scripts/card-tool.mjs가 이 파일을 Node에서
// 직접 import해 착 카드의 슬롯 배치를 계산한다. Node ESM은 확장자를 요구한다.
import type { Spot, Stage } from './types.ts'
import { hyeonchungsa } from './stages/hyeonchungsa.ts'
import { shillastay } from './stages/shillastay.ts'

/** 무대 레지스트리. 새 무대 추가 = 여기 한 줄. */
export const STAGES: Stage[] = [hyeonchungsa, shillastay]

export const DEFAULT_STAGE_ID = hyeonchungsa.id

export function findStage(id: string | null | undefined): Stage | null {
  if (!id) return null
  return STAGES.find((s) => s.id === id) ?? null
}

export function stageOrDefault(id: string | null | undefined): Stage {
  return findStage(id) ?? hyeonchungsa
}

export function findSpot(stage: Stage, id: string | null | undefined): Spot | null {
  if (!id) return null
  return stage.spots.find((s) => s.id === id) ?? null
}

/** 어떤 무대에 속한 스팟인지 전체 무대에서 역추적. 콜드 탭 처리에 쓴다. */
export function locateSpot(spotId: string): { stage: Stage; spot: Spot } | null {
  for (const stage of STAGES) {
    const spot = stage.spots.find((s) => s.id === spotId)
    if (spot) return { stage, spot }
  }
  return null
}

export * from './types.ts'
