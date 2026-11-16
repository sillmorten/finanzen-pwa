import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '../lib/store'
import { stats } from '../lib/stats'
import { lockedCount } from '../lib/finance'
import { fmtEUR, fmtEUR0 } from '../lib/format'
import { Card, Segmented, SectionTitle, Empty } from '../components/ui'
import TxList, { sortTx } from '../components/TxList'
import { isInvest, cardTheme } from '../lib/categories'
import { useHistory, valueSeries, valueBuckets } from '../lib/history'
import { accountPositions, positionValue } from '../lib/finance'

// validiert (dark, #131a22): Lightness/Chroma/Kontrast PASS, CVD 7,5 → Zusatzkodierung über Richtung (oben/unten) + Legende
const IN = '#0ea573'
const OUT = '#ef4444'
const LINE = '#60a5fa'

const PERIODS = [
  { value: 'day', label: 'Tag' },
  { value: 'month', label: 'Monat' },
  { value: 'year', label: 'Jahr' },
]
const NOW_LABEL = { day: 'Heute', month: 'Dieser Monat', year: 'Dieses Jahr' }
const PREV_LABEL = { day: 'gestern', month: 'Vormonat', year: 'Vorjahr' }

const short = (v) => {
  const a = Math.abs(v)
  if (a >= 1000) return `${(v / 1000).toLocaleString('de-DE', { maximumFractionDigits: a >= 10000 ? 0 : 1 })}k`
  return Math.round(v).toLocaleString('de-DE')
}
function niceMax(v) {
  if (v <= 0) return 100
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v)
}

export default function Stats({ onEditTx }) {
  const { state } = useStore()
  const [period, setPeriod] = useState(() => { try { return localStorage.getItem('finanzen-pwa:stats') || 'month' } catch { return 'month' } })
  const [view, setView] = useState('cash')
  const invest = state.accounts.filter((a) => isInvest(a) && !a.locked && state.assets.some((p) => p.accountId === a.id))
  const pick = (p) => { setPeriod(p); try { localStorage.setItem('finanzen-pwa:stats', p) } catch {} }
  const acc = invest.find((a) => a.id === view)

  return (
    <div>
      {invest.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-3">
          {[{ id: 'cash', name: 'Ein- & Ausgänge' }, ...invest].map((a) => (
            <button key={a.id} onClick={() => setView(a.id)} className={`shrink-0 flex items-center gap-2 rounded-full pl-2.5 pr-4 min-h-10 text-sm border ${view === a.id || (!acc && a.id === 'cash') ? 'border-white bg-surface-2 text-white' : 'border-line text-muted'}`}>
              {a.id === 'cash' ? <span className="text-base">💶</span> : <span className="h-4 w-6 rounded" style={{ background: cardTheme(a.theme).bg }} />}
              {a.name}
            </button>
          ))}
        </div>
      )}
      <Segmented options={PERIODS} value={period} onChange={pick} />
      {acc ? <InvestStats key={acc.id} account={acc} period={period} /> : <CashStats period={period} onEditTx={onEditTx} />}
    </div>
  )
}

