import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import Seal from '../components/Seal.tsx'
import { formatDiaryDate } from '../lib/format.ts'

interface Props {
  stage: Stage
  collected: Record<string, string>
  onOpenCertificate: () => void
}

/** 수첩 탭 — 모은 도장과 남긴 문장. */
export default function Journal({ stage, collected, onOpenCertificate }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const count = Object.keys(collected).length
  const total = stage.spots.length
  const done = count >= total

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center px-5">
        <h1 className="text-[20px]">수첩</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <div className="px-1">
          <p className="text-[14px] font-semibold text-ink-3">{stage.name}</p>
          <h2 className="mt-1.5 text-[25px]">
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
            className="mt-4 flex w-full items-center gap-3 rounded-card bg-black px-5 py-4 text-left text-white"
          >
            <Icon name="award" size={20} strokeWidth={2} />
            <span className="flex-1 text-[15px] font-bold">{stage.certificateTitle} 보기</span>
            <Icon name="chevron" size={17} />
          </button>
        )}

        <ul className="mt-4 space-y-2">
          {stage.spots.map((spot, i) => {
            const at = collected[spot.id] ?? null
            const open = openId === spot.id

            return (
              <li key={spot.id} className="overflow-hidden rounded-card bg-surface">
                <button
                  onClick={() => at && setOpenId(open ? null : spot.id)}
                  disabled={!at}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left"
                >
                  <span className="shrink-0">
                    {at ? (
                      <Seal motif={spot.motif} size={46} tilt={-5 + i * 2} />
                    ) : (
                      <Seal motif={spot.motif} size={46} empty />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={[
                          'text-[12px] font-extrabold tabular-nums',
                          at ? 'text-seal' : 'text-ink-3',
                        ].join(' ')}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={[
                          'min-w-0 flex-1 truncate text-[15.5px] font-bold',
                          at ? 'text-ink' : 'text-ink-3',
                        ].join(' ')}
                      >
                        {spot.title.split(' — ')[0]}
                      </span>
                    </span>

                    {at ? (
                      <>
                        <span className="mt-1 block text-[12.5px] font-semibold text-ink-3">
                          {formatDiaryDate(at)}
                        </span>
                        <span className="mt-1.5 block text-[13.5px] font-medium leading-snug text-ink-2">
                          {spot.excerpt}
                        </span>
                      </>
                    ) : (
                      <span className="mt-1 block text-[13px] font-medium text-ink-3">
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
                      <p className="border-t border-line px-4 py-4 text-[14.5px] font-medium leading-[1.72] text-ink-2">
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
