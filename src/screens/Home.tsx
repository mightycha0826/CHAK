import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import KakaoMap from '../components/KakaoMap.tsx'
import SchematicMap from '../components/SchematicMap.tsx'
import Photo from '../components/Photo.tsx'
import Seal from '../components/Seal.tsx'

interface Props {
  stage: Stage
  collected: Record<string, string>
  onPick: (spotId: string) => void
  /** 착을 읽어 방문 기록을 등록한다 — 이 화면의 주 동작 */
  onScan: () => void
  onReset: () => void
  onOpenDemo: () => void
}

/**
 * 답사 탭 — 도록의 목차.
 *
 * 진행 요약 → 관내도 → 지점 목록 순으로 내려간다. 지점 목록은 도록의
 * 도판 목록처럼 사진과 번호가 함께 오고, 도장을 받은 자리에는 낙관이
 * 찍힌다.
 */
export default function Home({
  stage,
  collected,
  onPick,
  onScan,
  onReset,
  onOpenDemo,
}: Props) {
  const [useKakao, setUseKakao] = useState(!!stage.map.geo)

  useEffect(() => {
    setUseKakao(!!stage.map.geo)
  }, [stage])

  const count = Object.keys(collected).length
  const total = stage.spots.length
  const done = count >= total

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <span className="flex items-center gap-2">
          <span
            className="relic flex h-7 w-7 items-center justify-center bg-seal text-[17px] leading-none text-white"
            aria-hidden="true"
          >
            착
          </span>
          <span className="text-[12.5px] font-bold tracking-[0.18em] text-ink-3">CHAK</span>
        </span>
        <ResetButton onTap={onReset} onLongPress={onOpenDemo} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {/* 진행 요약 — 이 화면에서 가장 강한 면 */}
        <section
          className="relative overflow-hidden bg-black px-5 py-6 text-white"
          data-progress={`${count}/${total}`}
        >
          {/* 수결(이순신의 서명)을 워터마크로. 앱 전체를 묶는 그래픽이다. */}
          <img
            src="/photos/sugyeol.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -top-5 h-[150%] opacity-[0.09] invert"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />

          <p className="relative text-[12.5px] font-semibold text-white/50">
            {stage.region} · {stage.name}
          </p>

          <div className="relative mt-3 flex items-end gap-1.5">
            <span className="text-[54px] font-bold leading-[0.86] tracking-[-0.05em] tabular-nums">
              {count}
            </span>
            <span className="pb-1 text-[19px] font-bold leading-none text-white/40 tabular-nums">
              / {total}
            </span>
            <span className="flex-1" />
            <span className="pb-1.5 text-[13.5px] font-semibold text-white/65">
              {done ? '모두 수집' : `${total - count}곳 남음`}
            </span>
          </div>

          <div className="relative mt-5 flex gap-1">
            {stage.spots.map((s) => (
              <span
                key={s.id}
                className={[
                  'h-[3px] flex-1 transition-colors duration-300',
                  collected[s.id] ? 'bg-seal' : 'bg-white/18',
                ].join(' ')}
              />
            ))}
          </div>

          <button
            onClick={onScan}
            className="relative mt-5 flex w-full items-center justify-center gap-2 border border-white/25 py-3.5 text-[14.5px] font-bold"
          >
            <Icon name="nfc" size={18} strokeWidth={2} />
            착 읽기
          </button>
        </section>

        {/* 관내도 */}
        <section className="mt-3 overflow-hidden border border-line bg-surface">
          <div className="h-[200px]">
            {useKakao ? (
              <KakaoMap
                stage={stage}
                collected={collected}
                onPick={onPick}
                onUnavailable={() => setUseKakao(false)}
              />
            ) : (
              <SchematicMap
                stage={stage}
                collected={collected}
                onPick={onPick}
                labels={false}
              />
            )}
          </div>
        </section>

        {/* 도판 목록 */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between border-b border-ink pb-2.5">
            <h2 className="text-[17px] font-bold">답사 지점</h2>
            <span className="text-[12.5px] font-semibold text-ink-3 tabular-nums">
              {total}곳
            </span>
          </div>

          <ul>
            {stage.spots.map((spot, i) => {
              const got = !!collected[spot.id]
              return (
                <li key={spot.id} className="border-b border-line">
                  <button
                    onClick={() => onPick(spot.id)}
                    className="flex w-full items-stretch gap-3.5 py-3.5 text-left"
                  >
                    {/* 도판 — 사진이 없으면 번호만 남는다 */}
                    <span className="relative h-[68px] w-[68px] shrink-0 overflow-hidden bg-surface-2">
                      <Photo
                        name={spot.photo}
                        position={spot.photoPosition}
                        className={[
                          'h-full w-full object-cover transition-all duration-500',
                          got ? '' : 'grayscale-[0.55] opacity-70',
                        ].join(' ')}
                      />
                      {got && (
                        <motion.span
                          initial={{ scale: 1.7, opacity: 0, rotate: -18 }}
                          animate={{ scale: 1, opacity: 1, rotate: -7 }}
                          transition={{ duration: 0.38, ease: [0.34, 1.32, 0.5, 1] }}
                          className="absolute bottom-1 right-1"
                        >
                          <Seal motif={spot.motif} size={28} tilt={0} />
                        </motion.span>
                      )}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col justify-center">
                      <span className="flex items-center gap-2">
                        <span
                          className={[
                            'text-[11.5px] font-bold tabular-nums',
                            got ? 'text-seal' : 'text-ink-3',
                          ].join(' ')}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[11.5px] font-medium text-ink-3">
                          {spot.zone}
                        </span>
                      </span>

                      <span className="relic mt-1 truncate text-[17px] text-ink">
                        {spot.title.split(' — ')[0]}
                      </span>
                      <span className="mt-0.5 truncate text-[12.5px] font-medium text-ink-3">
                        {spot.subtitle}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center text-ink-3">
                      <Icon name="chevron" size={16} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <p className="mt-5 text-[11.5px] font-medium leading-relaxed text-ink-3">
          {stage.credit}
        </p>
      </div>
    </div>
  )
}

/**
 * 리셋 버튼. 짧게 누르면 초기화, 길게 누르면 발표용 시연 패널.
 *
 * PRD 8절("리셋으로 3개 방문 상태 전환")과 유저플로우("리셋=전체 초기화")가
 * 충돌해서, 초기화는 그대로 두고 시연 도구는 롱프레스 뒤에 숨겼다.
 */
function ResetButton({
  onTap,
  onLongPress,
}: {
  onTap: () => void
  onLongPress: () => void
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fired = useRef(false)

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => clear, [])

  return (
    <button
      className="-mr-2 flex h-10 w-10 items-center justify-center text-ink-3"
      aria-label="답사 초기화 (길게 누르면 시연 도구)"
      onPointerDown={() => {
        fired.current = false
        clear()
        timer.current = setTimeout(() => {
          fired.current = true
          onLongPress()
        }, 600)
      }}
      onPointerUp={() => {
        clear()
        if (!fired.current) onTap()
      }}
      onPointerLeave={clear}
      onPointerCancel={clear}
    >
      <Icon name="reset" size={19} />
    </button>
  )
}
