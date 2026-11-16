import { cardTheme, accountTypeLabel } from '../lib/categories'
import { fmtEUR } from '../lib/format'

// Feine Körnung für den Metall-Look
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Bankkarte im Premium-Metall-Look */
export default function BankCard({ account, balance, perf = null, hidden = false, className = '', ...rest }) {
  const theme = cardTheme(account.theme)
  const dark = theme.ink === 'dark'
  const ink = dark ? 'text-neutral-900' : 'text-white'
  const sub = dark ? 'text-neutral-800/70' : 'text-white/60'

  return (
    <div
      className={`relative w-full aspect-[1.586] rounded-[20px] overflow-hidden select-none ${ink} ${className}`}
      style={{
        background: theme.bg,
        boxShadow: '0 20px 40px -12px rgba(0,0,0,.65), 0 2px 6px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.25), inset 0 -1px 0 rgba(0,0,0,.35)',
      }}
      {...rest}
    >
      {/* gebürstetes Metall */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ background: 'repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 3px)' }} />
      {/* Körnung */}
      <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
      {/* Lichtreflex */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, transparent 28%, rgba(255,255,255,.16) 42%, rgba(255,255,255,.04) 52%, transparent 62%)' }} />
      {/* feine Guilloche-Linien */}
      <svg className="absolute -right-10 -bottom-16 w-[75%] opacity-[0.10]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.6" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => <circle key={i} cx="100" cy="100" r={20 + i * 6} />)}
      </svg>
      {/* Innenkante */}
      <div className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/15 pointer-events-none" />

      <div className="relative h-full flex flex-col p-[6%]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[17px] font-semibold tracking-wide leading-tight truncate" style={{ textShadow: dark ? '0 1px 0 rgba(255,255,255,.5)' : '0 1px 2px rgba(0,0,0,.45)' }}>{account.name}</div>
            <div className={`text-[10px] uppercase tracking-[0.22em] mt-1 ${sub}`}>{accountTypeLabel(account.type)}</div>
          </div>
          {perf ? <PerfPill perf={perf} hidden={hidden} dark={dark} /> : <Monogram dark={dark} />}
        </div>

        <div className="flex items-center gap-3 mt-[5%]">
          <Chip />
          <Contactless className={dark ? 'text-neutral-800/60' : 'text-white/55'} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className={`text-[9px] uppercase tracking-[0.25em] ${sub}`}>Kontostand</div>
            <div
              className="text-[clamp(20px,6.6vw,27px)] leading-tight font-semibold tabular whitespace-nowrap tracking-tight mt-0.5"
              style={{ textShadow: dark ? '0 1px 0 rgba(255,255,255,.55), 0 -1px 0 rgba(0,0,0,.15)' : '0 1px 0 rgba(0,0,0,.5), 0 -1px 0 rgba(255,255,255,.08)' }}
            >
              {hidden ? '•••••' : fmtEUR(balance)}
            </div>
          </div>
          {account.last4 && (
            <div className={`text-[11px] tabular tracking-[0.18em] pb-1 shrink-0 ${sub}`} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              •••• {account.last4}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PerfPill({ perf, hidden, dark }) {
  const up = perf.value >= 0
  const pct = `${up ? '+' : ''}${perf.pct.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
  const color = up ? (dark ? 'text-emerald-800' : 'text-emerald-300') : dark ? 'text-red-800' : 'text-red-300'
  return (
    <div className={`shrink-0 rounded-xl px-2.5 py-1.5 backdrop-blur-md ring-1 ring-inset ${dark ? 'bg-white/35 ring-black/10' : 'bg-black/30 ring-white/15'}`}>
      <div className={`flex items-center justify-end gap-1 text-[13px] font-semibold tabular ${color}`}>
        <span className="text-[9px]">{up ? '▲' : '▼'}</span>
        {hidden ? pct : `${up ? '+' : '−'}${fmtEUR(Math.abs(perf.value))}`}
      </div>
      {!hidden && <div className={`text-[10px] text-right tabular ${dark ? 'text-neutral-800/70' : 'text-white/60'}`}>{pct} {perf.label}</div>}
    </div>
  )
}

function Monogram({ dark }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" className={`shrink-0 ${dark ? 'text-neutral-900/50' : 'text-white/50'}`} aria-hidden="true">
      <path d="M15 2 L28 15 L15 28 L2 15 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M15 8 L22 15 L15 22 L8 15 Z" fill="currentColor" opacity=".55" />
    </svg>
  )
}

function Chip() {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" aria-hidden="true" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.35))' }}>
      <defs>
        <linearGradient id="chipg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f9e7a6" />
          <stop offset=".45" stopColor="#d4ab4f" />
          <stop offset=".7" stopColor="#f3d98a" />
          <stop offset="1" stopColor="#a8822f" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="43" height="33" rx="6.5" fill="url(#chipg)" stroke="#8c6a22" strokeOpacity=".6" />
      <path d="M15 1v9.5a3 3 0 0 1-3 3H1M29 1v9.5a3 3 0 0 0 3 3h11M1 20.5h11a3 3 0 0 1 3 3V33M43 20.5H32a3 3 0 0 0-3 3V33M15 13.5h14v7H15z" stroke="#8c6a22" strokeOpacity=".55" strokeWidth="1" fill="none" />
    </svg>
  )
}

function Contactless({ className = '' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
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
      className="w-full aspect-[1.586] rounded-[20px] border border-dashed border-line flex flex-col items-center justify-center gap-2 text-muted active:bg-surface"
    >
      <span className="size-14 rounded-full bg-surface-2 grid place-items-center text-3xl text-save">+</span>
      <span className="font-medium">Neues Konto / Karte</span>
    </button>
  )
}