function CashStats({ period, onEditTx }) {
  const { state } = useStore()
  const { rows, hasTx } = useMemo(() => stats(state, period), [state, period])
  const [sel, setSel] = useState(null)
  const idx = sel != null && sel < rows.length ? sel : rows.length - 1
  const cur = rows[idx]
  const prev = rows[idx - 1]
  const locked = lockedCount(state)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSel(null), [period])

  const totIn = rows.reduce((s, r) => s + r.income, 0)
  const totOut = rows.reduce((s, r) => s + r.expense, 0)
  const avgOut = totOut / rows.length

  return (
    <div>
      {!hasTx ? (
        <Card className="mt-4">
          <Empty icon="📊" title="Noch keine Buchungen" text="Sobald du Ein- und Ausgaben auf deinen Karten einträgst, siehst du hier, wie jeder Tag, Monat und jedes Jahr läuft." />
        </Card>
      ) : (
        <>
          {/* Kennzahlen für den gewählten Zeitraum */}
          <Card className="mt-4">
            <div className="text-sm text-muted">{idx === rows.length - 1 ? NOW_LABEL[period] : cur.long}</div>
            <div className={`text-4xl font-bold mt-1 tabular ${cur.net >= 0 ? 'text-save' : 'text-spend'}`}>
              {cur.net > 0 ? '+' : ''}{fmtEUR(cur.net)}
            </div>
            {prev && (prev.income || prev.expense) ? (
              <Delta cur={cur.net} prev={prev.net} label={PREV_LABEL[period]} />
            ) : null}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Tile label="Eingang" value={cur.income} color={IN} />
              <Tile label="Ausgang" value={cur.expense} color={OUT} />
            </div>
          </Card>

          {/* Balkendiagramm */}
          <Card className="mt-4 !px-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-semibold">Ein- und Ausgänge</h2>
              <div className="flex gap-3 text-xs text-muted">
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: IN }} />Eingang</span>
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: OUT }} />Ausgang</span>
              </div>
            </div>
            <Bars rows={rows} idx={idx} onPick={setSel} />
            <p className="text-xs text-muted px-1 mt-1">Tippe auf einen Balken für Details.</p>
          </Card>

          {/* Kontostand-Verlauf */}
          <Card className="mt-4 !px-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="font-semibold">Kontostand-Verlauf</h2>
              <span className="text-sm tabular">{fmtEUR0(cur.balance)}</span>
            </div>
            <p className="text-xs text-muted px-1">Guthaben deiner Karten (ohne Wertpapiere){locked ? ` · ${locked} gesperrt, nicht enthalten` : ''}</p>
            <Line rows={rows} idx={idx} onPick={setSel} />
          </Card>

          {/* Zusammenfassung */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Mini label={`Ø Ausgang / ${period === 'day' ? 'Tag' : period === 'month' ? 'Monat' : 'Jahr'}`} value={fmtEUR0(avgOut)} />
            <Mini label="Gespart gesamt" value={fmtEUR0(totIn - totOut)} tone={totIn - totOut >= 0 ? 'text-save' : 'text-spend'} />
            <Mini label="Sparquote" value={totIn ? `${Math.round(((totIn - totOut) / totIn) * 100)} %` : '–'} />
          </div>

          <SectionTitle>Buchungen · {cur.long}</SectionTitle>
          {cur.tx.length ? (
            <TxList txs={[...cur.tx].sort(sortTx).slice(0, 50)} onEdit={onEditTx} />
          ) : (
            <p className="text-sm text-muted px-1">Keine Buchungen in diesem Zeitraum.</p>
          )}
        </>
      )}
    </div>
  )
}

function Delta({ cur, prev, label }) {
  const d = cur - prev
  const up = d >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <div className={`text-sm mt-1 flex items-center gap-1.5 ${up ? 'text-save' : 'text-spend'}`}>
      <Icon size={16} /> {up ? '+' : ''}{fmtEUR0(d)} <span className="text-muted">ggü. {label}</span>
    </div>
  )
}
function Tile({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted"><i className="size-2 rounded-full" style={{ background: color }} />{label}</div>
      <div className="text-lg font-semibold tabular mt-0.5">{fmtEUR(value)}</div>
    </div>
  )
}
function Mini({ label, value, tone = '' }) {
  return (
    <div className="rounded-2xl bg-surface border border-line/60 p-3">
      <div className="text-[11px] text-muted leading-tight">{label}</div>
      <div className={`font-semibold tabular mt-1 ${tone}`}>{value}</div>
    </div>
  )
}

const W = 340
const PAD_L = 40

