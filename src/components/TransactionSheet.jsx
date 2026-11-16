import { useState } from 'react'
import { Sheet, AmountInput, Segmented, Field, inputCls, Button, ConfirmButton } from './ui'
import { parseAmount, todayISO, fmtNum } from '../lib/format'
import { useStore } from '../lib/store'
import { cardTheme } from '../lib/categories'
import { limitUsage } from '../lib/finance'
import { fmtEUR0, monthKey } from '../lib/format'
import { vibrate } from '../lib/confetti'

/** Ein-/Auszahlung auf einem Konto erfassen oder bearbeiten */
export default function TransactionSheet({ open, onClose, editTx, defaults, onSaved }) {
  if (!open) return null
  return <Inner key={editTx?.id || 'new'} onClose={onClose} editTx={editTx} defaults={defaults} onSaved={onSaved} />
}

function Inner({ onClose, editTx, defaults, onSaved }) {
  const { state, dispatch } = useStore()
  const [type, setType] = useState(editTx?.type || defaults?.type || 'expense')
  const [accountId, setAccountId] = useState(editTx?.accountId || defaults?.accountId || state.accounts[0]?.id)
  const [amount, setAmount] = useState(editTx ? fmtNum(editTx.amount) : '')
  const [note, setNote] = useState(editTx?.note || '')
  const [date, setDate] = useState(editTx?.date || todayISO())

  const value = parseAmount(amount)
  const valid = Number.isFinite(value) && value > 0 && accountId

  const save = () => {
    if (!valid) return
    const tx = { accountId, type, amount: Math.round(value * 100) / 100, note: note.trim(), date }
    if (editTx) dispatch({ type: 'tx/update', tx: { ...tx, id: editTx.id } })
    else dispatch({ type: 'tx/add', tx })
    // Limit-Warnung
    const acc = state.accounts.find((a) => a.id === accountId)
    const k = monthKey(date)
    if (type === 'expense' && acc?.limit && k === monthKey()) {
      const before = limitUsage(state, acc, k).spent - (editTx && editTx.accountId === accountId && editTx.type === 'expense' && monthKey(editTx.date) === k ? editTx.amount : 0)
      const after = before + tx.amount
      if (after > acc.limit) {
        vibrate([40, 60, 40])
        onSaved?.(`⚠️ Limit von ${fmtEUR0(acc.limit)} überschritten (${fmtEUR0(after)})`)
        onClose()
        return
      }
      if (after >= acc.limit * 0.8) {
        onSaved?.(`Achtung: noch ${fmtEUR0(acc.limit - after)} bis zum Limit`)
        onClose()
        return
      }
    }
    onSaved?.(editTx ? 'Buchung aktualisiert' : type === 'expense' ? 'Auszahlung gespeichert' : 'Einzahlung gespeichert')
    onClose()
  }

  if (!state.accounts.length) {
    return (
      <Sheet open onClose={onClose} title="Erst ein Konto anlegen">
        <p className="text-muted">Lege zuerst eine Karte bzw. ein Konto an. Danach kannst du Ein- und Auszahlungen darauf buchen.</p>
        <Button className="w-full mt-6" onClick={onClose}>Okay</Button>
      </Sheet>
    )
  }

  return (
    <Sheet open onClose={onClose} title={editTx ? 'Buchung bearbeiten' : 'Neue Buchung'}>
      <Segmented
        value={type}
        onChange={setType}
        options={[
          { value: 'income', label: 'Einzahlung', activeCls: 'bg-save/20 text-save' },
          { value: 'expense', label: 'Auszahlung', activeCls: 'bg-spend/20 text-spend' },
        ]}
      />
      <div className="mt-4">
        <AmountInput value={amount} onChange={setAmount} autoFocus={!editTx} color={type === 'expense' ? 'text-spend' : 'text-save'} onKeyDown={(e) => e.key === 'Enter' && save()} />
      </div>

      {state.accounts.length > 1 && (
        <Field label="Konto">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {state.accounts.map((a) => (
              <button key={a.id} type="button" onClick={() => setAccountId(a.id)} className={`shrink-0 flex items-center gap-2 rounded-2xl border px-3 min-h-12 text-sm ${accountId === a.id ? 'border-white bg-surface-2' : 'border-line text-muted'}`}>
                <span className="h-5 w-8 rounded-md" style={{ background: cardTheme(a.theme).bg }} />
                {a.name}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Notiz (optional)">
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === 'income' ? 'z. B. Gehalt' : 'z. B. Überweisung'} maxLength={60} />
      </Field>
      <Field label="Datum">
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value || todayISO())} />
      </Field>

      <div className="flex gap-2 mt-6">
        {editTx && (
          <ConfirmButton className="flex-1" onConfirm={() => { dispatch({ type: 'tx/delete', id: editTx.id }); onSaved?.('Buchung gelöscht'); onClose() }} />
        )}
        <Button className="flex-[2]" onClick={save} disabled={!valid}>Speichern</Button>
      </div>
    </Sheet>
  )
}
