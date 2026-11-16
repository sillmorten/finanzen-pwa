import { useState } from 'react'
import { Sheet, AmountInput, Segmented, Field, inputCls, Button, ConfirmButton } from './ui'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories'
import { parseAmount, todayISO, fmtNum } from '../lib/format'
import { useStore } from '../lib/store'

/** Schnelleingabe & Bearbeiten einer Buchung */
export default function TransactionSheet({ open, onClose, editTx, onSaved }) {
  if (!open) return null
  return <Inner key={editTx?.id || 'new'} onClose={onClose} editTx={editTx} onSaved={onSaved} />
}

function Inner({ onClose, editTx, onSaved }) {
  const { dispatch } = useStore()
  const [type, setType] = useState(editTx?.type || 'expense')
  const [amount, setAmount] = useState(editTx ? fmtNum(editTx.amount) : '')
  const [category, setCategory] = useState(editTx?.category || 'lebensmittel')
  const [note, setNote] = useState(editTx?.note || '')
  const [date, setDate] = useState(editTx?.date || todayISO())

  const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const value = parseAmount(amount)
  const valid = Number.isFinite(value) && value > 0

  const switchType = (t) => {
    setType(t)
    setCategory(t === 'expense' ? 'lebensmittel' : 'gehalt')
  }

  const save = () => {
    if (!valid) return
    const tx = { type, amount: Math.round(value * 100) / 100, category, note: note.trim(), date }
    if (editTx) dispatch({ type: 'tx/update', tx: { ...tx, id: editTx.id } })
    else dispatch({ type: 'tx/add', tx })
    onSaved?.(editTx ? 'Buchung aktualisiert' : type === 'expense' ? 'Ausgabe gespeichert' : 'Einnahme gespeichert')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={editTx ? 'Buchung bearbeiten' : 'Neue Buchung'}>
      <Segmented
        value={type}
        onChange={switchType}
        options={[
          { value: 'expense', label: 'Ausgabe', activeCls: 'bg-spend/20 text-spend' },
          { value: 'income', label: 'Einnahme', activeCls: 'bg-save/20 text-save' },
        ]}
      />
      <div className="mt-4">
        <AmountInput value={amount} onChange={setAmount} autoFocus={!editTx} color={type === 'expense' ? 'text-spend' : 'text-save'} onKeyDown={(e) => e.key === 'Enter' && save()} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`min-h-16 rounded-2xl border text-sm flex flex-col items-center justify-center gap-0.5 transition-colors ${
              category === c.id ? 'border-white/70 bg-surface-2' : 'border-line text-muted'
            }`}
          >
            <span className="text-xl">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      <Field label="Notiz (optional)">
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Rewe, Kino, Netflix" maxLength={80} />
      </Field>
      <Field label="Datum">
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value || todayISO())} />
      </Field>

      <div className="flex gap-2 mt-6">
        {editTx && (
          <ConfirmButton
            className="flex-1"
            onConfirm={() => {
              dispatch({ type: 'tx/delete', id: editTx.id })
              onSaved?.('Buchung gelöscht')
              onClose()
            }}
          />
        )}
        <Button className="flex-[2]" onClick={save} disabled={!valid}>
          Speichern
        </Button>
      </div>
    </Sheet>
  )
}
