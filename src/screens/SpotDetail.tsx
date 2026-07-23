import { motion } from 'motion/react'
import { KIND, type Spot, type Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import { formatDiaryDate } from '../lib/format.ts'

interface Props {
  stage: Stage
  spot: Spot
  collectedAt: string | null
  onBack: () => void
  /** 착을 읽어 방문 기록을 등록한다. 지점 단위가 아니라 카드 단위다. */
  onScan: () => void
}

/** 지점 상세. */
export default function SpotDetail({ stage, spot, collectedAt, onBack, onScan }: Props) {
  const index = stage.spots.findIndex((s) => s.id === spot.id) + 1

  return (
    <div className="relative flex h-full flex-col bg-surface">
      <div className="min-h-0 flex-1 overflow-y-auto pb-[92px]">
        {/* 표제 — 사진 자리. 사진이 붙기 전까지는 검정 면과 문양이 대신한다. */}
        <div className="relative overflow-hidden bg-black px-5 pb-7 pt-3">
          <div className="flex h-11 items-center">
            <button
              onClick={onBack}
              className="-ml-2 flex h-10 w-10 items-center justify-center text-white"
              aria-label="뒤로"
            >
              <Icon name="back" size={22} strokeWidth={2} />
            </button>
            <span className="flex-1" />
            <span className="text-[13px] font-semibold text-white/45 tabular-nums">
              {String(index).padStart(2, '0')} / {String(stage.spots.length).padStart(2, '0')}
            </span>
          </div>

          {/* 문양 워터마크 */}
          <motion.span
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
            className="pointer-events-none absolute right-3 top-9 select-none text-[152px] font-bold leading-none text-white/[0.07]"
            style={{ fontFamily: 'var(--font-seal)' }}
            aria-hidden="true"
          >
            {spot.motif}
          </motion.span>

          <div className="relative mt-16">
            <span className="label label-dark">{KIND[spot.kind].label}</span>
            <h1 className="mt-3 text-[29px] leading-[1.24] text-white">{spot.title}</h1>
            <p className="mt-2 text-[14.5px] font-medium text-white/55">{spot.subtitle}</p>
          </div>
        </div>

        {/* 제원 — 카드도 칩도 없이 label / value 행으로 */}
        <dl className="px-5 pt-5">
          <div className="spec">
            <dt>구역</dt>
            <dd>{spot.zone}</dd>
          </div>
          <div className="spec">
            <dt>분류</dt>
            <dd>{spot.meta}</dd>
          </div>
          <div className="spec">
            <dt>도장</dt>
            <dd className={collectedAt ? 'text-seal' : 'text-ink-3'}>
              {collectedAt ? `방문 · ${formatDiaryDate(collectedAt)}` : '미방문'}
            </dd>
          </div>
          {spot.source && (
            <div className="spec">
              <dt>출처</dt>
              <dd className="text-[14px] font-medium text-ink-2">{spot.source}</dd>
            </div>
          )}
        </dl>

        <div className="mx-5 mt-3 h-px bg-line" />

        <div className="px-5 py-7">
          <h2 className="text-[17px]">이야기</h2>
          <p className="mt-3 text-[15.5px] font-medium leading-[1.76] text-ink-2">
            {spot.story}
          </p>
        </div>
      </div>

      {/* 도장은 앱에서 찍을 수 없다 — 현장 리더에 착을 대야 카드에 기록이
          쌓이고, 여기서는 그 착을 읽어 등록만 한다. 버튼 문구가 그 순서를
          오해하게 만들면 관람객이 현장에서 리더를 그냥 지나친다. */}
      <div className="absolute inset-x-0 bottom-0 border-t border-line bg-surface px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        {!collectedAt && (
          <p className="mb-2.5 text-center text-[13px] font-medium text-ink-3">
            {spot.zone}의 리더에 착을 대면 도장이 새겨집니다
          </p>
        )}
        <button className={collectedAt ? 'btn btn-line' : 'btn'} onClick={onScan}>
          <Icon name="nfc" size={19} strokeWidth={2} />
          착 읽기
        </button>
      </div>
    </div>
  )
}
