import { AlertTriangle, Gauge } from 'lucide-react'
import { fmtEUR0 } from '../lib/format'
import { Card, Progress } from './ui'

export default function LimitBar({ usage, label = 'Ausgabenlimit diesen Monat', hidden = false, onClick }) {
  if (!usage) return null
  const color = usage.over ? 'var(--color-spend)' : usage.pct >= 80 ? '#f59e0b' : 'var(--color-save)'
  const m = (v) => (hidden ? '•••' : fmtEUR0(v))
  const W = onClick ? 'button' : 'div'
  return (
    <W onClick={onClick} className="block w-full text-left">
      <Card className="!p-4">
        <div className="flex items-center gap-2 text-sm">
          {usage.over ? <AlertTriangle size={16} className="text-spend" /> : <Gauge size={16} className="text-muted" />}
          <span className="text-muted">{label}</span>
          <span className="ml-auto tabular font-semibold">{m(usage.spent)} <span className="text-muted font-normal">/ {m(usage.limit)}</span></span>
        </div>
        <Progress value={usage.pct} color={color} className="h-3 mt-2.5" />
        <div className={`text-xs mt-1.5 ${usage.over ? 'text-spend' : usage.pct >= 80 ? 'text-amber-400' : 'text-muted'}`}>
          {usage.over ? `Limit um ${m(-usage.left)} überschritten` : `Noch ${m(usage.left)} verfügbar`}
        </div>
      </Card>
    </W>
  )
}
