import { positionValue } from '../lib/finance'
import { fmtEUR, fmtNum } from '../lib/format'
import { hasAutoPrice } from '../lib/prices'
import { ETFS } from '../lib/instruments'

const STOCK = new Set(ETFS.filter((e) => e.stock).map((e) => e.isin))
import { Card } from './ui'

const pct = (v) => `${v > 0 ? '+' : ''}${v.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} %`

export default function PositionList({ positions, onEdit, hidden = false }) {
  if (!positions.length) return null
  const total = positions.reduce((s, p) => s + positionValue(p), 0)
  return (
    <Card className="!p-0 divide-y divide-line/60 overflow-hidden">
      {positions.map((p) => {
        const v = positionValue(p)
        const gain = p.buyValue ? v - p.buyValue : null
        return (
          <button key={p.id} onClick={() => onEdit(p)} className="w-full text-left px-4 py-3 active:bg-surface-2">
            <div className="flex items-center gap-3">
              <span className={`size-11 rounded-xl grid place-items-center text-[11px] font-bold shrink-0 ${p.kind === 'crypto' ? 'bg-amber-500/15 text-amber-300' : p.kind === 'etf' ? 'bg-sky-500/15 text-sky-300' : 'bg-surface-2 text-muted'}`}>
                {p.kind === 'crypto' ? p.symbol.slice(0, 4) : p.kind === 'etf' ? (STOCK.has(p.isin) ? p.symbol.replace('.DE', '').slice(0, 4) : 'ETF') : '•'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium truncate">{p.name}</span>
                <span className="block text-xs text-muted tabular truncate">
                  {hidden ? '•••' : fmtNum(p.amount)} × {fmtEUR(p.price)}
                  {!hasAutoPrice(p) && ' · manuell'}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block font-semibold tabular">{hidden ? '•••••' : fmtEUR(v)}</span>
                {gain != null ? (
                  <span className={`block text-xs tabular ${gain >= 0 ? 'text-save' : 'text-spend'}`}>{hidden ? '' : `${gain >= 0 ? '+' : ''}${fmtEUR(gain)} · `}{pct((gain / p.buyValue) * 100)}</span>
                ) : p.change != null ? (
                  <span className={`block text-xs tabular ${p.change >= 0 ? 'text-save' : 'text-spend'}`}>{pct(p.change)} heute</span>
                ) : (
                  <span className="block text-xs text-muted tabular">{total ? Math.round((v / total) * 100) : 0} %</span>
                )}
              </span>
            </div>
          </button>
        )
      })}
    </Card>
  )
}
