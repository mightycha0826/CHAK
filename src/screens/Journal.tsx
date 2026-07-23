import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import Photo from '../components/Photo.tsx'
import Seal from '../components/Seal.tsx'
import { formatDiaryDate } from '../lib/format.ts'

interface Props {
  stage: Stage
  collected: Record<string, string>
  onOpenCertificate: () => void
}

/**
 * 수첩 탭 — 도록의 도판 목록.
 *
 * 다녀온 자리는 사진이 살아나고 낙관이 찍히며, 아직인 자리는 회색으로
 * 눌려 있다. 「모았다 / 아직」이 한눈에 갈리는 것이 이 화면의 전부다.
 */
export default function Journal({ stage, collected, onOpenCertificate }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const count = Object.keys(collected).length
  const total = stage.spots.length
  const done = count >= total

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center px-5">
        <h1 className="text-[19px] font-bold">수첩</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <div className="border-b border-ink pb-4">
          <p className="text-[12.5px] font-semibold text-ink-3">{stage.name}</p>
          <h2 className="relic mt-2 text-[26px] text-ink">
            {count === 0
              ? '아직 비어 있습니다'
              : done
                ? '다 채웠습니다'
                : `${total - count}곳이 남았습니다`}
          </h2>
        </div>

        {done && (
          <button
            onClick={onOpenCertificate}
            className="mt-4 flex w-full items-center gap-3 bg-black px-5 py-4 text-left text-white"
          >
            <Icon name="award" size={19} strokeWidth={2} />
            <span className="flex-1 text-[14.5px] font-bold">
              {stage.certificateTitle} 보기
            </span>
            <Icon name="chevron" size={16} />
          </button>
        )}

        <ul className="mt-2">
          {stage.spots.map((spot, i) => {
            const at = collected[spot.id] ?? null
            const open = openId === spot.id

            return (
              <li key={spot.id} className="border-b border-line">
                <button
                  onClick={() => at && setOpenId(open ? null : spot.id)}
                  disabled={!at}
                  className="flex w-full items-stretch gap-4 py-4 text-left"
                >
                  {/* 도판 + 낙관 */}
                  <span className="relative h-[84px] w-[64px] shrink-0 overflow-hidden bg-surface-2">
                    <Photo
                      name={spot.photo}
                      position={spot.photoPosition}
                      className={[
                        'h-full w-full object-cover transition-all duration-700',
                        at ? '' : 'grayscale opacity-40',
                      ].join(' ')}
                    />
                    {at ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Seal motif={spot.motif} size={44} bleed tilt={-6 + i * 2} />
                      </span>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Seal motif={spot.motif} size={40} empty />
                      </span>
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col justify-center">
                    <span className="flex items-center gap-2">
                      <span
                        className={[
                          'text-[11.5px] font-bold tabular-nums',
                          at ? 'text-seal' : 'text-ink-3',
                        ].join(' ')}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {at && (
                        <span className="text-[11.5px] font-medium text-ink-3">
                          {formatDiaryDate(at)}
                        </span>
                      )}
                    </span>

                    <span
                      className={[
                        'relic mt-1 truncate text-[17px]',
                        at ? 'text-ink' : 'text-ink-3',
                      ].join(' ')}
                    >
                      {spot.title.split(' — ')[0]}
                    </span>

                    {at ? (
                      <span className="relic mt-1.5 text-[13px] leading-snug text-ink-2">
                        {spot.excerpt}
                      </span>
                    ) : (
                      <span className="mt-1 text-[12.5px] font-medium text-ink-3">
                        현장에서 착을 대면 채워집니다
                      </span>
                    )}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open && at && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-line pb-5 pt-4 text-[14.5px] font-medium leading-[1.78] text-ink-2">
                        {spot.story}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
