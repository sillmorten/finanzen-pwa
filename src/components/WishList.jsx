import { useState } from 'react'
import { Plus, Pencil, Check, PiggyBank } from 'lucide-react'
import { useStore } from '../lib/store'
import { wishVerdict, guessEmoji } from '../lib/ideas'
import { fmtEUR0, fmtNum, parseAmount, uid } from '../lib/format'
import { potBalance } from '../lib/finance'
import { confetti, vibrate } from '../lib/confetti'
import { Card, SectionTitle, Sheet, Field, inputCls, Button, ConfirmButton, Segmented, Progress } from './ui'

const STYLE = {
  good: { cls: 'bg-save/15 text-save border-save/30', icon: '✅' },
  wait: { cls: 'bg-amber-300/15 text-amber-300 border-amber-300/30', icon: '⏳' },
  save: { cls: 'bg-sky-300/15 text-sky-300 border-sky-300/30', icon: '🎯' },
  no: { cls: 'bg-spend/15 text-spend border-spend/30', icon: '✋' },
}

export default function WishList({ toast }) {
  const { state, dispatch } = useStore()
  const [edit, setEdit] = useState(null) // wish | 'new'

  const makePot = (w) => {
    const id = uid()
    dispatch({ type: 'pot/add', pot: { id, name: w.name, emoji: w.emoji, color: '#38bdf8', target: w.price, deadline: '' } })
    dispatch({ type: 'wish/update', wish: { id: w.id, potId: id } })
    toast(`Spartopf „${w.name}“ angelegt`)
  }
  const bought = (w) => {
    dispatch({ type: 'wish/delete', id: w.id })
    vibrate(20)
    confetti({ count: 90, duration: 1600 })
    toast(`Viel Spaß mit „${w.name}“! Trag die Ausgabe auf deiner Karte ein.`)
  }

  return (
    <div>
      <SectionTitle action={<button onClick={() => setEdit('new')} className="flex items-center gap-1 text-sm text-save min-h-9 px-1"><Plus size={16} /> Wunsch</button>}>
        Wunschliste
      </SectionTitle>

      {state.wishes.length === 0 ? (
        <button onClick={() => setEdit('new')} className="w-full rounded-3xl border-2 border-dashed border-line py-6 px-4 text-muted text-sm active:bg-surface">
          🎁 Was willst du dir kaufen? Controller, Bildschirm, Waschmaschine …<br />Ich sag dir, ob jetzt ein guter Zeitpunkt ist.
        </button>
      ) : (
        <div className="space-y-3">
          {state.wishes.map((w) => {
            const v = wishVerdict(state, w)
            const st = STYLE[v.kind]
            const pot = w.potId && state.pots.find((p) => p.id === w.potId)
            return (
              <Card key={w.id}>
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-2xl bg-surface-2 grid place-items-center text-2xl shrink-0">{w.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{w.name}</h3>
                    <div className="text-sm text-muted tabular">{fmtEUR0(w.price)} · {w.need === 'need' ? 'Brauche ich' : 'Will ich'}</div>
                  </div>
                  <button onClick={() => setEdit(w)} className="size-10 grid place-items-center rounded-full bg-surface-2 text-muted shrink-0" aria-label="Bearbeiten"><Pencil size={16} /></button>
                </div>
                <div className={`mt-3 rounded-2xl border p-3 ${st.cls}`}>
                  <div className="font-semibold">{st.icon} {v.label}</div>
                  <p className="text-sm text-white/75 mt-1 leading-snug">{v.text}</p>
                </div>
                {pot && (
                  <div className="mt-3">
                    <Progress className="h-2" value={(potBalance(pot) / w.price) * 100} color="#38bdf8" />
                    <div className="text-xs text-muted mt-1 tabular">Im Spartopf: {fmtEUR0(potBalance(pot))} von {fmtEUR0(w.price)}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {!pot ? (
                    <Button variant="ghost" className="flex items-center justify-center gap-1.5 text-sm" onClick={() => makePot(w)}><PiggyBank size={18} /> Spartopf</Button>
                  ) : <span />}
                  <Button variant="ghost" className="flex items-center justify-center gap-1.5 text-sm" onClick={() => bought(w)}><Check size={18} /> Gekauft</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <p className="text-[11px] text-muted mt-2 px-1">Die Einschätzung rechnet mit deinem Giro-Geld, Notgroschen und Ø-Überschuss. „Will ich“-Wünsche über 30 € laufen durch die 30-Tage-Regel.</p>

      {edit && <WishSheet wish={edit === 'new' ? null : edit} onClose={() => setEdit(null)} toast={toast} />}
    </div>
  )
}

function WishSheet({ wish, onClose, toast }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(wish?.name || '')
  const [price, setPrice] = useState(wish ? fmtNum(wish.price) : '')
  const [need, setNeed] = useState(wish?.need || 'want')
  const p = parseAmount(price)
  const valid = name.trim() && Number.isFinite(p) && p > 0

  const save = () => {
    if (!valid) return
    const data = { name: name.trim(), price: p, need, emoji: guessEmoji(name) }
    if (wish) dispatch({ type: 'wish/update', wish: { id: wish.id, ...data } })
    else dispatch({ type: 'wish/add', wish: data })
    toast(wish ? 'Wunsch gespeichert' : 'Auf die Wunschliste gesetzt')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={wish ? 'Wunsch bearbeiten' : 'Neuer Wunsch'}>
      <Field label="Was möchtest du kaufen?">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Neuer Controller" maxLength={40} autoFocus={!wish} />
      </Field>
      <Field label="Ungefährer Preis">
        <div className="relative">
          <input inputMode="decimal" className={`${inputCls} text-2xl font-semibold h-14 pr-10 tabular`} value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted">€</span>
        </div>
      </Field>
      <Field label="Ehrlich gesagt …" hint="„Brauche ich“: z. B. alte Waschmaschine kaputt. „Will ich“: wäre schön, geht aber auch ohne.">
        <Segmented options={[{ value: 'need', label: 'Brauche ich' }, { value: 'want', label: 'Will ich' }]} value={need} onChange={setNeed} />
      </Field>
      <div className="flex gap-2 mt-6">
        {wish && <ConfirmButton className="flex-1" confirmText="Wirklich löschen?" onConfirm={() => { dispatch({ type: 'wish/delete', id: wish.id }); onClose() }} />}
        <Button className="flex-[2]" onClick={save} disabled={!valid}>{wish ? 'Speichern' : 'Hinzufügen'}</Button>
      </div>
    </Sheet>
  )
}
