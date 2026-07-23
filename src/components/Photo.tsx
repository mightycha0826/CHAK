import { useState } from 'react'
import { PHOTO_CREDITS } from '../content/photos.ts'

interface Props {
  /** `photos.ts`의 키. 없는 키를 주면 아무것도 그리지 않는다. */
  name?: string
  alt?: string
  /** 잘리는 기준점 — 피사체가 남도록 (CSS object-position) */
  position?: string
  className?: string
  /** 첫 화면에 보이는 사진은 지연 로딩하지 않는다 */
  eager?: boolean
}

/**
 * 사진 한 장.
 *
 * 뜨기 전에는 20px 축소본을 흐리게 깔아 레이아웃이 덜컥거리지 않게 하고,
 * 파일이 없거나 로드에 실패하면 조용히 사라진다 — 발표장에서 사진 하나
 * 때문에 화면이 깨지면 안 된다.
 */
export default function Photo({ name, alt = '', position, className, eager }: Props) {
  const [failed, setFailed] = useState(false)
  const credit = name ? PHOTO_CREDITS[name] : undefined

  if (!name || !credit || failed) return null

  return (
    <img
      src={`/photos/${name}.jpg`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      style={{
        objectPosition: position ?? 'center',
        // 로드 전에는 흐린 축소본이 자리를 지킨다
        backgroundImage: credit.blur ? `url(${credit.blur})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: position ?? 'center',
      }}
    />
  )
}

/**
 * 출처 표기.
 *
 * CC BY / CC BY-SA는 저작자 표시가 **조건**이다. 지워도 되는 장식이 아니라
 * 라이선스를 지키는 부분이므로 화면에 남긴다.
 */
export function PhotoCredit({ name, className }: { name?: string; className?: string }) {
  const credit = name ? PHOTO_CREDITS[name] : undefined
  if (!credit) return null

  const author = credit.author?.replace(/\s+/g, ' ').trim()
  return (
    <span className={className}>
      사진 {author ? `${author} · ` : ''}
      {credit.license} · 위키미디어 공용
    </span>
  )
}
