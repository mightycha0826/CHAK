import Icon, { type IconName } from './Icon.tsx'

export type TabId = 'tour' | 'journal' | 'stages'

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'tour', label: '답사', icon: 'map' },
  { id: 'journal', label: '수첩', icon: 'book' },
  { id: 'stages', label: '무대', icon: 'layers' },
]

interface Props {
  active: TabId
  onChange: (id: TabId) => void
  /** 수첩 탭에 표시할 수집 수 */
  collected?: number
}

export default function TabBar({ active, onChange, collected = 0 }: Props) {
  return (
    <nav className="flex shrink-0 border-t border-line bg-surface pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
      {TABS.map((tab) => {
        const on = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex flex-1 flex-col items-center gap-1 py-1"
            aria-current={on ? 'page' : undefined}
            aria-label={tab.label}
          >
            <span className={on ? 'text-ink' : 'text-ink-3'}>
              <Icon name={tab.icon} size={22} strokeWidth={on ? 2.1 : 1.7} />
            </span>
            <span
              className={[
                'text-[11px]',
                on ? 'font-bold text-ink' : 'font-semibold text-ink-3',
              ].join(' ')}
            >
              {tab.label}
            </span>
            {tab.id === 'journal' && collected > 0 && (
              <span className="absolute right-[26%] top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-seal px-1 text-[10px] font-bold text-white">
                {collected}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
