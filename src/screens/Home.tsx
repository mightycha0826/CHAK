import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import KakaoMap from '../components/KakaoMap.tsx'
import SchematicMap from '../components/SchematicMap.tsx'
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

/** 답사 탭 — 진행 요약 · 관내도 · 지점 목록. */
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
        <span className="text-[20px] font-extrabold tracking-[-0.05em] text-ink">
          착 <span className="text-ink-3">chak</span>
        </span>
        <ResetButton onTap={onReset} onLongPress={onOpenDemo} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {/* 진행 요약 — 이 화면에서 가장 강한 면 */}
        <section
          className="rounded-card bg-black px-5 py-6 text-white"
          data-progress={`${count}/${total}`}
        >
          <p className="text-[13px] font-semibold text-white/55">
            {stage.region} · {stage.name}
          </p>
          <div className="mt-3 flex items-end gap-1.5">
            <span className="text-[52px] font-extrabold leading-none tracking-[-0.05em] tabular-nums">
              {count}
            </span>
            <span className="pb-1.5 text-[20px] font-bold leading-none text-white/40 tabular-nums">
              / {total}
            </span>
            <span className="flex-1" />
            <span className="pb-2 text-[14px] font-semibold text-white/70">
              {done ? '모두 수집' : `${total - count}곳 남음`}
            </span>
          </div>

          <div className="mt-5 flex gap-1.5">
            {stage.spots.map((s) => (
              <span
                key={s.id}
                className={[
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  collected[s.id] ? 'bg-seal' : 'bg-white/18',
                ].join(' ')}
              />
            ))}
          </div>

          {/* 착 읽기 — 도장이 들어오는 유일한 경로이므로 가장 강한 면 안에 둔다.
              인주색은 쓰지 않는다. 색은 수집 상태에만 쓰는 신호다. */}
          <button
            onClick={onScan}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-btn bg-white px-4 py-3.5 text-[15px] font-bold text-black"
          >
            <Icon name="nfc" size={19} strokeWidth={2} />
            착 읽기
          </button>
          <p className="mt-2.5 text-center text-[12.5px] font-medium text-white/45">
            {done
              ? '기록이 모두 등록되었습니다'
              : '지점 리더에 댄 착을 폰에 대면 도장이 들어옵니다'}
          </p>
        </section>

        {/* 관내도 */}
        <section className="mt-3 overflow-hidden rounded-card bg-surface">
          {/* 이름표는 붙이지 않는다 — 바로 아래 목록이 번호로 이어받으므로
              작은 지도에 글자를 얹으면 서로 겹치기만 한다. */}
          <div className="h-[210px]">
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

        {/* 지점 목록 */}
        <section className="mt-7">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-[19px]">답사 지점</h2>
            <span className="text-[13px] font-semibold text-ink-3 tabular-nums">
              {total}곳
            </span>
          </div>

          <ul className="mt-3 space-y-2">
            {stage.spots.map((spot, i) => {
              const got = !!collected[spot.id]
              return (
                <li key={spot.id}>
                  <button
                    onClick={() => onPick(spot.id)}
                    className="flex w-full items-center gap-3.5 rounded-card bg-surface px-4 py-3.5 text-left"
                  >
                    <span
                      className={[
                        'w-6 shrink-0 text-[13px] font-extrabold tabular-nums',
                        got ? 'text-seal' : 'text-ink-3',
                      ].join(' ')}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-bold text-ink">
                        {spot.title.split(' — ')[0]}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] font-medium text-ink-3">
                        {spot.zone}
                      </span>
                    </span>

                    {got ? (
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.34, ease: [0.34, 1.32, 0.5, 1] }}
                        className="shrink-0"
                      >
                        <Seal motif={spot.motif} size={34} tilt={-6} />
                      </motion.span>
                    ) : (
                      <span className="shrink-0 text-ink-3">
                        <Icon name="chevron" size={17} />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
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
