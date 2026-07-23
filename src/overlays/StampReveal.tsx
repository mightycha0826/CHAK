import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Spot, Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import Photo from '../components/Photo.tsx'
import Seal from '../components/Seal.tsx'
import { haptic } from '../lib/format.ts'

interface Props {
  stage: Stage
  /**
   * 이번 등록으로 처음 들어온 도장들. 비어 있으면 「새 도장 없음」.
   *
   * 착은 지점을 여러 곳 돌고 나서 한 번에 등록하므로 **여러 개가 동시에
   * 들어오는 게 정상이다.** 하나씩 순차로 공개한다 — 세 곳을 돌았는데 도장이
   * 한 화면에 뭉뚱그려 나오면 각각을 들여다볼 틈이 없다.
   */
  spots: Spot[]
  /** 등록 전까지 모았던 개수. 순번을 매기는 데 쓴다. */
  before: number
  /** 이번 등록으로 마지막 한 칸이 채워졌는가 */
  completing: boolean
  onConfirm: () => void
}

const LAND_MS = 560

/** 도장이 내려찍히는 순간. */
export default function StampReveal({ stage, spots, before, completing, onConfirm }: Props) {
  const [index, setIndex] = useState(0)
  const [landed, setLanded] = useState(false)

  const spot = spots[index] ?? null
  const isLast = index >= spots.length - 1
  const count = before + index + 1

  // 도장이 바뀔 때마다 착지 연출을 다시 돌린다
  useEffect(() => {
    setLanded(false)
    const t = setTimeout(() => {
      setLanded(true)
      haptic([14, 42, 20])
    }, LAND_MS)
    return () => clearTimeout(t)
  }, [index])

  useEffect(() => {
    if (!completing || !landed || !isLast) return
    const t = setTimeout(onConfirm, 1800)
    return () => clearTimeout(t)
  }, [completing, landed, isLast, onConfirm])

  function next() {
    if (isLast) onConfirm()
    else setIndex((i) => i + 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="absolute inset-0 z-40 flex flex-col bg-surface px-7 pb-8 pt-14"
    >
      {spot ? (
        <>
          {/* 여러 곳을 한 번에 등록했으면 지금 몇 번째를 보고 있는지 알려준다 */}
          {spots.length > 1 && (
            <div className="flex shrink-0 items-center justify-center gap-1.5">
              {spots.map((s, i) => (
                <span
                  key={s.id}
                  className={[
                    'h-1 transition-all duration-300',
                    i === index ? 'w-5 bg-ink' : i < index ? 'w-2 bg-ink-3' : 'w-2 bg-line-2',
                  ].join(' ')}
                />
              ))}
            </div>
          )}

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {/* 도판 위에 낙관이 내려앉는다 — 유물을 실제로 보고 도장을 받는 느낌 */}
            <AnimatePresence mode="wait">
              <div key={spot.id} className="relative">
                {spot.photo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                    className="h-[168px] w-[168px] overflow-hidden border border-line"
                  >
                    <Photo
                      name={spot.photo}
                      position={spot.photoPosition}
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                )}
                <div
                  className={[
                    landed ? 'shake' : '',
                    spot.photo ? 'absolute inset-0 flex items-center justify-center' : '',
                  ].join(' ')}
                >
                  <motion.div
                    initial={{ scale: 2.8, opacity: 0, rotate: -22 }}
                    animate={{ scale: 1, opacity: 1, rotate: -6 }}
                    transition={{
                      delay: LAND_MS / 1000 - 0.3,
                      duration: 0.3,
                      ease: [0.34, 1.32, 0.5, 1],
                    }}
                  >
                    <Seal motif={spot.motif} size={spot.photo ? 118 : 138} bleed tilt={0} />
                  </motion.div>
                </div>
              </div>
            </AnimatePresence>

            <motion.div
              key={`${spot.id}-copy`}
              initial={{ opacity: 0, y: 12 }}
              animate={landed ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
              className="mt-10 w-full"
            >
              <span className="label label-seal">도장 {count}번째</span>
              <h2 className="relic mt-3.5 text-[27px] leading-[1.28]">
                {spot.title.split(' — ')[0]}
              </h2>
              <p className="relic mt-3 text-[15px] leading-relaxed text-ink-2">
                {spot.excerpt}
              </p>

              <div className="mt-8 flex items-center justify-center gap-1.5">
                {stage.spots.map((s, i) => (
                  <span
                    key={s.id}
                    className={[
                      'h-1.5 rounded-full transition-all duration-300',
                      i < count ? 'w-7 bg-seal' : 'w-4 bg-line-2',
                    ].join(' ')}
                  />
                ))}
              </div>
              <p className="mt-3 text-[13px] font-bold text-ink-3 tabular-nums">
                {count} / {stage.spots.length}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={landed ? { opacity: 1 } : {}}
            transition={{ delay: 0.18, duration: 0.28 }}
            className="shrink-0"
          >
            {completing && isLast ? (
              <p className="pb-4 text-center text-[14px] font-semibold text-ink-3">
                증명서를 펼치는 중…
              </p>
            ) : (
              <button className="btn" onClick={next}>
                {isLast ? (
                  <>
                    <Icon name="check" size={19} strokeWidth={2.4} />
                    확인
                  </>
                ) : (
                  <>
                    다음 도장
                    <Icon name="chevron" size={19} strokeWidth={2.4} />
                  </>
                )}
              </button>
            )}
          </motion.div>
        </>
      ) : (
        /* 착에 새 기록이 없었다 — 지점을 안 들렀거나 이미 등록한 착이다 */
        <>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-[138px] w-[138px] items-center justify-center rounded-full border-[1.5px] border-line-2">
              <Icon name="check" size={44} strokeWidth={1.6} />
            </div>
            <span className="label mt-11">이미 등록한 기록</span>
            <h2 className="mt-3.5 text-[26px] leading-[1.25]">새 도장이 없습니다</h2>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-ink-2">
              착에 담긴 기록은 모두 등록되어 있어요.
              <br />
              지점 리더에 착을 대면 새 도장이 쌓입니다.
            </p>
            <p className="mt-8 text-[13px] font-bold text-ink-3 tabular-nums">
              {before} / {stage.spots.length}
            </p>
          </div>
          <div className="shrink-0">
            <button className="btn" onClick={onConfirm}>
              <Icon name="check" size={19} strokeWidth={2.4} />
              확인
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}
