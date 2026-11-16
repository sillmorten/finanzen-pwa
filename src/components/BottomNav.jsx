import { CreditCard, PiggyBank, ChartLine, Plus } from 'lucide-react'

const TABS = [
  { id: 'accounts', label: 'Konten', icon: CreditCard },
  null,
  { id: 'savings', label: 'Sparen', icon: PiggyBank },
  { id: 'depot', label: 'Depot', icon: ChartLine },
]

export default function BottomNav({ tab, onTab, onAdd }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg/90 backdrop-blur border-t border-line/60 pb-safe">
      <div className="mx-auto max-w-lg grid grid-cols-4 items-end px-2 pt-1.5">
        {TABS.map((t) =>
          t === null ? (
            <div key="fab" className="flex justify-center">
              <button
                onClick={onAdd}
                aria-label="Neue Buchung"
                className="-mt-7 size-16 rounded-full bg-save text-bg grid place-items-center shadow-lg shadow-save/25 active:scale-95 transition-transform"
              >
                <Plus size={32} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`flex flex-col items-center gap-1 min-h-14 justify-center text-[11px] font-medium ${tab === t.id ? 'text-save' : 'text-muted'}`}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <t.icon size={24} strokeWidth={tab === t.id ? 2.4 : 1.8} />
              {t.label}
            </button>
          ),
        )}
      </div>
    </nav>
  )
}
