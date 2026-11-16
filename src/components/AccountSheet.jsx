import { useState } from 'react'
import { useStore } from '../lib/store'
import { ACCOUNT_TYPES, CARD_THEMES } from '../lib/categories'
import { accountBalance } from '../lib/finance'
import { fmtNum, parseAmount, uid } from '../lib/format'
import { Sheet, Field, inputCls, Button, ConfirmButton } from './ui'
import BankCard from './BankCard'

export default function AccountSheet({ account, onClose, onCreated, toast }) {
  const { state, dispatch } = useStore()
  const isNew = !account
  const currentBalance = account ? accountBalance(state, account) : 0
  const [name, setName] = useState(account?.name || '')
  const [type, setType] = useState(account?.type || 'giro')
  const [theme, setTheme] = useState(account?.theme || CARD_THEMES[state.accounts.length % CARD_THEMES.length].id)
  const [last4, setLast4] = useState(account?.last4 || '')
  const [balance, setBalance] = useState(account ? fmtNum(currentBalance) : '')

  const b = balance.trim() === '' ? 0 : parseAmount(balance)
  const valid = name.trim() && Number.isFinite(b)
  const preview = { name: name || 'Mein Konto', type, theme, last4 }

  const save = () => {
    if (!valid) return
    if (isNew) {
      const id = uid()
      dispatch({ type: 'acc/add', id, account: { name: name.trim(), type, theme, last4, initialBalance: b } })
      toast('Konto angelegt')
      onCreated?.(id)
    } else {
      // Kontostand-Korrektur: Startsaldo so anpassen, dass der eingegebene Stand stimmt
      const initialBalance = account.initialBalance + (b - currentBalance)
      dispatch({ type: 'acc/update', account: { id: account.id, name: name.trim(), type, theme, last4, initialBalance } })
      toast('Konto gespeichert')
    }
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={isNew ? 'Neues Konto' : 'Konto bearbeiten'}>
      <BankCard account={preview} balance={Number.isFinite(b) ? b : 0} />

      <Field label="Name der Karte">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Sparkasse Giro, Trade Republic" maxLength={32} />
      </Field>

      <Field label={isNew ? 'Aktueller Kontostand' : 'Kontostand korrigieren'} hint={isNew ? undefined : 'Gib einfach ein, was gerade auf dem Konto ist.'}>
        <div className="relative">
          <input inputMode="decimal" className={`${inputCls} text-2xl font-semibold h-14 pr-10 tabular`} value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^\d.,-]/g, ''))} placeholder="0,00" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted">€</span>
        </div>
      </Field>

      <Field label="Kontoart">
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setType(t.id)} className={`rounded-full px-4 min-h-10 text-sm border ${type === t.id ? 'border-white bg-surface-2 text-white' : 'border-line text-muted'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Kartendesign">
        <div className="grid grid-cols-4 gap-2">
          {CARD_THEMES.map((t) => (
            <button key={t.id} type="button" onClick={() => setTheme(t.id)} aria-label={t.label} className={`h-12 rounded-xl border-2 ${theme === t.id ? 'border-white' : 'border-transparent'}`} style={{ background: t.bg }} />
          ))}
        </div>
      </Field>

      <Field label="Letzte 4 Ziffern (optional)" hint="Nur zur Wiedererkennung auf der Karte.">
        <input inputMode="numeric" className={`${inputCls} tabular tracking-widest`} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" />
      </Field>

      <div className="flex gap-2 mt-6">
        {!isNew && (
          <ConfirmButton className="flex-1" confirmText="Mit Buchungen löschen?" onConfirm={() => { dispatch({ type: 'acc/delete', id: account.id }); toast('Konto gelöscht'); onClose() }} />
        )}
        <Button className="flex-[2]" onClick={save} disabled={!valid}>Speichern</Button>
      </div>
    </Sheet>
  )
}
