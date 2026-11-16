import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { accountBalance, monthFlow, limitUsage } from '../lib/finance'
import { fmtEUR0, monthKey, monthLabel, shiftMonth } from '../lib/format'
import { Card, Segmented } from '../components/ui'
import BankCard from '../components/BankCard'
import TxList, { sortTx } from '../components/TxList'
import LimitBar from '../components/LimitBar'

/** Vollbild-Detailansicht einer Karte mit allen Buchungen */
export default function CardDetail({ account, hidden, onClose, onBook, onEditTx, onEditAccount }) {
  const { state } = useStore()
  const [key, setKey] = useState(monthKey())
  const [allTime, setAllTime] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [onClose])

  const txs = useMemo(
    () =>
      state.transactions
        .filter((t) => t.accountId === account.id && (allTime || t.date.startsWith(key)) && (filter === 'all' || t.type === filter))
        .sort(sortTx),
    [state.transactions, account.id, key, allTime, filter],
  )
  const flow = monthFlow(state, account.id, key)
  const usage = limitUsage(state, account, key)
  const isCurrent = key === monthKey()
  const m = (v) => (hidden ? '•••' : fmtEUR0(v))

  return (
    <div className="fixed inset-0 z-[45] bg-bg overflow-y-auto animate-fade" role="dialog" aria-label={account.name}>
      <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur pt-safe">
        <div className="mx-auto max-w-lg flex items-center gap-2 px-2 h-16">
          <button onClick={onClose} className="size-12 grid place-items-center rounded-full active:bg-surface" aria-label="Zurück"><ArrowLeft size={24} /></button>
          <h2 className="text-xl font-bold truncate flex-1">{account.name}</h2>
          <button onClick={onEditAccount} className="size-12 grid place-items-center rounded-full active:bg-surface text-muted" aria-label="Karte bearbeiten"><Pencil size={20} /></button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pb-32">
        <div className="px-[4%]"><BankCard account={account} balance={accountBalance(state, account)} hidden={hidden} /></div>

        {/* Monat */}
        <div className="flex items-center justify-between mt-5">
          <button onClick={() => { setAllTime(false); setKey(shiftMonth(key, -1)) }} className="size-11 grid place-items-center rounded-full bg-surface" aria-label="Vorheriger Monat"><ChevronLeft /></button>
          <button onClick={() => setAllTime((a) => !a)} className="min-h-11 px-4 rounded-full font-semibold">
            {allTime ? 'Alle Zeiträume' : monthLabel(key)}
          </button>
          <button onClick={() => { setAllTime(false); setKey(shiftMonth(key, 1)) }} disabled={isCurrent && !allTime} className="size-11 grid place-items-center rounded-full bg-surface disabled:opacity-30" aria-label="Nächster Monat"><ChevronRight /></button>
        </div>

        {!allTime && (
          <>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Card className="!p-3">
                <div className="text-xs text-muted">Eingänge</div>
                <div className="text-lg font-semibold text-save tabular">+{m(flow.income)}</div>
              </Card>
              <Card className="!p-3">
                <div className="text-xs text-muted">Ausgänge</div>
                <div className="text-lg font-semibold text-spend tabular">−{m(flow.expense)}</div>
              </Card>
            </div>
            {usage && <div className="mt-2"><LimitBar usage={usage} label="Limit" hidden={hidden} /></div>}
          </>
        )}

        <div className="mt-5">
          <Segmented value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'Alle' },
            { value: 'income', label: 'Eingänge', activeCls: 'bg-save/20 text-save' },
            { value: 'expense', label: 'Ausgänge', activeCls: 'bg-spend/20 text-spend' },
          ]} />
        </div>

        <div className="mt-4">
          {txs.length ? (
            <TxList txs={txs} onEdit={onEditTx} hidden={hidden} />
          ) : (
            <p className="text-sm text-muted text-center py-8">Keine Buchungen {allTime ? 'auf dieser Karte' : `im ${monthLabel(key)}`}.</p>
          )}
        </div>
      </div>

      {/* Aktionen unten, mit dem Daumen erreichbar */}
      <div className="fixed bottom-0 inset-x-0 bg-bg/90 backdrop-blur border-t border-line/60 pb-safe">
        <div className="mx-auto max-w-lg grid grid-cols-2 gap-2 p-3">
          <button onClick={() => onBook('income')} className="min-h-14 rounded-2xl bg-save/15 text-save font-semibold flex items-center justify-center gap-2 active:bg-save/25"><ArrowDownLeft size={20} /> Einzahlung</button>
          <button onClick={() => onBook('expense')} className="min-h-14 rounded-2xl bg-spend/15 text-spend font-semibold flex items-center justify-center gap-2 active:bg-spend/25"><ArrowUpRight size={20} /> Auszahlung</button>
        </div>
      </div>
    </div>
  )
}
