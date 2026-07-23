interface Props {
  /** 도장에 새길 한 글자 */
  motif: string
  size?: number
  /** 아직 얻지 않은 도장 — 빈 자리만 남긴다 */
  empty?: boolean
  /** 잉크 번짐 필터 (획득 연출·인증서에서 켠다) */
  bleed?: boolean | 'strong'
  tilt?: number
  className?: string
}

/**
 * 인주 도장.
 *
 * 앱에서 유일하게 색을 쓰는 요소이자, 유일하게 명조를 쓰는 요소다.
 * 낙관은 고딕으로 파지 않으므로.
 */
export default function Seal({
  motif,
  size = 76,
  empty = false,
  bleed = false,
  tilt = -4,
  className,
}: Props) {
  const stroke = size * 0.06
  const inset = size * 0.085

  if (empty) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <rect
            x={inset}
            y={inset}
            width={size - inset * 2}
            height={size - inset * 2}
            rx={size * 0.035}
            fill="none"
            stroke="var(--color-line-2)"
            strokeWidth={stroke * 0.6}
            strokeDasharray={`${size * 0.06} ${size * 0.05}`}
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        transform: `rotate(${tilt}deg)`,
        filter: bleed ? `url(#chak-bleed${bleed === 'strong' ? '-strong' : ''})` : undefined,
      }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <rect
          x={inset}
          y={inset}
          width={size - inset * 2}
          height={size - inset * 2}
          rx={size * 0.035}
          fill="none"
          stroke="var(--color-seal)"
          strokeWidth={stroke}
        />
        <text
          x="50%"
          y="54%"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-seal)"
          style={{
            fontFamily: 'var(--font-seal)',
            fontWeight: 700,
            fontSize: size * 0.5,
          }}
        >
          {motif}
        </text>
      </svg>
    </div>
  )
}
