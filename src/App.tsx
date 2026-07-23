import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  STAGES,
  findSpot,
  stageOrDefault,
  type Spot,
  type Stage,
} from './content/index.ts'
import { spotCode, type CardData } from './chak/card.ts'
import type { CardRead } from './nfc/webNfc.ts'
import {
  collectedIn,
  hasCelebrated,
  hasStarted,
  markCelebrated,
  markStarted,
  registerCard,
  resetStage,
  useProgressSnapshot,
} from './state/progress.ts'
import { loadStageId, saveStageId } from './state/stage.ts'
import InkFilters from './components/InkFilters.tsx'
import TabBar, { type TabId } from './components/TabBar.tsx'
import Onboarding from './screens/Onboarding.tsx'
import Home from './screens/Home.tsx'
import Journal from './screens/Journal.tsx'
import Stages from './screens/Stages.tsx'
import SpotDetail from './screens/SpotDetail.tsx'
import Certificate from './screens/Certificate.tsx'
import ScanSheet from './overlays/ScanSheet.tsx'
import StampReveal from './overlays/StampReveal.tsx'
import DemoPanel from './overlays/DemoPanel.tsx'

type Screen = 'onboarding' | 'tab' | 'detail' | 'certificate'

type Overlay =
  | { kind: 'scan' }
  | { kind: 'stamp'; spots: Spot[]; before: number; completing: boolean; mismatched: boolean }
  | { kind: 'demo' }
  | null

