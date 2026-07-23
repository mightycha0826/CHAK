/**
 * 도장 잉크가 고르게 묻지 않은 느낌을 내는 SVG 필터 정의.
 * 앱 루트에 한 번만 올려두고 id로 참조한다. 그리는 건 없다.
 */
export default function InkFilters() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <filter id="chak-bleed">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045 0.06"
            numOctaves={4}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={3.2}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="chak-bleed-strong">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.07"
            numOctaves={4}
            seed={19}
            result="noise2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise2"
            scale={4.6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
