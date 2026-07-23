import { useState } from 'react'
import { motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import { applyPreset, resetStage } from '../state/progress.ts'
import { issueCard, readCardOnce, stampCard } from '../nfc/webNfc.ts'
import { spotCode } from '../chak/card.ts'
import Icon from '../components/Icon.tsx'

interface Props {
  stage: Stage
  /** 「지점 n곳을 돌고 온 착」을 읽은 것으로 친다 */
  onSimulateCard: (visited: number) => void
  onClose: () => void
}

/**
 * 발표용 시연 도구. 답사 탭의 리셋 아이콘을 길게 눌러야 열린다 —
 * 심사위원 눈에는 보이지 않고, 발표 중 재시연은 즉시 가능하다.
 *
 * 착 발급과 도장 찍기도 여기 있다. **폰을 현장 리더 대신 쓰는 경로**로,
 * PM3를 지점마다 둘 수 없는 발표장에서 「지점을 돌아다니는 것」을 흉내 낸다.
 */
export default function DemoPanel({ stage, onSimulateCard, onClose }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState('')

  const ids = stage.spots.map((s) => s.id)

  /** 빈 착 카드를 폰으로 발급한다. PM3의 chak_init.lua와 같은 결과물. */
  async function issue() {
    setBusy('issue')
    setResult('')
    const ok = await issueCard(stage.spots.length)
    setBusy(null)
    setResult(
      ok
        ? `빈 착 발급 완료 — 슬롯 ${stage.spots.length}개`
        : '발급 실패 — 안드로이드 Chrome + HTTPS에서 카드를 대주세요',
    )
  }

  /**
   * 폰을 그 지점의 리더처럼 써서 착에 도장을 찍는다.
   *
   * Web NFC는 블록 단위 접근이 없어 메시지 전체를 갈아끼워야 하므로
   * 「읽고 → 해당 슬롯만 고쳐서 → 다시 쓰기」가 된다. 카드를 떼지 말 것.
   */
  async function stampAt(index: number) {
    const spot = stage.spots[index]
    setBusy(spot.id)
    setResult('')

    const read = await readCardOnce()
    if (!read) {
      setBusy(null)
      setResult('착을 읽지 못했습니다 — 카드를 대고 다시 시도하세요')
      return
    }

    const ok = await stampCard(read.card, index, spotCode(spot.id))
    setBusy(null)
    setResult(
      ok
        ? `${spot.title.split(' — ')[0]} 도장 완료 — 이제 「착 읽기」로 등록하세요`
        : '쓰기 실패 — 카드를 떼지 말고 다시 시도하세요',
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex flex-col justify-end bg-black/45"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
        className="max-h-[86%] overflow-y-auto rounded-t-[20px] bg-surface px-5 pb-8 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-line-2" />

        <div className="flex items-start justify-between">
          <div>
            <span className="label">시연 도구</span>
            <h2 className="mt-2.5 text-[21px]">{stage.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="-mr-2 flex h-9 w-9 items-center justify-center text-ink-3"
            aria-label="닫기"
          >
            <Icon name="close" size={20} strokeWidth={2} />
          </button>
        </div>

        <Section title="진행 상태">
          <div className="grid grid-cols-3 gap-2">
            <Chip label={`0 / ${ids.length}`} onClick={() => resetStage(stage.id)} />
            <Chip
              label={`${ids.length - 1} / ${ids.length}`}
              onClick={() => applyPreset(stage.id, ids.slice(0, -1))}
            />
            <Chip
              label={`${ids.length} / ${ids.length}`}
              onClick={() => applyPreset(stage.id, ids)}
            />
          </div>
        </Section>

        {/* 착의 핵심은 여러 곳을 돌고 한 번에 등록하는 것이다. 폴백은 한 곳씩만
            늘어나 그 장면이 안 나오므로, 발표용으로 따로 둔다. */}
        <Section title="여러 곳 돌고 온 착 읽기">
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, ids.length].map((n) => (
              <Chip key={n} label={`${n}곳 방문`} onClick={() => onSimulateCard(n)} />
            ))}
          </div>
        </Section>

        <Section title="착 발급 (폰으로)">
          <button
            onClick={issue}
            disabled={busy !== null}
            className="flex w-full items-center justify-between rounded-btn border border-line-2 px-3.5 py-3 text-left text-[14px] font-semibold disabled:opacity-40"
          >
            <span className="text-ink">빈 착 만들기</span>
            <span className="ml-3 shrink-0 text-[12.5px] font-bold text-ink-3">
              {busy === 'issue' ? '카드를 대주세요…' : `슬롯 ${ids.length}개`}
            </span>
          </button>
        </Section>

        <Section title="지점 도장 (폰을 현장 리더로)">
          <ul className="space-y-2">
            {stage.spots.map((spot, i) => (
              <li key={spot.id}>
                <button
                  onClick={() => stampAt(i)}
                  disabled={busy !== null}
                  className="flex w-full items-center justify-between rounded-btn border border-line-2 px-3.5 py-3 text-left text-[14px] font-semibold disabled:opacity-40"
                >
                  <span className="min-w-0 truncate text-ink">
                    {spot.title.split(' — ')[0]}
                  </span>
                  <span className="ml-3 shrink-0 text-[12.5px] font-bold text-ink-3">
                    {busy === spot.id ? '착을 대주세요…' : '찍기'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {result && (
            <p className="mt-3 break-all text-[12px] font-medium text-ink-3">{result}</p>
          )}
          <p className="mt-3 text-[12px] font-medium leading-relaxed text-ink-3">
            기본은 지점마다 둔 proxmark3입니다 —{' '}
            <code className="font-mono">script run chak_stamp -s &lt;지점&gt;</code>
          </p>
        </Section>
      </motion.div>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <p className="mb-3 text-[13px] font-bold text-ink-3">{title}</p>
      {children}
    </section>
  )
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-btn border border-line-2 px-3 py-3 text-[13.5px] font-bold text-ink tabular-nums"
    >
      {label}
    </button>
  )
}