export default function App() {
  const initial = stageOrDefault(loadStageId())
  const [stage, setStage] = useState<Stage>(initial)
  const [screen, setScreen] = useState<Screen>(hasStarted(initial.id) ? 'tab' : 'onboarding')
  const [tab, setTab] = useState<TabId>('tour')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [spotId, setSpotId] = useState<string | null>(null)

  const snapshot = useProgressSnapshot()
  const collected = snapshot.byStage[stage.id] ?? {}
  const spot = findSpot(stage, spotId)

  const switchStage = useCallback((id: string) => {
    const next = stageOrDefault(id)
    saveStageId(next.id)
    setStage(next)
    setSpotId(null)
    setOverlay(null)
    if (hasStarted(next.id)) {
      setScreen('tab')
      setTab('tour')
    } else {
      setScreen('onboarding')
    }
  }, [])

  const start = useCallback(() => {
    markStarted(stage.id)
    setTab('tour')
    setScreen('tab')
  }, [stage.id])

  const pick = useCallback((id: string) => {
    setSpotId(id)
    setScreen('detail')
  }, [])

  const reset = useCallback(() => {
    resetStage(stage.id)
    setSpotId(null)
    setOverlay(null)
    setTab('tour')
    setScreen('onboarding')
  }, [stage.id])

  /**
   * 착을 읽은 순간 — 카드에 담긴 방문 기록을 통째로 등록한다.
   *
   * 착은 여러 지점을 돌고 나서 한 번에 등록하므로 **도장이 여러 개 한꺼번에
   * 들어오는 게 정상이다.** 이번에 처음 들어온 것만 연출로 보여준다.
   */
  const readCard = useCallback(
    (read: CardRead) => {
      const before = Object.keys(collectedIn(stage.id)).length
      const result = registerCard(stage.id, stage.spots, read.card, read.serial)

      const added = result.added
        .map((id) => findSpot(stage, id))
        .filter((s): s is Spot => s !== null)

      const completing =
        added.length > 0 &&
        before + added.length === stage.spots.length &&
        !hasCelebrated(stage.id)

      setOverlay({ kind: 'stamp', spots: added, before, completing, mismatched: result.mismatched })
    },
    [stage],
  )

  /**
   * Web NFC를 못 쓰는 환경의 폴백 — 「한 곳 더 다녀온 착」을 만들어 낸다.
   *
   * 실물 카드와 **똑같은 등록 경로**를 타게 해서, 시연에서 보이는 동작이
   * 실제 동작과 어긋나지 않도록 한다.
   */
  const simulate = useCallback(() => {
    const current = collectedIn(stage.id)
    const next = stage.spots.find((s) => !current[s.id])

    const card: CardData = {
      slots: stage.spots.map((s, i) => {
        const iso = current[s.id]
        const at = iso ? new Date(iso) : s === next ? new Date() : null
        return at ? { index: i, code: spotCode(s.id), at } : null
      }),
    }

    readCard({ card, serial: null })
  }, [stage, readCard])

  /**
   * 시연용 — 「지점 n곳을 돌고 온 착」을 읽은 것으로 친다.
   *
   * 착의 핵심은 여러 곳을 돌고 **한 번에** 등록하는 것인데, 폴백은 한 곳씩만
   * 늘어나서 그 장면이 안 나온다. 발표에서 이 동작을 보여주려면 필요하다.
   */
  const simulateVisits = useCallback(
    (n: number) => {
      const at = new Date()
      const card: CardData = {
        slots: stage.spots.map((s, i) =>
          i < n ? { index: i, code: spotCode(s.id), at } : null,
        ),
      }
      readCard({ card, serial: null })
    },
    [stage, readCard],
  )

  const confirmStamp = useCallback(() => {
    const completing = overlay?.kind === 'stamp' && overlay.completing
    setOverlay(null)
    if (completing) {
      markCelebrated(stage.id)
      setScreen('certificate')
    }
  }, [overlay, stage.id])

  const openScan = useCallback(() => setOverlay({ kind: 'scan' }), [])

  return (
    <div className="frame">
      <InkFilters />

      {/* 탭 화면은 늘 깔아둔다 — 상세가 밀려들어올 때 뒤에 보여야 한다 */}
      {screen !== 'onboarding' && (
        <div className="absolute inset-0 flex flex-col">
          <div className="min-h-0 flex-1">
            {tab === 'tour' && (
              <Home
                stage={stage}
                collected={collected}
                onPick={pick}
                onScan={openScan}
                onReset={reset}
                onOpenDemo={() => setOverlay({ kind: 'demo' })}
              />
            )}
            {tab === 'journal' && (
              <Journal
                stage={stage}
                collected={collected}
                onOpenCertificate={() => setScreen('certificate')}
              />
            )}
            {tab === 'stages' && (
              <Stages
                stages={STAGES}
                current={stage}
                countOf={(id) => Object.keys(snapshot.byStage[id] ?? {}).length}
                onSwitch={switchStage}
              />
            )}
          </div>
          <TabBar active={tab} onChange={setTab} collected={Object.keys(collected).length} />
        </div>
      )}

      <AnimatePresence initial={false}>
        {screen === 'onboarding' && (
          <motion.div
            key="onboarding"
            className="absolute inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Onboarding stage={stage} onStart={start} />
          </motion.div>
        )}

        {screen === 'detail' && spot && (
          <motion.div
            key="detail"
            className="absolute inset-0 z-10"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <SpotDetail
              stage={stage}
              spot={spot}
              collectedAt={collected[spot.id] ?? null}
              onBack={() => setScreen('tab')}
              onScan={openScan}
            />
          </motion.div>
        )}

        {screen === 'certificate' && (
          <motion.div
            key="certificate"
            className="absolute inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Certificate
              stage={stage}
              collected={collected}
              onClose={() => setScreen('tab')}
              onRestart={reset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overlay?.kind === 'scan' && (
          <ScanSheet
            key="scan"
            stage={stage}
            onRead={readCard}
            onSimulate={simulate}
            onClose={() => setOverlay(null)}
          />
        )}

        {overlay?.kind === 'stamp' && (
          <StampReveal
            key="stamp"
            stage={stage}
            spots={overlay.spots}
            before={overlay.before}
            completing={overlay.completing}
            onConfirm={confirmStamp}
          />
        )}

        {overlay?.kind === 'demo' && (
          <DemoPanel
            key="demo"
            stage={stage}
            onSimulateCard={simulateVisits}
            onClose={() => setOverlay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
