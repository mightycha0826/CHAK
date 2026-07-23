import { motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import Icon from './Icon.tsx'

interface Props {
  stage: Stage
  collected: Record<string, string>
  onPick: (spotId: string) => void
  /** 핀 옆에 이름표를 붙일지 (작은 지도에서는 끈다) */
  labels?: boolean
}

/**
 * 도식 관내도.
 *
 * 실내는 GPS로 층·방을 구분할 수 없다(카카오 실내지도는 별도 계약). 손으로
 * 찍은 배치도가 실지도보다 정확하고 정직하다. 카카오 키가 없거나 로드에
 * 실패했을 때의 폴백이기도 하다.
 *
 * 배경은 SVG, 핀은 실제 button. 접근성과 애니메이션 양쪽에서 유리하다.
 */
export default function SchematicMap({ stage, collected, onPick, labels = true }: Props) {
  const { points, zones = [] } = stage.map

  const route = stage.spots
    .map((s) => points[s.id])
    .filter(Boolean)
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <polyline
          points={route}
          fill="none"
          stroke="var(--color-line-2)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {labels &&
        zones.map((zone) => (
          <div
            key={zone.label}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-semibold text-ink-3"
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
          >
            {zone.label}
          </div>
        ))}

      {stage.spots.map((spot, i) => {
        const p = points[spot.id]
        if (!p) return null
        const got = !!collected[spot.id]

        return (
          <button
            key={spot.id}
            onClick={() => onPick(spot.id)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            aria-label={`${spot.title}${got ? ' · 수집 완료' : ''}`}
          >
            <motion.span
              initial={false}
              animate={got ? { scale: [0.72, 1.14, 1] } : { scale: 1 }}
              transition={{ duration: 0.44, ease: [0.34, 1.32, 0.5, 1] }}
              className={[
                'flex items-center justify-center rounded-full border-[1.5px] text-[12px] font-extrabold tabular-nums',
                labels ? 'h-8 w-8' : 'h-7 w-7 text-[11px]',
                got
                  ? 'border-seal bg-seal text-white'
                  : 'border-line-2 bg-surface text-ink-3',
              ].join(' ')}
            >
              {got ? <Icon name="check" size={15} strokeWidth={2.8} /> : i + 1}
            </motion.span>

            {labels && (
              <span
                className={[
                  'max-w-[92px] rounded bg-surface/90 px-1 text-center text-[11px] font-semibold leading-tight',
                  got ? 'text-ink' : 'text-ink-3',
                ].join(' ')}
              >
                {spot.title.split(' — ')[0]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
