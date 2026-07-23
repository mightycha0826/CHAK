/**
 * 인라인 SVG 아이콘. 이모지는 쓰지 않는다 — 기기마다 모양이 달라지고
 * 답사 수첩 무드가 무너지기 때문.
 */

const PATHS = {
  back: 'M15 5 8 12l7 7',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
  chevron: 'M9 5l7 7-7 7',
  nfc: 'M6.5 17.5a8 8 0 0 1 0-11M10 15a4 4 0 0 1 0-6M17.5 6.5a8 8 0 0 1 0 11M14 9a4 4 0 0 1 0 6',
  touch: 'M12 3v9M12 12l-3.5 1.5a2 2 0 0 0-1 2.8l2 3.5a2 2 0 0 0 1.7 1h4.6a2 2 0 0 0 2-1.7l.7-4.6a2 2 0 0 0-1.4-2.2L12 12Z',
  book: 'M5 4.5h6.5a2 2 0 0 1 2 2V20a1.6 1.6 0 0 0-1.6-1.6H5V4.5ZM19 4.5h-5.5v13.9H19V4.5Z',
  map: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5ZM9 4v13.5M15 6.5V20',
  reset: 'M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5',
  share: 'M12 15V4M12 4 8.5 7.5M12 4l3.5 3.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13',
  award: 'M12 3.5 14.3 8l5 .7-3.6 3.5.9 5-4.6-2.4L7.4 17l.9-5L4.7 8.7l5-.7L12 3.5Z',
  pin: 'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z',
  walk: 'M6 21l3-6.5-2-3.5.5-4L12 5M12 5l3.5 2.5.5 4M9 11l4.5 1 2 4.5.5 4.5',
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 13.5l9 5 9-5',
} as const

export type IconName = keyof typeof PATHS

interface Props {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}

export default function Icon({ name, size = 20, strokeWidth = 1.7, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
