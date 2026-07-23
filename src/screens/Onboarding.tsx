import { useState } from 'react'
import { motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'

interface Props {
  stage: Stage
  onStart: () => void
}

const EASE = [0.22, 0.61, 0.36, 1] as const

/**
 * 온보딩.
 *
 * 무대 사진을 깔고 그 위를 어둡게 눌러 흰 글자를 얹는다. 사진이 없거나
 * 로드에 실패하면 그냥 검정 화면이 된다 — 발표장에서 이미지 하나 때문에
 * 첫 화면이 깨지는 일은 없어야 한다.
 */
export default function Onboarding({ stage, onStart }: Props) {
  const [coverFailed, setCoverFailed] = useState(false)
  const cover = coverFailed ? undefined : stage.cover

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-black text-white">
      {cover && (
        <>
          <motion.img
            key={cover.src}
            src={cover.src}
            alt=""
            aria-hidden="true"
            onError={() => setCoverFailed(true)}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: cover.position ?? 'center' }}
          />
          {/* 위는 사진이 보이도록 얕게, 아래는 글자가 앉도록 완전히 눌러 검정으로 */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.34) 24%, rgba(0,0,0,0.74) 54%, rgba(0,0,0,0.96) 74%, #000 84%)',
            }}
          />
        </>
      )}

      <div className="relative flex flex-1 flex-col px-6 pb-8 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-1 flex-col"
        >
          <span className="text-[34px] font-extrabold tracking-[-0.055em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            착 <span className="text-white/40">chak</span>
          </span>

          <div className="mt-auto">
            <h1 className="text-[38px] leading-[1.22] tracking-[-0.045em]">
              갖다 대면
              <br />
              이야기가 열립니다
            </h1>

            <p className="mt-5 max-w-[26ch] text-[15.5px] font-medium leading-[1.7] text-white/60">
              착을 들고 지점을 도세요. 지점마다 놓인 자리에 착을 대면 그 자리의
              도장이 착에 새겨지고, 나중에 폰에 대면 수첩으로 옮겨집니다.
            </p>

            <div className="mt-9 h-px bg-white/14" />

            <div className="flex items-end gap-4 pt-6">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white/45">이번 무대</p>
                <p className="mt-1.5 text-[26px] font-extrabold tracking-[-0.04em]">
                  {stage.name}
                </p>
                <p className="mt-1 text-[13.5px] font-medium text-white/55">
                  {stage.region} · 도장 {stage.spots.length}개
                </p>
              </div>
              <span className="pb-1 text-[13px] font-semibold text-white/35 tabular-nums">
                01
              </span>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.42, ease: EASE }}
          className="btn mt-8 shrink-0 bg-white text-black"
          onClick={onStart}
        >
          답사 시작하기
          <Icon name="chevron" size={18} strokeWidth={2.4} />
        </motion.button>

        {cover?.credit && (
          <p className="mt-3 shrink-0 text-center text-[11px] font-medium text-white/30">
            {cover.credit}
          </p>
        )}
      </div>
    </div>
  )
}
