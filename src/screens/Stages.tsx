import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'

interface Props {
  stages: Stage[]
  current: Stage
  /** 무대별 수집 수 */
  countOf: (stageId: string) => number
  onSwitch: (id: string) => void
}

/** 무대 탭 — 어느 장소를 답사할지 고른다. */
export default function Stages({ stages, current, countOf, onSwitch }: Props) {
  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center px-5">
        <h1 className="text-[20px]">무대</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <p className="px-1 text-[14px] font-medium leading-relaxed text-ink-2">
          착은 장소마다 다른 답사를 담습니다. 무대를 바꿔도 각각의 진행은 따로
          남습니다.
        </p>

        <ul className="mt-4 space-y-2">
          {stages.map((stage) => {
            const count = countOf(stage.id)
            const total = stage.spots.length
            const on = stage.id === current.id

            return (
              <li key={stage.id}>
                <button
                  onClick={() => onSwitch(stage.id)}
                  className={[
                    'w-full rounded-card px-5 py-5 text-left',
                    on ? 'bg-black text-white' : 'bg-surface',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        'text-[13px] font-semibold',
                        on ? 'text-white/55' : 'text-ink-3',
                      ].join(' ')}
                    >
                      {stage.region}
                    </span>
                    {on && <span className="label label-dark">선택됨</span>}
                    <span className="flex-1" />
                    {!on && (
                      <span className="text-ink-3">
                        <Icon name="chevron" size={17} />
                      </span>
                    )}
                  </div>

                  <p className={['mt-2 text-[21px] font-extrabold tracking-[-0.035em]', on ? 'text-white' : 'text-ink'].join(' ')}>
                    {stage.name}
                  </p>
                  <p
                    className={[
                      'mt-1 text-[13.5px] font-medium',
                      on ? 'text-white/55' : 'text-ink-3',
                    ].join(' ')}
                  >
                    {stage.subtitle}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                      {stage.spots.map((s, i) => (
                        <span
                          key={s.id}
                          className={[
                            'h-1 flex-1 rounded-full',
                            i < count ? 'bg-seal' : on ? 'bg-white/18' : 'bg-line-2',
                          ].join(' ')}
                        />
                      ))}
                    </div>
                    <span
                      className={[
                        'text-[13px] font-bold tabular-nums',
                        on ? 'text-white/70' : 'text-ink-3',
                      ].join(' ')}
                    >
                      {count}/{total}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        <p className="mt-6 px-1 text-[12px] font-medium leading-relaxed text-ink-3">
          {current.credit}
        </p>
      </div>
    </div>
  )
}
