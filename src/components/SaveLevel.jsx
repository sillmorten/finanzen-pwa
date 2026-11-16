import { Flame } from 'lucide-react'
import { useStore } from '../lib/store'
import { potsTotal } from '../lib/finance'
import { levelFor, weekStreak } from '../lib/gamify'
import { fmtEUR0 } from '../lib/format'
import { Card, Progress } from './ui'

/** Spar-Level mit Fortschritt & Serie */
export default function SaveLevel({ compact = false, onClick }) {
  const { state } = useStore()
  const total = potsTotal(state)
  const lvl = levelFor(total)
  const { streak, thisWeek } = weekStreak(state)
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper onClick={onClick} className="block w-full text-left">
      <Card className="bg-gradient-to-br from-save/15 via-surface to-surface border-save/25">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-2xl bg-save/15 grid place-items-center text-3xl shrink-0">{lvl.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted">Level {lvl.level}</div>
            <div className="text-lg font-bold truncate">{lvl.name}</div>
          </div>
          <div className={`flex flex-col items-center shrink-0 ${streak > 0 ? 'text-amber-400' : 'text-muted'}`}>
            <div className="flex items-center gap-1 text-xl font-bold tabular"><Flame size={22} fill={streak > 0 ? 'currentColor' : 'none'} />{streak}</div>
            <div className="text-[10px] text-muted">{streak === 1 ? 'Woche' : 'Wochen'}</div>
          </div>
        </div>
        <Progress value={lvl.progress} className="h-3 mt-4" />
        <div className="flex justify-between text-xs mt-1.5 text-muted">
          <span>{fmtEUR0(total)} gespart</span>
          <span>{lvl.next ? <>Noch <span className="text-save font-semibold">{fmtEUR0(lvl.toNext)}</span> bis {lvl.next.emoji}</> : 'Höchstes Level! 👑'}</span>
        </div>
        {!compact && (
          <p className="text-sm mt-3">
            {streak === 0
              ? '💡 Zahl diese Woche etwas in einen Spartopf ein und starte deine Spar-Serie.'
              : thisWeek
                ? `🔥 Diese Woche schon gespart. Deine Serie läuft seit ${streak} ${streak === 1 ? 'Woche' : 'Wochen'}!`
                : '⏳ Diese Woche noch nichts gespart. Zahl etwas ein, damit deine Serie weiterläuft!'}
          </p>
        )}
      </Card>
    </Wrapper>
  )
}
