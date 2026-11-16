import { useState } from 'react'
import { Plus, Minus, Pencil, CalendarClock, Undo2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { potBalance, potsTotal } from '../lib/finance'
import { fmtEUR, fmtEUR0, parseAmount, monthsUntil, fmtNum } from '../lib/format'
import { POT_PRESETS, POT_COLORS } from '../lib/categories'
import { Card, Progress, Sheet, Field, inputCls, Button, AmountInput, ConfirmButton, Empty, Segmented } from '../components/ui'

const QUICK = [10, 25, 50, 100]

export default function Savings({ toast }) {
  const { state, dispatch } = useStore()
  const [edit, setEdit] = useState(null) // pot | 'new'
  const [move, setMove] = useState(null) // { pot, dir }
  const total = potsTotal(state)
  const totalTarget = state.pots.reduce((s, p) => s + p.target, 0)

  return (
    <div>
      <Card className="bg-gradient-to-br from-save/15 via-surface to-surface border-save/20">
        <div className="text-sm text-muted">Gespart in allen Töpfen</div>
        <div className="text-4xl font-bold text-save mt-1 tabular">{fmtEUR(total)}</div>
        {totalTarget > 0 && (
          <>
            <div className="text-sm text-muted mt-1">von {fmtEUR0(totalTarget)} Gesamtziel</div>
            <Progress value={(total / totalTarget) * 100} className="h-3 mt-3" />
          </>
        )}
      </Card>

      {state.pots.length === 0 && (
        <Card className="mt-4">
          <Empty icon="🐷" title="Noch keine Spartöpfe" text="Lege Töpfe für Notgroschen, Technik, Urlaub oder Investitionen an und spare mit einem Tipp." />
        </Card>
      )}

      <div className="space-y-3 mt-4">
        {state.pots.map((p) => (
          <PotCard key={p.id} pot={p} onEdit={() => setEdit(p)} onMove={(dir) => setMove({ pot: p, dir })} onQuick={(amt) => {
            dispatch({ type: 'pot/move', id: p.id, amount: amt })
            toast(`${fmtEUR0(amt)} in „${p.name}“ gespart`)
          }} />
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4 flex items-center justify-center gap-2" onClick={() => setEdit('new')}>
        <Plus size={20} /> Neuer Spartopf
      </Button>

      {edit && <PotSheet pot={edit === 'new' ? null : edit} onClose={() => setEdit(null)} toast={toast} />}
      {move && <MoveSheet {...move} onClose={() => setMove(null)} toast={toast} />}
    </div>
  )
}

function PotCard({ pot, onEdit, onMove, onQuick }) {
  const bal = potBalance(pot)
  const pct = pot.target ? (bal / pot.target) * 100 : 0
  const left = Math.max(0, pot.target - bal)
  const months = monthsUntil(pot.deadline)
  const done = pot.target > 0 && bal >= pot.target
  let pace = null
  if (pot.deadline && !done) {
    if (months == null || months < 0) pace = { text: 'Deadline überschritten', cls: 'text-spend' }
    else pace = { text: `${fmtEUR0(left / Math.max(1, months + 1))} / Monat bis ${new Date(pot.deadline + 'T00:00:00').toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}`, cls: 'text-muted' }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-2xl grid place-items-center text-2xl shrink-0" style={{ background: pot.color + '22' }}>{pot.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{pot.name}</h3>
            {done && <span className="text-[10px] font-semibold uppercase rounded-full bg-save/20 text-save px-2 py-0.5">Erreicht 🎉</span>}
          </div>
          <div className="text-sm tabular">
            <span className="font-semibold" style={{ color: pot.color }}>{fmtEUR(bal)}</span>
            <span className="text-muted"> / {fmtEUR0(pot.target)}</span>
          </div>
        </div>
        <button onClick={onEdit} className="size-10 grid place-items-center rounded-full bg-surface-2 text-muted shrink-0" aria-label="Bearbeiten">
          <Pencil size={16} />
        </button>
      </div>
      <Progress value={pct} color={pot.color} className="h-3 mt-3" />
      <div className="flex justify-between text-xs mt-1.5">
        <span className={pace?.cls || 'text-muted'}>
          {pace ? <span className="inline-flex items-center gap-1"><CalendarClock size={12} />{pace.text}</span> : done ? 'Ziel erreicht' : `Noch ${fmtEUR0(left)}`}
        </span>
        <span className="text-muted tabular">{Math.round(pct)} %</span>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {QUICK.map((a) => (
          <button key={a} onClick={() => onQuick(a)} className="min-h-11 rounded-xl bg-save/10 text-save text-sm font-semibold active:bg-save/25">
            +{a} €
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Button variant="ghost" className="flex items-center justify-center gap-1.5 text-sm" onClick={() => onMove('in')}><Plus size={18} /> Einzahlen</Button>
        <Button variant="ghost" className="flex items-center justify-center gap-1.5 text-sm" onClick={() => onMove('out')}><Minus size={18} /> Auszahlen</Button>
      </div>
    </Card>
  )
}

function MoveSheet({ pot, dir: initialDir, onClose, toast }) {
  const { state, dispatch } = useStore()
  const [dir, setDir] = useState(initialDir)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const live = state.pots.find((p) => p.id === pot.id) || pot
  const v = parseAmount(amount)
  const valid = Number.isFinite(v) && v > 0

  const save = () => {
    if (!valid) return
    const amt = Math.round(v * 100) / 100
    dispatch({ type: 'pot/move', id: pot.id, amount: dir === 'in' ? amt : -amt, note: note.trim() })
    toast(dir === 'in' ? `${fmtEUR(amt)} eingezahlt` : `${fmtEUR(amt)} ausgezahlt`)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={`${pot.emoji} ${pot.name}`}>
      <Segmented value={dir} onChange={setDir} options={[
        { value: 'in', label: 'Einzahlen', activeCls: 'bg-save/20 text-save' },
        { value: 'out', label: 'Auszahlen', activeCls: 'bg-spend/20 text-spend' },
      ]} />
      <div className="mt-4"><AmountInput value={amount} onChange={setAmount} autoFocus color={dir === 'in' ? 'text-save' : 'text-spend'} onKeyDown={(e) => e.key === 'Enter' && save()} /></div>
      <Field label="Notiz (optional)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} /></Field>
      <Button className="w-full mt-6" onClick={save} disabled={!valid}>{dir === 'in' ? 'Einzahlen' : 'Auszahlen'}</Button>

      {live.history.length > 0 && (
        <>
          <h4 className="text-sm text-muted mt-6 mb-2">Letzte Bewegungen</h4>
          <ul className="divide-y divide-line/60">
            {live.history.slice(0, 8).map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-muted w-20 shrink-0">{new Date(h.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                <span className="truncate text-muted">{h.note}</span>
                <span className={`ml-auto tabular font-medium ${h.amount >= 0 ? 'text-save' : 'text-spend'}`}>{h.amount >= 0 ? '+' : ''}{fmtEUR(h.amount)}</span>
                <button className="size-9 grid place-items-center rounded-full text-muted active:bg-surface-2" aria-label="Rückgängig" onClick={() => dispatch({ type: 'pot/undo', id: pot.id, entryId: h.id })}>
                  <Undo2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  )
}

function PotSheet({ pot, onClose, toast }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(pot?.name || '')
  const [emoji, setEmoji] = useState(pot?.emoji || '💰')
  const [color, setColor] = useState(pot?.color || POT_COLORS[0])
  const [target, setTarget] = useState(pot ? fmtNum(pot.target) : '')
  const [deadline, setDeadline] = useState(pot?.deadline || '')
  const t = parseAmount(target)
  const valid = name.trim() && Number.isFinite(t) && t > 0

  const save = () => {
    if (!valid) return
    const data = { name: name.trim(), emoji: emoji || '💰', color, target: t, deadline }
    if (pot) dispatch({ type: 'pot/update', pot: { ...data, id: pot.id } })
    else dispatch({ type: 'pot/add', pot: data })
    toast(pot ? 'Spartopf aktualisiert' : 'Spartopf angelegt')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={pot ? 'Spartopf bearbeiten' : 'Neuer Spartopf'}>
      {!pot && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          {POT_PRESETS.map((p) => (
            <button key={p.name} onClick={() => { setName(p.name); setEmoji(p.emoji); setColor(p.color) }} className="shrink-0 rounded-full border border-line px-3.5 min-h-10 text-sm">
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Field label="Icon"><input className={`${inputCls} w-16 text-center text-2xl px-0`} value={emoji} onChange={(e) => setEmoji([...e.target.value].slice(-2).join(''))} /></Field>
        <div className="flex-1"><Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Notgroschen" maxLength={40} /></Field></div>
      </div>
      <Field label="Zielbetrag"><AmountInput value={target} onChange={setTarget} /></Field>
      <Field label="Deadline (optional)" hint="Daraus wird berechnet, wie viel du pro Monat sparen musst.">
        <input type="date" className={inputCls} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>
      <Field label="Farbe">
        <div className="flex gap-2 flex-wrap">
          {POT_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Farbe ${c}`} className={`size-10 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`} style={{ background: c }} />
          ))}
        </div>
      </Field>
      <div className="flex gap-2 mt-6">
        {pot && <ConfirmButton className="flex-1" onConfirm={() => { dispatch({ type: 'pot/delete', id: pot.id }); toast('Spartopf gelöscht'); onClose() }} />}
        <Button className="flex-[2]" onClick={save} disabled={!valid}>Speichern</Button>
      </div>
    </Sheet>
  )
}
