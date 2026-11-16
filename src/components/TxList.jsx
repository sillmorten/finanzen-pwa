import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { fmtEUR, dateLabel } from '../lib/format'
import { Card } from './ui'

/** Buchungsliste, nach Tagen gruppiert */
export default function TxList({ txs, onEdit, hidden = false }) {
  const { state } = useStore()
  const other = (t) => {
    const o = state.transactions.find((x) => x.transferId === t.transferId && x.id !== t.id)
    return state.accounts.find((a) => a.id === o?.accountId)?.name || 'anderes Konto'
  }
  const label = (t) => {
    if (!t.transferId) return t.note || (t.type === 'income' ? 'Einzahlung' : 'Auszahlung')
    const base = t.type === 'income' ? `Von ${other(t)}` : `An ${other(t)}`
    return t.note ? `${t.note} · ${base}` : `Umbuchung · ${base}`
  }
  const groups = []
  for (const t of txs) {
    const g = groups[groups.length - 1]
    if (g && g.date === t.date) g.items.push(t)
    else groups.push({ date: t.date, items: [t] })
  }
  return groups.map((g) => (
    <div key={g.date} className="mb-3">
      <div className="text-xs text-muted px-1 mb-1.5">{dateLabel(g.date)}</div>
      <Card className="!p-0 divide-y divide-line/60 overflow-hidden">
        {g.items.map((t) => (
          <button key={t.id} onClick={() => onEdit(t)} className="w-full flex items-center gap-3 px-4 py-3 min-h-15 text-left active:bg-surface-2">
            <span className={`size-10 rounded-xl grid place-items-center shrink-0 ${t.transferId ? 'bg-sky-400/15 text-sky-300' : t.type === 'income' ? 'bg-save/15 text-save' : 'bg-spend/15 text-spend'}`}>
              {t.transferId ? <ArrowLeftRight size={19} /> : t.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
            </span>
            <span className="flex-1 min-w-0 font-medium truncate">{label(t)}</span>
            <span className={`tabular font-semibold ${t.type === 'income' ? 'text-save' : 'text-white'}`}>
              {t.type === 'income' ? '+' : '−'}{hidden ? '•••••' : fmtEUR(t.amount)}
            </span>
          </button>
        ))}
      </Card>
    </div>
  ))
}

export const sortTx = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
