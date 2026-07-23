import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import Photo from '../components/Photo.tsx'
import Seal from '../components/Seal.tsx'
import { formatFullDate } from '../lib/format.ts'

interface Props {
  stage: Stage
  collected: Record<string, string>
  onClose: () => void
  onRestart: () => void
}

const EASE = [0.22, 0.61, 0.36, 1] as const

/**
 * 완주 증명 — 도록의 마지막 장.
 *
 * 표지 사진을 어둡게 깔고 그 위에 낙관 다섯 개와 남긴 문장들을 얹는다.
 */
export default function Certificate({ stage, collected, onClose, onRestart }: Props) {
  const [toast, setToast] = useState(false)
  const finishedAt = Object.values(collected).sort().at(-1) ?? new Date().toISOString()

  function share() {
    setToast(true)
    setTimeout(() => setToast(false), 2200)
  }

  return (
    <div className="relative flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center px-2">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center text-ink"
          aria-label="닫기"
        >
          <Icon name="close" size={22} strokeWidth={2} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="overflow-hidden border border-line bg-surface"
        >
          {/* 표제 — 표지 사진을 어둡게 깔고 그 위에 */}
          <div className="relative overflow-hidden bg-black px-6 pb-7 pt-7 text-white">
            {stage.cover && (
              <>
                <Photo
                  name={stage.cover.photo}
                  position={stage.cover.position}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: 'rgba(13,12,9,0.74)' }}
                />
              </>
            )}
            <div className="relative">
              <span className="label label-dark">완주 증명</span>
              <h1 className="relic mt-3.5 text-[30px] leading-[1.24]">
                {stage.certificateTitle}
              </h1>
              <p className="mt-2.5 text-[13.5px] font-medium text-white/60">
                {stage.region} · {stage.name} · {stage.spots.length}곳 전부
              </p>
            </div>
          </div>

          {/* 낙관 — 하나씩 내려앉는다 */}
          <div className="flex items-center justify-center gap-1.5 px-5 py-8">
            {stage.spots.map((spot, i) => (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, scale: 1.6, rotate: -18 }}
                animate={{ opacity: 1, scale: 1, rotate: -5 + i * 2.5 }}
                transition={{
                  delay: 0.4 + i * 0.15,
                  duration: 0.4,
                  ease: [0.34, 1.32, 0.5, 1],
                }}
              >
                <Seal motif={spot.motif} size={52} bleed="strong" tilt={0} />
              </motion.div>
            ))}
          </div>

          {/* 남긴 문장들 */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="border-t border-line px-6 py-6"
          >
            {stage.spots.map((spot, i) => (
              <li key={spot.id} className="flex gap-3 border-b border-line py-2.5 last:border-0">
                <span className="w-5 shrink-0 text-[11.5px] font-bold text-ink-3 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="relic flex-1 text-[13.5px] leading-snug text-ink-2">
                  {spot.excerpt}
                </span>
              </li>
            ))}
          </motion.ul>

          <div className="border-t border-line px-6 py-5 text-center">
            <p className="relic text-[14.5px] leading-[1.8] text-ink">
              위 사람은 {stage.name}의 이야기를
              <br />
              발로 걸어 끝까지 읽었음을 증명함
            </p>
            <p className="mt-3 text-[12.5px] font-bold text-ink-3 tabular-nums">
              {formatFullDate(finishedAt)}
            </p>
            {/* 수결 — 증명서의 서명 자리 */}
            <img
              src="/photos/sugyeol.png"
              alt=""
              aria-hidden="true"
              className="mx-auto mt-3 h-14 opacity-70"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </motion.div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-line bg-surface px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <button className="btn btn-quiet" onClick={share}>
          <Icon name="share" size={18} strokeWidth={2} />
          공유하기
        </button>
        <button className="btn" onClick={onRestart}>
          처음으로
        </button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none absolute inset-x-6 bottom-24 bg-ink px-4 py-3.5 text-center text-[13.5px] font-semibold text-white"
          >
            공유는 시연용 목업입니다
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
