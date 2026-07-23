import { motion } from 'motion/react'
import { KIND, type Spot, type Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import Photo, { PhotoCredit } from '../components/Photo.tsx'
import Seal from '../components/Seal.tsx'
import { formatDiaryDate } from '../lib/format.ts'

interface Props {
  stage: Stage
  spot: Spot
  collectedAt: string | null
  onBack: () => void
  /** 착을 읽어 방문 기록을 등록한다 */
  onScan: () => void
}

const EASE = [0.22, 0.61, 0.36, 1] as const

/**
 * 지점 상세 — 전시 플래카드.
 *
 * 도판이 먼저 오고, 그 아래 유물명(명조) · 제원표 · 이야기 순으로 내려간다.
 * 실제 박물관 도록의 순서 그대로다.
 */
export default function SpotDetail({ stage, spot, collectedAt, onBack, onScan }: Props) {
  const index = stage.spots.findIndex((s) => s.id === spot.id) + 1
  const hasPhoto = !!spot.photo

  return (
    <div className="relative flex h-full flex-col bg-surface">
      <div className="min-h-0 flex-1 overflow-y-auto pb-[92px]">
        {/* 도판 */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
          {hasPhoto && (
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="absolute inset-0"
            >
              <Photo
                name={spot.photo}
                position={spot.photoPosition}
                alt={spot.title}
                eager
                className="h-full w-full object-cover"
              />
            </motion.div>
          )}

          {/* 사진이 없을 때만 문양이 자리를 대신한다 */}
          {!hasPhoto && (
            <span
              className="relic pointer-events-none absolute inset-0 flex items-center justify-center text-[150px] leading-none text-white/[0.08]"
              aria-hidden="true"
            >
              {spot.motif}
            </span>
          )}

          {/* 위쪽만 살짝 눌러 뒤로가기가 늘 보이게 한다 */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-24"
            style={{
              background: 'linear-gradient(180deg, rgba(13,12,9,0.5) 0%, transparent 100%)',
            }}
          />

          <div className="absolute inset-x-0 top-0 flex h-14 items-center px-3">
            <button
              onClick={onBack}
              className="-ml-1 flex h-10 w-10 items-center justify-center text-white"
              aria-label="뒤로"
            >
              <Icon name="back" size={22} strokeWidth={2} />
            </button>
            <span className="flex-1" />
            <span className="text-[12.5px] font-bold text-white/70 tabular-nums">
              {String(index).padStart(2, '0')} / {String(stage.spots.length).padStart(2, '0')}
            </span>
          </div>

          {/* 도장을 받았으면 도판 위에 낙관이 찍힌다 */}
          {collectedAt && (
            <motion.div
              initial={{ scale: 1.6, opacity: 0, rotate: -16 }}
              animate={{ scale: 1, opacity: 1, rotate: -6 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.34, 1.32, 0.5, 1] }}
              className="absolute bottom-3 right-3"
            >
              <Seal motif={spot.motif} size={54} bleed tilt={0} />
            </motion.div>
          )}
        </div>

        {hasPhoto && (
          <div className="border-b border-line px-5 py-2">
            <PhotoCredit
              name={spot.photo}
              className="text-[10.5px] font-medium text-ink-3"
            />
          </div>
        )}

        {/* 플래카드 */}
        <div className="px-5 pt-6">
          <div className="flex items-center gap-2">
            <span className="label">{KIND[spot.kind].label}</span>
            <span className="text-[12.5px] font-medium text-ink-3">{spot.zone}</span>
          </div>

          <h1 className="relic mt-3.5 text-[28px] text-ink">{spot.title}</h1>
          <p className="mt-2 text-[14px] font-medium text-ink-2">{spot.subtitle}</p>

          {/* 제원표 */}
          <dl className="mt-6">
            {(spot.facts ?? [{ label: '분류', value: spot.meta }]).map((f) => (
              <div className="spec" key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
            <div className="spec">
              <dt>도장</dt>
              <dd className={collectedAt ? 'text-seal' : 'text-ink-3'}>
                {collectedAt ? `방문 · ${formatDiaryDate(collectedAt)}` : '미방문'}
              </dd>
            </div>
          </dl>
        </div>

        {/* 이야기 */}
        <div className="mt-8 px-5">
          <h2 className="border-b border-ink pb-2 text-[15px] font-bold">이야기</h2>
          <p className="mt-4 text-[15.5px] font-medium leading-[1.82] text-ink-2">
            {spot.story}
          </p>

          {spot.source && (
            <p className="mt-6 border-t border-line pt-4 text-[11.5px] font-medium leading-relaxed text-ink-3">
              {spot.source}
            </p>
          )}
        </div>

        {/* 발췌 — 수집한 뒤에만 드러난다 */}
        {collectedAt && (
          <motion.figure
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
            className="mx-5 mt-8 border-l-2 border-seal bg-surface-2 py-4 pl-4 pr-3"
          >
            <blockquote className="relic text-[16px] leading-relaxed text-ink">
              {spot.excerpt}
            </blockquote>
            <figcaption className="mt-2 text-[11.5px] font-semibold text-ink-3">
              수첩에 남긴 한 줄
            </figcaption>
          </motion.figure>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-line bg-surface px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
        <p className="mb-2.5 flex items-center justify-center gap-1.5 text-[12px] font-medium text-ink-3">
          <Icon name="nfc" size={14} strokeWidth={1.8} />
          {collectedAt
            ? '이미 다녀온 지점입니다'
            : '이 자리의 리더에 착을 대면 도장이 찍힙니다'}
        </p>
        <button className="btn" onClick={onScan}>
          <Icon name="nfc" size={19} strokeWidth={2} />
          착 읽기
        </button>
      </div>
    </div>
  )
}
