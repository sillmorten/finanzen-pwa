import { ChevronUp, ChevronDown, Star } from 'lucide-react'
import { useStore } from '../lib/store'
import { cardTheme, accountTypeLabel } from '../lib/categories'
import { Sheet, Button } from './ui'

/** Reihenfolge der Karten festlegen */
export default function ReorderSheet({ onClose, onFirst }) {
  const { state, dispatch } = useStore()
  const ids = state.accounts.map((a) => a.id)

  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= ids.length) return
    const next = [...ids]
    ;[next[i], next[j]] = [next[j], next[i]]
    dispatch({ type: 'acc/reorder', ids: next })
    try { navigator.vibrate?.(10) } catch {}
  }
  const toTop = (i) => {
    const next = [ids[i], ...ids.filter((_, k) => k !== i)]
    dispatch({ type: 'acc/reorder', ids: next })
  }

  return (
    <Sheet open onClose={onClose} title="Reihenfolge der Karten">
      <p className="text-sm text-muted mb-3">Die oberste Karte wird beim Öffnen der App zuerst angezeigt.</p>
      <ul className="space-y-2">
        {state.accounts.map((a, i) => (
          <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-surface-2 border border-line/60 pl-3 pr-1.5 py-1.5">
            <span className="w-5 text-center text-sm text-muted tabular">{i + 1}</span>
            <span className="h-8 w-12 rounded-md shrink-0" style={{ background: cardTheme(a.theme).bg, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)' }} />
            <span className="flex-1 min-w-0">
              <span className="block font-medium truncate">{a.name}</span>
              <span className="block text-xs text-muted">{accountTypeLabel(a.type)}{a.locked ? ' · 🔒' : ''}</span>
            </span>
            {i > 0 && (
              <button onClick={() => toTop(i)} className="size-10 grid place-items-center rounded-xl text-muted active:bg-line" aria-label={`${a.name} an erste Stelle`}><Star size={18} /></button>
            )}
            <button onClick={() => move(i, -1)} disabled={i === 0} className="size-11 grid place-items-center rounded-xl bg-surface active:bg-line disabled:opacity-25" aria-label={`${a.name} nach oben`}><ChevronUp size={22} /></button>
            <button onClick={() => move(i, 1)} disabled={i === ids.length - 1} className="size-11 grid place-items-center rounded-xl bg-surface active:bg-line disabled:opacity-25" aria-label={`${a.name} nach unten`}><ChevronDown size={22} /></button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted mt-3">⭐ setzt eine Karte direkt an die erste Stelle.</p>
      <Button className="w-full mt-5" onClick={() => { onFirst?.(state.accounts[0]?.id); onClose() }}>Fertig</Button>
    </Sheet>
  )
}
