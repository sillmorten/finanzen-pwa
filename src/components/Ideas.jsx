import { useState } from 'react'
import { Lightbulb, ChevronDown } from 'lucide-react'
import { useStore } from '../lib/store'
import { analyze } from '../lib/ideas'
import { fmtEUR0 } from '../lib/format'
import { Card, Progress } from './ui'

const TONES = {
  amber: 'from-amber-400/15 border-amber-300/25',
  sky: 'from-sky-400/15 border-sky-300/25',
  save: 'from-emerald-400/15 border-emerald-300/25',
  violet: 'from-violet-400/15 border-violet-300/25',
  muted: 'from-white/5 border-line/60',
}

const load = () => { try { return Number(localStorage.getItem('finanzen-pwa:buffer')) || 3 } catch { return 3 } }

export default function Ideas() {
  const { state } = useStore()
  const [months, setMonths] = useState(load)
  const [open, setOpen] = useState(true)
  const r = analyze(state, months)
  const setM = (m) => { setMonths(m); try { localStorage.setItem('finanzen-pwa:buffer', String(m)) } catch {} }

  return (
    <Card className="mt-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 text-left">
        <span className="size-10 rounded-xl bg-amber-300/15 text-amber-300 grid place-items-center"><Lightbulb size={20} /></span>
        <span className="flex-1">
          <span className="block font-semibold">Ideen für dein Geld</span>
          <span className="block text-xs text-muted">{r.ideas.length} {r.ideas.length === 1 ? 'Vorschlag' : 'Vorschläge'} aus deinen Zahlen</span>
        </span>
        <ChevronDown size={20} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4">
          <div className="rounded-2xl bg-surface-2 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Notgroschen (Tagesgeld, Spar, Töpfe)</span>
              <span className="tabular">{fmtEUR0(r.safe)} / {fmtEUR0(r.buffer)}</span>
            </div>
            <Progress className="h-2 mt-2" value={r.buffer ? Math.min(100, (r.safe / r.buffer) * 100) : 100} color={r.safe >= r.buffer ? 'var(--color-save)' : '#fbbf24'} />
            <div className="flex items-center gap-2 mt-3 text-xs text-muted">
              Ziel:
              {[3, 6].map((m) => (
                <button key={m} onClick={() => setM(m)} className={`rounded-full px-3 min-h-8 border ${months === m ? 'border-white text-white' : 'border-line'}`}>{m} Monatsausgaben</button>
              ))}
            </div>
          </div>

          <ol className="mt-3 space-y-2">
            {r.ideas.map((i, n) => (
              <li key={i.id} className={`rounded-2xl border bg-gradient-to-br to-transparent p-3.5 ${TONES[i.tone]}`}>
                <div className="flex gap-3">
                  <span className="text-2xl leading-none mt-0.5">{i.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-semibold"><span className="text-muted tabular mr-1">{n + 1}.</span>{i.title}</div>
                    <p className="text-sm text-muted mt-1 leading-snug">{i.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-muted mt-3 leading-snug">
            Allgemeine Faustregeln aus deinen eingetragenen Zahlen, keine Anlageberatung. Investiere nur Geld, das du länger nicht brauchst. Gesperrte Karten werden nicht mitgerechnet.
          </p>
        </div>
      )}
    </Card>
  )
}
