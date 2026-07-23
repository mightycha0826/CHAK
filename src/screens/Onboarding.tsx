import { motion } from 'motion/react'
import type { Stage } from '../content/index.ts'
import Icon from '../components/Icon.tsx'
import Photo, { PhotoCredit } from '../components/Photo.tsx'

interface Props {
  stage: Stage
  onStart: () => void
}

const EASE = [0.22, 0.61, 0.36, 1] as const

/**
 * 표지.
 *
 * 도록의 앞표지처럼 사진 한 장이 지면을 다 쓰고, 제호와 무대명만 얹는다.
 * 사진이 없으면 검정 표지로 떨어진다 — 발표장에서 이미지 하나 때문에
 * 첫 화면이 깨지면 안 된다.
 */
export default function Onboarding({ stage, onStart }: Props) {
  const cover = stage.cover

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-black text-white">
      {cover && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE }}
            className="absolute inset-0"
          >
            <Photo
              name={cover.photo}
              position={cover.position}
              eager
              className="h-full w-full object-cover"
            />
          </motion.div>
          {/* 위는 얕게, 아래는 완전히 눌러 글자가 앉을 자리를 만든다 */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(13,12,9,0.58) 0%, rgba(13,12,9,0.28) 26%, rgba(13,12,9,0.72) 56%, rgba(13,12,9,0.96) 76%, #0d0c09 88%)',
            }}
          />
        </>
      )}

      <div className="relative flex flex-1 flex-col px-6 pb-8 pt-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-1 flex-col"
        >
          {/* 제호 — 낙관처럼 붉은 네모 안에 한 글자 */}
          <div className="flex items-center gap-2.5">
            <span
              className="relic flex h-9 w-9 items-center justify-center bg-seal text-[22px] leading-none text-white"
              aria-hidden="true"
            >
              착
            </span>
            <span className="text-[15px] font-bold tracking-[0.2em] text-white/70">CHAK</span>
          </div>

          <div className="mt-auto">
            <p className="text-[13px] font-semibold text-white/50">
              {stage.region} · {stage.name}
            </p>

            <h1 className="relic mt-4 text-[40px] leading-[1.26] text-white">
              갖다 대면
              <br />
              이야기가 열립니다
            </h1>

            <p className="mt-5 max-w-[27ch] text-[15px] font-medium leading-[1.72] text-white/60">
              착을 들고 지점을 도세요. 다녀온 자리마다 도장이 찍히고, 마지막에
              한 번 읽으면 수첩이 채워집니다. 앱도, 로그인도 필요 없습니다.
            </p>

            <div className="mt-8 flex items-end gap-4 border-t border-white/15 pt-5">
              <div className="flex-1">
                <p className="text-[12.5px] font-semibold text-white/45">이번 무대</p>
                <p className="relic mt-1.5 text-[27px] text-white">{stage.name}</p>
              </div>
              <p className="pb-1 text-[13px] font-bold text-white/45 tabular-nums">
                도장 {stage.spots.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45, ease: EASE }}
          className="btn mt-7 shrink-0 bg-white text-black"
          onClick={onStart}
        >
          답사 시작하기
          <Icon name="chevron" size={18} strokeWidth={2.4} />
        </motion.button>

        {cover && (
          <PhotoCredit
            name={cover.photo}
            className="mt-3 shrink-0 text-center text-[10.5px] font-medium text-white/30"
          />
        )}
      </div>
    </div>
  )
}
