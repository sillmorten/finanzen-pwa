import { cardTheme, accountTypeLabel } from '../lib/categories'
import { fmtEUR } from '../lib/format'

/** Bankkarte im Stil bekannter Banking-Apps */
export default function BankCard({ account, balance, hidden = false, className = '', ...rest }) {
  const theme = cardTheme(account.theme)
  return (
    <div
      className={`relative w-full aspect-[1.586] rounded-[22px] p-5 overflow-hidden text-white shadow-xl shadow-black/40 select-none ${className}`}
      style={{ background: theme.bg }}
      {...rest}
    >
      {/* Glanz-Effekte */}
      <div className="absolute -right-16 -top-20 size-56 rounded-full bg-white/10" />
      <div className="absolute -left-10 -bottom-24 size-56 rounded-full bg-black/10" />

      <div className="relative h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-tight truncate drop-shadow-sm">{account.name}</div>
            <div className="text-xs text-white/75 mt-0.5">{accountTypeLabel(account.type)}</div>
          </div>
          <Contactless />
        </div>

        <Chip />

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-white/70">Kontostand</div>
            <div className="text-[clamp(20px,6.6vw,28px)] leading-tight font-bold tabular whitespace-nowrap drop-shadow-sm">{hidden ? '•••••' : fmtEUR(balance)}</div>
          </div>
          {account.last4 && <div className="text-xs font-medium tracking-[0.15em] text-white/85 tabular shrink-0 pb-1">•••• {account.last4}</div>}
        </div>
      </div>
    </div>
  )
}

function Chip() {
  return (
    <svg width="42" height="32" viewBox="0 0 42 32" className="mt-3" aria-hidden="true">
      <rect x="0.5" y="0.5" width="41" height="31" rx="6" fill="#f5d77a" stroke="#c9a842" />
      <path d="M14 1v30M28 1v30M1 11h13M28 11h13M1 21h13M28 21h13" stroke="#c9a842" strokeWidth="1.2" fill="none" />
    </svg>
  )
}

function Contactless() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/80 shrink-0 rotate-90" aria-hidden="true">
      <path d="M8.5 16.5a5 5 0 0 0 0-9" />
      <path d="M12 19a9 9 0 0 0 0-14" />
      <path d="M15.5 21.5a13 13 0 0 0 0-19" />
    </svg>
  )
}

export function AddCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full aspect-[1.586] rounded-[22px] border-2 border-dashed border-line flex flex-col items-center justify-center gap-2 text-muted active:bg-surface"
    >
      <span className="size-14 rounded-full bg-surface-2 grid place-items-center text-3xl text-save">+</span>
      <span className="font-medium">Neues Konto / Karte</span>
    </button>
  )
}
