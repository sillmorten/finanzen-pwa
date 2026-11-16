import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { ArrowRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { monthStats, lastMonths, potBalance, potsTotal, assetsTotal } from '../lib/finance'
import { fmtEUR, fmtEUR0, monthKey, monthLabel } from '../lib/format'
import { Card, SectionTitle, Progress, Empty, Button } from '../components/ui'

const INCOME_COLOR = '#3987e5'
const SPEND_COLOR = '#e66767'

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-surface-2 border border-line px-3 py-2 text-xs shadow-lg">
      {label && <div className="text-muted mb-1">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.payload?.color || p.color || p.fill }} />
          <span className="text-white/80">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular">{fmtEUR(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ onTab, onAdd, onSettings }) {
  const { state } = useStore()
  const key = monthKey()
  const s = useMemo(() => monthStats(state, key), [state, key])
  const history = useMemo(
    () => lastMonths(state, key, 6).map((m) => ({ ...m, label: monthLabel(m.key, true) })),
    [state, key],
  )
  const pie = s.byCategory.filter((c) => c.value > 0)
  const netWorth = potsTotal(state) + assetsTotal(state)
  const savingRate = s.income > 0 ? (s.available / s.income) * 100 : 0
  const spentPct = s.income > 0 ? (s.spent / s.income) * 100 : s.spent > 0 ? 100 : 0
  const isEmpty = !state.transactions.length && !state.recurring.length && !state.pots.length && !state.assets.length

  return (
    <div>
      {/* Hero: verfügbare Sparrate */}
      <Card className="bg-gradient-to-br from-save/15 via-surface to-surface border-save/20">
        <div className="text-sm text-muted">Verfügbar in {monthLabel(key)}</div>
        <div className={`text-4xl font-bold mt-1 tabular ${s.available >= 0 ? 'text-save' : 'text-spend'}`}>{fmtEUR(s.available)}</div>
        <div className="text-sm text-muted mt-1">
          {s.income > 0 ? (
            <>Sparquote <span className="text-white font-medium">{Math.round(savingRate)} %</span> deiner Einnahmen</>
          ) : (
            'Trage Einnahmen ein, um deine Sparrate zu sehen'
          )}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span>Ausgegeben {Math.round(spentPct)} %</span>
            <span>{fmtEUR0(s.spent)} / {fmtEUR0(s.income)}</span>
          </div>
          <Progress value={spentPct} color={spentPct > 90 ? 'var(--color-spend)' : 'var(--color-save)'} className="h-3" />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Stat label="Einnahmen" value={s.income} cls="text-income" />
        <Stat label="Fixkosten" value={s.fixed} cls="text-spend" />
        <Stat label="Variabel" value={s.variable} cls="text-spend" />
      </div>

      {isEmpty && (
        <Card className="mt-4">
          <Empty
            icon="👋"
            title="Willkommen bei deiner Finanz-App"
            text="Lege zuerst dein Gehalt und deine Fixkosten an, danach Spartöpfe und tägliche Ausgaben. Alles bleibt lokal auf deinem Gerät."
            action={
              <div className="flex flex-col gap-2">
                <Button onClick={onSettings}>Gehalt & Fixkosten anlegen</Button>
                <Button variant="ghost" onClick={() => onTab('savings')}>Ersten Spartopf anlegen</Button>
              </div>
            }
          />
        </Card>
      )}

      {/* Spartöpfe */}
      {state.pots.length > 0 && (
        <>
          <SectionTitle action={<LinkBtn onClick={() => onTab('savings')}>Alle</LinkBtn>}>Sparziele</SectionTitle>
          <Card className="space-y-4">
            {state.pots.slice(0, 4).map((p) => {
              const bal = potBalance(p)
              const pct = p.target ? (bal / p.target) * 100 : 0
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium truncate">{p.emoji} {p.name}</span>
                    <span className="text-muted tabular shrink-0 pl-2">{fmtEUR0(bal)} / {fmtEUR0(p.target)}</span>
                  </div>
                  <Progress value={pct} color={p.color} />
                </div>
              )
            })}
            {s.saved !== 0 && (
              <div className="text-xs text-muted pt-1">Diesen Monat gespart: <span className="text-save font-semibold">{fmtEUR(s.saved)}</span></div>
            )}
          </Card>
        </>
      )}

      {/* Ausgaben nach Kategorie */}
      <SectionTitle action={<LinkBtn onClick={() => onTab('transactions')}>Details</LinkBtn>}>Ausgaben nach Kategorie</SectionTitle>
      <Card>
        {pie.length ? (
          <div className="flex items-center gap-4">
            <div className="relative size-36 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="100%" paddingAngle={2} stroke="var(--color-surface)" strokeWidth={2} cornerRadius={4}>
                    {pie.map((c) => <Cell key={c.id} fill={c.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">
                <div>
                  <div className="text-[10px] text-muted">Gesamt</div>
                  <div className="text-sm font-semibold tabular">{fmtEUR0(s.spent)}</div>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-1.5 text-sm min-w-0">
              {pie.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="truncate">{c.label}</span>
                  <span className="ml-auto tabular text-white/80">{fmtEUR0(c.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted py-4 text-center">Noch keine Ausgaben in diesem Monat.</p>
        )}
      </Card>

      {/* Verlauf */}
      <SectionTitle>Letzte 6 Monate</SectionTitle>
      <Card>
        <div className="flex gap-4 text-xs text-muted mb-2">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: INCOME_COLOR }} />Einnahmen</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SPEND_COLOR }} />Ausgaben</span>
        </div>
        <div className="h-48 -ml-2">
          <ResponsiveContainer>
            <BarChart data={history} barGap={2} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke="#253040" strokeDasharray="0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8b98a9', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: '#8b98a9', fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}k` : v)} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="income" name="Einnahmen" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="spent" name="Ausgaben" fill={SPEND_COLOR} radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Vermögen */}
      <SectionTitle action={<LinkBtn onClick={() => onTab('assets')}>Vermögen</LinkBtn>}>Gesamtvermögen</SectionTitle>
      <Card className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold tabular">{fmtEUR(netWorth)}</div>
          <div className="text-xs text-muted mt-0.5">Spartöpfe {fmtEUR0(potsTotal(state))} · Assets {fmtEUR0(assetsTotal(state))}</div>
        </div>
        <Button variant="ghost" className="!min-h-11 text-sm" onClick={onAdd}>+ Buchung</Button>
      </Card>
    </div>
  )
}

function Stat({ label, value, cls }) {
  return (
    <Card className="!p-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`text-base font-semibold mt-0.5 tabular ${cls}`}>{fmtEUR0(value)}</div>
    </Card>
  )
}

function LinkBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-save min-h-9 px-1">
      {children} <ArrowRight size={14} />
    </button>
  )
}

