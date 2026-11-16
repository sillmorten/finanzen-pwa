import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
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
  const pairOf = editTx?.transferId ? state.transactions.filter((t) => t.transferId === editTx.transferId) : null
  const [type, setType] = useState(editTx?.transferId ? 'transfer' : editTx?.type || defaults?.type || 'expense')
  const [accountId, setAccountId] = useState(
    (pairOf && pairOf.find((t) => t.type === 'expense')?.accountId) || editTx?.accountId || defaults?.accountId || state.accounts[0]?.id,
  )
  const [toId, setToId] = useState(
    (pairOf && pairOf.find((t) => t.type === 'income')?.accountId) || state.accounts.find((a) => a.id !== (defaults?.accountId || state.accounts[0]?.id))?.id,
  )
  const isTransfer = type === 'transfer'
  const [amount, setAmount] = useState(editTx ? fmtNum(editTx.amount) : '')
  const [note, setNote] = useState(editTx?.note || '')
  const [date, setDate] = useState(editTx?.date || todayISO())

  const fileRef = useRef(null)
  const [scan, setScan] = useState(null) // { busy, status, progress, result, error }

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setScan({ busy: true, status: 'Bild wird vorbereitet', progress: 0 })
    try {
      const { scanReceipt } = await import('../lib/receipt')
      const r = await scanReceipt(file, (p) => setScan((s) => ({ ...s, busy: true, ...p })))
      setType('expense')
      if (r.amount) setAmount(fmtNum(r.amount))
      if (r.store) setNote(r.store)
      if (r.date) setDate(r.date)
      setScan({ busy: false, result: r })
      vibrate(15)
    } catch (err) {
      console.error(err)
      setScan({ busy: false, error: 'Texterkennung hat nicht geklappt. Versuch es mit mehr Licht oder tipp den Betrag ein.' })
    }
  }

  const value = parseAmount(amount)
  const valid = Number.isFinite(value) && value > 0 && accountId && (!isTransfer || (toId && toId !== accountId))

  const save = () => {
    if (!valid) return
    if (isTransfer) {
      const amt = Math.round(value * 100) / 100
      // eine normale Buchung, die zur Umbuchung wird, wird ersetzt
      if (editTx && !editTx.transferId) dispatch({ type: 'tx/delete', id: editTx.id })
      dispatch({ type: editTx?.transferId ? 'transfer/update' : 'transfer/add', transfer: { transferId: editTx?.transferId, from: accountId, to: toId, amount: amt, note: note.trim(), date } })
      const from = state.accounts.find((a) => a.id === accountId)?.name
      const to = state.accounts.find((a) => a.id === toId)?.name
      vibrate(15)
      onSaved?.(`${fmtEUR0(amt)} von ${from} an ${to} umgebucht`)
      onClose()
      return
    }
    if (editTx?.transferId) dispatch({ type: 'tx/delete', id: editTx.id })
    const tx = { accountId, type, amount: Math.round(value * 100) / 100, note: note.trim(), date }
    if (editTx && !editTx.transferId) dispatch({ type: 'tx/update', tx: { ...tx, id: editTx.id } })
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
          ...(state.accounts.length > 1 ? [{ value: 'transfer', label: 'Umbuchung', activeCls: 'bg-sky-400/20 text-sky-300' }] : []),
        ]}
      />
      {!editTx && !isTransfer && (
        <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
          <button type="button" disabled={scan?.busy} onClick={() => fileRef.current?.click()} className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line min-h-12 text-sm text-white/85 active:bg-surface-2 disabled:opacity-60">
            {scan?.busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            {scan?.busy ? `${scan.status} … ${Math.round((scan.progress || 0) * 100)} %` : 'Kassenbon fotografieren'}
          </button>
          {scan?.result && (
            <div className="mt-2 rounded-2xl bg-surface-2 p-3 text-sm">
              {scan.result.amount ? (
                <>
                  <div>Erkannt: <b className="tabular">{fmtNum(scan.result.amount)} €</b>{scan.result.store && <> bei <b>{scan.result.store}</b></>}. Bitte kurz prüfen.</div>
                  {scan.result.candidates.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-muted">
                      Anderer Betrag?
                      {scan.result.candidates.slice(1).map((v) => (
                        <button key={v} type="button" onClick={() => setAmount(fmtNum(v))} className="rounded-full border border-line px-2.5 min-h-8 text-white tabular active:bg-surface">{fmtNum(v)} €</button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted">Keinen Betrag gefunden. Tipp ihn bitte ein.</div>
              )}
            </div>
          )}
          {scan?.error && <div className="mt-2 rounded-2xl bg-spend/10 text-spend p-3 text-sm">{scan.error}</div>}
        </>
      )}
      <div className="mt-4">
        <AmountInput value={amount} onChange={setAmount} autoFocus={!editTx} color={isTransfer ? 'text-sky-300' : type === 'expense' ? 'text-spend' : 'text-save'} onKeyDown={(e) => e.key === 'Enter' && save()} />
      </div>

      {state.accounts.length > 1 && (
        <Field label={isTransfer ? 'Von' : 'Konto'}>
          <AccChips accounts={state.accounts} value={accountId} onChange={(id) => { setAccountId(id); if (id === toId) setToId(state.accounts.find((a) => a.id !== id)?.id) }} />
        </Field>
      )}
      {isTransfer && (
        <Field label="Nach">
          <AccChips accounts={state.accounts.filter((a) => a.id !== accountId)} value={toId} onChange={setToId} />
        </Field>
      )}

      <Field label="Notiz (optional)">
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder={isTransfer ? 'z. B. Sparrate' : type === 'income' ? 'z. B. Gehalt' : 'z. B. Überweisung'} maxLength={60} />
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

function AccChips({ accounts, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
      {accounts.map((a) => (
        <button key={a.id} type="button" onClick={() => onChange(a.id)} className={`shrink-0 flex items-center gap-2 rounded-2xl border px-3 min-h-12 text-sm ${value === a.id ? 'border-white bg-surface-2' : 'border-line text-muted'}`}>
          <span className="h-5 w-8 rounded-md" style={{ background: cardTheme(a.theme).bg }} />
          {a.name}
        </button>
      ))}
    </div>
  )
}
