import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { useStore } from '../lib/store'
import { monthStats, pctChange } from '../lib/finance'
import { EXPENSE_CATEGORIES, getCategory } from '../lib/categories'
import { fmtEUR, fmtEUR0, fmtPct, monthKey, monthLabel, shiftMonth, dateLabel } from '../lib/format'
import { Card, SectionTitle, Empty, Progress } from '../components/ui'

export default function Transactions({ onEdit, onSettings }) {
  const { state } = useStore()
  const [key, setKey] = useState(monthKey())
  const [filter, setFilter] = useState('all')
  const cur = useMemo(() => monthStats(state, key), [state, key])
  const prevKey = shiftMonth(key, -1)
  const prev = useMemo(() => monthStats(state, prevKey), [state, prevKey])
  const isCurrent = key === monthKey()

  const list = useMemo(() => {
    const tx = state.transactions
      .filter((t) => t.date.startsWith(key))
      .filter((t) => filter === 'all' || (filter === 'income' ? t.type === 'income' : t.category === filter && t.type === 'expense'))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    const groups = []
    for (const t of tx) {
      const g = groups[groups.length - 1]
      if (g && g.date === t.date) g.items.push(t)
      else groups.push({ date: t.date, items: [t] })
    }
    return groups
  }, [state.transactions, key, filter])

  const spentDelta = pctChange(cur.spent, prev.spent)
  const maxCat = Math.max(1, ...cur.byCategory.map((c) => c.value), ...prev.byCategory.map((c) => c.value))

  return (
    <div>
      {/* Monatsauswahl */}
      <div className="flex items-center justify-between">
        <button onClick={() => setKey(shiftMonth(key, -1))} className="size-12 grid place-items-center rounded-full bg-surface" aria-label="Vorheriger Monat"><ChevronLeft /></button>
        <button onClick={() => setKey(monthKey())} className="text-lg font-semibold min-h-12 px-3">{monthLabel(key)}</button>
        <button onClick={() => setKey(shiftMonth(key, 1))} disabled={isCurrent} className="size-12 grid place-items-center rounded-full bg-surface disabled:opacity-30" aria-label="Nächster Monat"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Card className="!p-3">
          <div className="text-xs text-muted">Einnahmen</div>
          <div className="text-lg font-semibold text-income tabular">{fmtEUR0(cur.income)}</div>
          <Delta curr={cur.income} prev={prev.income} goodWhenUp />
        </Card>
        <Card className="!p-3">
          <div className="text-xs text-muted">Ausgaben</div>
          <div className="text-lg font-semibold text-spend tabular">{fmtEUR0(cur.spent)}</div>
          <Delta curr={cur.spent} prev={prev.spent} />
        </Card>
      </div>

      {/* Vergleich zum Vormonat */}
      <SectionTitle>Vergleich zu {monthLabel(prevKey, true)}</SectionTitle>
      <Card>
        <div className="flex gap-4 text-xs text-muted mb-3">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-white/80" />{monthLabel(key, true)}</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-white/25" />{monthLabel(prevKey, true)}</span>
          {spentDelta != null && <span className="ml-auto">Gesamt <span className={spentDelta > 0 ? 'text-spend' : 'text-save'}>{fmtPct(spentDelta)}</span></span>}
        </div>
        <ul className="space-y-3">
          {cur.byCategory.map((c, i) => {
            const p = prev.byCategory[i]
            const d = pctChange(c.value, p.value)
            return (
              <li key={c.id}>
                <div className="flex items-center text-sm mb-1">
                  <span>{c.emoji} {c.label}</span>
                  <span className="ml-auto tabular">{fmtEUR0(c.value)}</span>
                  <span className={`w-16 text-right text-xs tabular ${d == null ? 'text-muted' : d > 0 ? 'text-spend' : d < 0 ? 'text-save' : 'text-muted'}`}>{d == null ? 'neu' : fmtPct(d)}</span>
                </div>
                <Progress value={(c.value / maxCat) * 100} color={c.color} className="h-2" />
                <Progress value={(p.value / maxCat) * 100} color={c.color + '55'} className="h-1.5 mt-1" />
              </li>
            )
          })}
        </ul>
        {(cur.recExpense > 0 || cur.recIncome > 0) && (
          <button onClick={onSettings} className="flex items-center gap-1.5 text-xs text-muted mt-4 min-h-9">
            <Repeat size={13} /> Enthält monatliche Fixposten ({fmtEUR0(cur.recExpense)} Ausgaben, {fmtEUR0(cur.recIncome)} Einnahmen)
          </button>
        )}
      </Card>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mt-6 pb-1">
        {[{ id: 'all', label: 'Alle' }, { id: 'income', label: '💼 Einnahmen' }, ...EXPENSE_CATEGORIES.map((c) => ({ id: c.id, label: `${c.emoji} ${c.label}` }))].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-4 min-h-10 text-sm border ${filter === f.id ? 'bg-white text-bg border-white font-medium' : 'border-line text-muted'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {list.length === 0 ? (
        <Empty icon="🧾" title="Keine Buchungen" text="Tippe auf + um eine Ausgabe oder Einnahme zu erfassen." />
      ) : (
        list.map((g) => (
          <div key={g.date} className="mt-4">
            <div className="text-xs text-muted px-1 mb-1.5">{dateLabel(g.date)}</div>
            <Card className="!p-0 divide-y divide-line/60 overflow-hidden">
              {g.items.map((t) => {
                const c = getCategory(t.category)
                return (
                  <button key={t.id} onClick={() => onEdit(t)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-surface-2 min-h-16">
                    <span className="size-10 rounded-xl grid place-items-center text-lg shrink-0" style={{ background: c.color + '22' }}>{c.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium truncate">{t.note || c.label}</span>
                      {t.note && <span className="block text-xs text-muted">{c.label}</span>}
                    </span>
                    <span className={`tabular font-semibold ${t.type === 'income' ? 'text-save' : 'text-white'}`}>
                      {t.type === 'income' ? '+' : '−'}{fmtEUR(t.amount)}
                    </span>
                  </button>
                )
              })}
            </Card>
          </div>
        ))
      )}
    </div>
  )
}

function Delta({ curr, prev, goodWhenUp = false }) {
  const d = pctChange(curr, prev)
  if (d == null || !Number.isFinite(d)) return <div className="text-[11px] text-muted mt-0.5">kein Vormonat</div>
  const good = goodWhenUp ? d >= 0 : d <= 0
  return (
    <div className={`text-[11px] mt-0.5 ${d === 0 ? 'text-muted' : good ? 'text-save' : 'text-spend'}`}>
      {fmtPct(d)} ggü. Vormonat
    </div>
  )
}
