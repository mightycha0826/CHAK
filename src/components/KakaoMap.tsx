import { useEffect, useRef } from 'react'
import type { Stage } from '../content/index.ts'

interface Props {
  stage: Stage
  collected: Record<string, string>
  onPick: (spotId: string) => void
  /** 키가 없거나 SDK 로드에 실패하면 호출 — 도식도로 넘어간다 */
  onUnavailable: () => void
}

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined

let sdkPromise: Promise<boolean> | null = null

/**
 * 카카오 지도 SDK를 한 번만 로드한다.
 * JS 키는 도메인 제한 방식이라 클라이언트에 노출되는 게 정상이다.
 */
function loadSdk(): Promise<boolean> {
  if (sdkPromise) return sdkPromise
  if (!KAKAO_KEY) return (sdkPromise = Promise.resolve(false))

  sdkPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`
    script.onload = () => {
      const kakao = (window as unknown as { kakao?: KakaoNamespace }).kakao
      if (!kakao?.maps) return resolve(false)
      kakao.maps.load(() => resolve(true))
    }
    script.onerror = () => resolve(false)
    document.head.appendChild(script)

    // 발표장 와이파이가 느릴 때 무한정 기다리지 않는다
    setTimeout(() => resolve(false), 6000)
  })
  return sdkPromise
}

export default function KakaoMap({ stage, collected, onPick, onUnavailable }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  // 콜백이 바뀌어도 지도를 다시 만들지 않도록 최신 값만 참조한다
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  const geo = stage.map.geo

  useEffect(() => {
    let cancelled = false
    if (!geo) {
      onUnavailable()
      return
    }

    loadSdk().then((ok) => {
      if (cancelled) return
      const kakao = (window as unknown as { kakao?: KakaoNamespace }).kakao
      if (!ok || !kakao?.maps || !boxRef.current) {
        onUnavailable()
        return
      }

      const map = new kakao.maps.Map(boxRef.current, {
        center: new kakao.maps.LatLng(geo.center.lat, geo.center.lng),
        level: geo.level,
      })

      for (const [i, spot] of stage.spots.entries()) {
        const at = geo.points[spot.id]
        if (!at) continue
        const got = !!collected[spot.id]

        const el = document.createElement('button')
        el.type = 'button'
        el.setAttribute('aria-label', spot.title)
        el.className = 'kakao-pin' + (got ? ' is-got' : '')
        el.textContent = got ? '✓' : String(i + 1)
        el.onclick = () => pickRef.current(spot.id)

        new kakao.maps.CustomOverlay({
          map,
          position: new kakao.maps.LatLng(at.lat, at.lng),
          content: el,
          yAnchor: 0.5,
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [stage, collected, geo, onUnavailable])

  return <div ref={boxRef} className="h-full w-full" />
}

/* ── 카카오 SDK 최소 타입 ─────────────────────────────────────── */
interface KakaoNamespace {
  maps: {
    load(cb: () => void): void
    Map: new (el: HTMLElement, opts: { center: unknown; level: number }) => unknown
    LatLng: new (lat: number, lng: number) => unknown
    CustomOverlay: new (opts: Record<string, unknown>) => unknown
  }
}