/** Divergierende Balken: Eingang nach oben, Ausgang nach unten */
function Bars({ rows, idx, onPick, info }) {
  const H = 190, top = 14, bottom = 170
  // gemeinsame Skala, Nulllinie dort, wo Ein- und Ausgänge den Platz brauchen
  const mxIn = Math.max(...rows.map((r) => r.income)), mxOut = Math.max(...rows.map((r) => r.expense))
  const tIn = mxIn > 0 ? niceMax(mxIn) : 0, tOut = mxOut > 0 ? niceMax(mxOut) : 0
  const plot = bottom - 16 - top
  const scale = plot / Math.max(1, tIn + tOut)
  const mid = top + tIn * scale
  const ticks = [tIn, tIn / 2, -tOut, -tOut / 2].filter((v) => v !== 0 && Math.abs(v) * scale > 14)
  const n = rows.length
  const slot = (W - PAD_L) / n
  const bw = Math.max(4, Math.min(18, slot * 0.36))
  const r = Math.min(4, bw / 2)
  const sel = rows[idx]

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mt-3 mx-1 rounded-xl bg-surface-2 px-3 py-2 text-xs tabular">
        <span className="text-muted truncate">{sel.long}</span>
        {info ? info(sel) : (
          <span className="flex gap-3 shrink-0">
            <span className="flex items-center gap-1"><i className="size-2 rounded-sm" style={{ background: IN }} />+{fmtEUR0(sel.income)}</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-sm" style={{ background: OUT }} />−{fmtEUR0(sel.expense)}</span>
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-2 select-none" role="img" aria-label="Ein- und Ausgänge je Zeitraum">
        {/* Raster */}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W} y1={mid - v * scale} y2={mid - v * scale} stroke="var(--color-line)" strokeWidth="0.5" strokeDasharray="2 3" />
            <text x={PAD_L - 6} y={mid - v * scale + 3} textAnchor="end" fontSize="9" fill="var(--color-muted)">{short(Math.abs(v))}</text>
          </g>
        ))}
        <line x1={PAD_L} x2={W} y1={mid} y2={mid} stroke="var(--color-muted)" strokeWidth="0.75" />
        <rect x={PAD_L + slot * idx} y={top - 8} width={slot} height={bottom - top} rx="6" fill="white" opacity="0.05" />
        {rows.map((row, i) => {
          const x = PAD_L + slot * i + slot / 2
          const hi = row.income * scale, ho = row.expense * scale
          const dim = i !== idx ? 0.55 : 1
          return (
            <g key={row.key} onClick={() => onPick(i)} style={{ cursor: 'pointer' }}>
              {hi > 0 && <path d={roundTop(x - bw / 2, mid - 1 - hi, bw, hi, r)} fill={IN} opacity={dim} />}
              {ho > 0 && <path d={roundBottom(x - bw / 2, mid + 1, bw, ho, r)} fill={OUT} opacity={dim} />}
              <text x={x} y={bottom + 2} textAnchor="middle" fontSize="9" fill={i === idx ? 'white' : 'var(--color-muted)'} fontWeight={i === idx ? 600 : 400}>{row.short}</text>
              {row.sub && <text x={x} y={bottom + 13} textAnchor="middle" fontSize="8" fill="var(--color-muted)">{row.sub}</text>}
              <rect x={PAD_L + slot * i} y={0} width={slot} height={H} fill="transparent" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Linie: Kontostand am Ende jedes Zeitraums */
function Line({ rows, idx, onPick }) {
  const H = 130, top = 12, bottom = 104
  const vals = rows.map((r) => r.balance)
  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (hi - lo < 1) { hi += 50; lo -= 50 }
  const padV = (hi - lo) * 0.12
  lo -= padV; hi += padV
  const n = rows.length
  const slot = (W - PAD_L) / n
  const X = (i) => PAD_L + slot * i + slot / 2
  const Y = (v) => bottom - ((v - lo) / (hi - lo)) * (bottom - top)
  const d = rows.map((r, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(r.balance).toFixed(1)}`).join('')
  const area = `${d}L${X(n - 1)},${bottom}L${X(0)},${bottom}Z`
  const ticks = [hi - padV, (hi + lo) / 2, lo + padV]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-2 select-none" role="img" aria-label="Kontostand-Verlauf">
      <defs>
        <linearGradient id="bal" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={LINE} stopOpacity="0.25" />
          <stop offset="1" stopColor={LINE} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W} y1={Y(v)} y2={Y(v)} stroke="var(--color-line)" strokeWidth="0.5" strokeDasharray="2 3" />
          <text x={PAD_L - 6} y={Y(v) + 3} textAnchor="end" fontSize="9" fill="var(--color-muted)">{hi - lo < 4000 ? Math.round(v).toLocaleString('de-DE') : short(v)}</text>
        </g>
      ))}
      <line x1={X(idx)} x2={X(idx)} y1={top - 6} y2={bottom} stroke="var(--color-muted)" strokeWidth="0.75" />
      <path d={area} fill="url(#bal)" />
      <path d={d} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(idx)} cy={Y(rows[idx].balance)} r="4.5" fill={LINE} stroke="var(--color-surface)" strokeWidth="2" />
      {rows.map((r, i) => (
        <g key={r.key}>
          <text x={X(i)} y={bottom + 14} textAnchor="middle" fontSize="9" fill={i === idx ? 'white' : 'var(--color-muted)'}>{n > 7 && i % 2 !== (n - 1) % 2 && i !== idx ? '' : r.short}</text>
          <rect x={PAD_L + slot * i} y={0} width={slot} height={H} fill="transparent" onClick={() => onPick(i)} style={{ cursor: 'pointer' }} />
        </g>
      ))}
    </svg>
  )
}

function roundTop(x, y, w, h, r) {
  r = Math.min(r, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}
function roundBottom(x, y, w, h, r) {
  r = Math.min(r, h)
  return `M${x},${y}H${x + w}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x + r}Q${x},${y + h} ${x},${y + h - r}Z`
}

const fmtPct = (v) => `${v >= 0 ? '+' : ''}${v.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} %`

/** Depot / Wallet: Gewinn oder Verlust je Tag, Monat, Jahr */
function InvestStats({ account, period }) {
  const { state } = useStore()
  const positions = accountPositions(state, account.id)
  const hist = useHistory(positions)
  const series = useMemo(() => (hist ? valueSeries(positions, hist) : []), [hist, positions])
  const rows = useMemo(() => valueBuckets(series, period).map((r) => ({ ...r, income: Math.max(0, r.change), expense: Math.max(0, -r.change), balance: r.value })), [series, period])
  const [sel, setSel] = useState(null)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSel(null), [period])

  if (!hist) return <Card className="mt-4 text-center text-muted text-sm py-10">Lade Kursverlauf …</Card>
  if (!rows.length) return <Card className="mt-4"><Empty icon="📉" title="Noch kein Kursverlauf" text="Für diese Positionen gibt es noch keine Tageskurse. Sie kommen mit dem nächsten Kurs-Update." /></Card>

  const idx = sel != null && sel < rows.length ? sel : rows.length - 1
  const cur = rows[idx]
  const prev = rows[idx - 1]
  const up = cur.change >= 0
  const days = series.length

  return (
    <div>
      <Card className="mt-4">
        <div className="text-sm text-muted">{account.name} · {idx === rows.length - 1 ? NOW_LABEL[period] : cur.long}</div>
        <div className={`text-4xl font-bold mt-1 tabular ${up ? 'text-save' : 'text-spend'}`}>{cur.change > 0 ? '+' : ''}{fmtEUR(cur.change)}</div>
        <div className={`text-sm mt-1 tabular ${up ? 'text-save' : 'text-spend'}`}>
          {up ? '▲' : '▼'} {fmtPct(cur.pct)}
          {prev && <span className="text-muted"> · {PREV_LABEL[period]}: {prev.change > 0 ? '+' : ''}{fmtEUR0(prev.change)}</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-2xl bg-surface-2 p-3">
            <div className="text-xs text-muted">Wert {idx === rows.length - 1 ? 'jetzt' : 'am Ende'}</div>
            <div className="text-lg font-semibold tabular mt-0.5">{fmtEUR(cur.value)}</div>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3">
            <div className="text-xs text-muted">{period === 'day' ? 'Gewinntage' : period === 'month' ? 'Gewinnmonate' : 'Gewinnjahre'}</div>
            <div className="text-lg font-semibold tabular mt-0.5">{rows.filter((r) => r.change > 0).length} von {rows.length}</div>
          </div>
        </div>
      </Card>

      <Card className="mt-4 !px-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-semibold">Gewinn & Verlust</h2>
          <div className="flex gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: IN }} />Plus</span>
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: OUT }} />Minus</span>
          </div>
        </div>
        <Bars rows={rows} idx={idx} onPick={setSel} info={(r) => (
          <span className={`shrink-0 ${r.change >= 0 ? 'text-save' : 'text-spend'}`}>{r.change > 0 ? '+' : ''}{fmtEUR(r.change)} ({fmtPct(r.pct)})</span>
        )} />
        <p className="text-xs text-muted px-1 mt-1">Tippe auf einen Balken für Details.{period === 'day' ? ' Am Wochenende ruht die Börse, nur Krypto bewegt sich.' : ''}</p>
      </Card>

      <Card className="mt-4 !px-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="font-semibold">Wertverlauf</h2>
          <span className="text-sm tabular">{fmtEUR0(cur.value)}</span>
        </div>
        <Line rows={rows} idx={idx} onPick={setSel} />
      </Card>

      <SectionTitle>Positionen heute</SectionTitle>
      <div className="rounded-3xl bg-surface border border-line/60 divide-y divide-line/60">
        {positions.map((p) => {
          const v = positionValue(p)
          const d = p.change != null ? v - v / (1 + p.change / 100) : null
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted tabular">{fmtEUR(v)}</div>
              </div>
              {d != null && (
                <div className={`text-right tabular text-sm ${d >= 0 ? 'text-save' : 'text-spend'}`}>
                  <div className="font-semibold">{d > 0 ? '+' : ''}{fmtEUR(d)}</div>
                  <div className="text-xs">{fmtPct(p.change)}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-muted mt-3 px-1 leading-snug">
        Gerechnet mit deinen heutigen Stückzahlen und Tagesschlusskursen ({days > 300 ? '12 Monate' : `${days} Tage`} Verlauf). Hast du zwischendurch gekauft oder verkauft, weicht der Verlauf von Trade Republic ab.
      </p>
    </div>
  )
}
