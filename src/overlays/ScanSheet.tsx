import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import { nfcSupport, watchCards, type CardRead, type NfcSupport } from '../nfc/webNfc.ts'
import Icon from '../components/Icon.tsx'
import { haptic } from '../lib/format.ts'

interface Props {
  stage: Stage
  onRead: (read: CardRead) => void
  /** Web NFC를 못 쓰는 환경에서 「한 곳 더 다녀온 착」을 흉내 낸다 */
  onSimulate: () => void
  onClose: () => void
}

/**
 * 착 읽기.
 *
 * 지점마다 대는 화면이 아니다. 관람객은 현충사를 돌며 각 지점 리더에 착을
 * 대고, 여기서는 **그 착 한 장을 읽어 누적분을 통째로 등록한다.** 그래서
 * 지점을 고를 필요가 없고, 한 번 대면 여러 도장이 한꺼번에 들어올 수 있다.
 *
 * 실물 착(Web NFC)과 눌러서 체험하는 폴백을 동시에 열어둔다. 발표장에서
 * 폰이 MIFARE Classic을 못 읽어도 시연이 멈추지 않아야 한다.
 */
export default function ScanSheet({ stage, onRead, onSimulate, onClose }: Props) {
  const [support, setSupport] = useState<NfcSupport>('unsupported')
  const [note, setNote] = useState('')
  const done = useRef(false)

  useEffect(() => {
    const s = nfcSupport()
    setSupport(s)
    if (s !== 'ready') return

    const controller = new AbortController()
    let noteTimer: ReturnType<typeof setTimeout> | null = null

    const flash = (msg: string) => {
      setNote(msg)
      if (noteTimer) clearTimeout(noteTimer)
      noteTimer = setTimeout(() => setNote(''), 3200)
    }

    watchCards(
      (read) => {
        if (done.current) return
        done.current = true
        controller.abort()
        onRead(read)
      },
      () => {
        if (done.current) return
        flash('착 카드가 아니에요. 구매하신 착을 대주세요.')
      },
      controller.signal,
    )

    return () => {
      controller.abort()
      if (noteTimer) clearTimeout(noteTimer)
    }
  }, [onRead])

  function simulate() {
    if (done.current) return
    done.current = true
    haptic(14)
    onSimulate()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-30 flex flex-col bg-black text-white"
    >
      <div className="flex h-14 shrink-0 items-center px-2">
        <span className="flex-1" />
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center text-white/70"
          aria-label="닫기"
        >
          <Icon name="close" size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center px-7 pb-10 text-center">
        <span className="text-[13px] font-semibold text-white/45">{stage.name}</span>
        <h2 className="relic mt-3 text-[27px] leading-[1.28] text-white">
          착을 대주세요
        </h2>
        <p className="mt-3 text-[14px] font-medium leading-relaxed text-white/55">
          다녀온 지점의 도장이
          <br />
          한 번에 수첩으로 들어옵니다
        </p>

        <div className="flex flex-1 items-center">
          <button
            onClick={simulate}
            className="relative flex h-[200px] w-[200px] items-center justify-center"
            aria-label="눌러서 체험하기"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute rounded-full border-[1.5px] border-seal"
                initial={{ width: 82, height: 82, opacity: 0.75 }}
                animate={{ width: 200, height: 200, opacity: 0 }}
                transition={{
                  duration: 2,
                  delay: i * 0.66,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-[82px] w-[82px] items-center justify-center rounded-full bg-seal text-white"
            >
              <Icon name="nfc" size={36} strokeWidth={1.8} />
            </motion.span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 rounded-btn bg-white/[0.08] px-4 py-3.5 text-[13px] font-medium text-white/70">
          <Icon name={support === 'ready' ? 'nfc' : 'touch'} size={17} />
          <span>
            {support === 'ready'
              ? '착을 폰 뒷면에 대거나, 원을 눌러 체험하세요'
              : '이 기기에서는 원을 눌러 체험합니다'}
          </span>
        </div>

        {note && <p className="mt-3 text-[13px] font-semibold text-seal">{note}</p>}
      </div>
    </motion.div>
  )
}
