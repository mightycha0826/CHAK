import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import Photo from '../components/Photo.tsx'

interface Props {
  stages: Stage[]
  current: Stage
  /** 무대별 수집 수 */
  countOf: (stageId: string) => number
  onSwitch: (id: string) => void
}

/**
 * 무대 탭 — 도록의 총서 목록.
 *
 * 무대마다 표지 사진을 크게 깔고, 선택된 무대는 사진을 온전히, 나머지는
 * 어둡게 눌러 「지금 보고 있는 권」을 분명히 한다.
 */
export default function Stages({ stages, current, countOf, onSwitch }: Props) {
  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center px-5">
        <h1 className="text-[19px] font-bold">무대</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <p className="border-b border-line pb-4 text-[13.5px] font-medium leading-relaxed text-ink-2">
          착은 장소마다 다른 답사를 담습니다. 무대를 바꿔도 각각의 진행은 따로
          남습니다.
        </p>

        <ul className="mt-4 space-y-3">
          {stages.map((stage) => {
            const count = countOf(stage.id)
            const total = stage.spots.length
            const on = stage.id === current.id

            return (
              <li key={stage.id}>
                <button
                  onClick={() => onSwitch(stage.id)}
                  className="relative block h-[168px] w-full overflow-hidden border border-line text-left"
                  aria-current={on ? 'true' : undefined}
                >
                  {/* 표지 사진 (없으면 검정) */}
                  <span className="absolute inset-0 bg-black">
                    {stage.cover && (
                      <Photo
                        name={stage.cover.photo}
                        position={stage.cover.position}
                        className={[
                          'h-full w-full object-cover transition-all duration-500',
                          on ? '' : 'grayscale-[0.4]',
                        ].join(' ')}
                      />
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background: on
                        ? 'linear-gradient(180deg, rgba(13,12,9,0.15) 0%, rgba(13,12,9,0.4) 55%, rgba(13,12,9,0.88) 100%)'
                        : 'linear-gradient(180deg, rgba(13,12,9,0.45) 0%, rgba(13,12,9,0.6) 55%, rgba(13,12,9,0.92) 100%)',
                    }}
                  />

                  <span className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                    <span className="flex items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-white/65">
                        {stage.region}
                      </span>
                      {on && <span className="label label-dark">선택됨</span>}
                    </span>

                    <span className="relic mt-1.5 text-[25px] leading-tight">{stage.name}</span>
                    <span className="mt-0.5 text-[12.5px] font-medium text-white/60">
                      {stage.subtitle}
                    </span>

                    <span className="mt-3.5 flex items-center gap-3">
                      <span className="flex flex-1 gap-1">
                        {stage.spots.map((s, i) => (
                          <span
                            key={s.id}
                            className={[
                              'h-[3px] flex-1',
                              i < count ? 'bg-seal' : 'bg-white/25',
                            ].join(' ')}
                          />
                        ))}
                      </span>
                      <span className="text-[12.5px] font-bold text-white/80 tabular-nums">
                        {count}/{total}
                      </span>
                    </span>
                  </span>

                  {!on && (
                    <span className="absolute right-4 top-4 text-white/70">
                      <Icon name="chevron" size={17} />
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <p className="mt-6 text-[11.5px] font-medium leading-relaxed text-ink-3">
          {current.credit}
        </p>
      </div>
    </div>
  )
}
