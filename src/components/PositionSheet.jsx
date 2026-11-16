import { useMemo, useState } from 'react'
import { Search, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { ETFS, CRYPTOS } from '../lib/instruments'
import { isInvest } from '../lib/categories'
import { fmtEUR, fmtNum, parseAmount } from '../lib/format'
import { fetchPrices } from '../lib/prices'
import { Sheet, Field, inputCls, Button, ConfirmButton, Segmented } from './ui'

/** Position (ETF, Krypto, Sonstiges) in einem Depot / Wallet anlegen oder bearbeiten */
export default function PositionSheet({ position, accountId, onClose, toast }) {
  const { state, dispatch } = useStore()
  const investAccounts = state.accounts.filter(isInvest)
  const [accId, setAccId] = useState(position?.accountId || accountId || investAccounts[0]?.id)
  const acc = state.accounts.find((a) => a.id === accId)
  const [kind, setKind] = useState(position?.kind || (acc?.type === 'wallet' ? 'crypto' : 'etf'))
  const [pick, setPick] = useState(
    position ? { name: position.name, symbol: position.symbol, isin: position.isin, cgId: position.cgId } : null,
  )
  const [query, setQuery] = useState('')
  const [name, setName] = useState(position?.kind === 'other' ? position.name : '')
  const [amount, setAmount] = useState(position ? fmtNum(position.amount) : '')
  const [price, setPrice] = useState(position?.kind === 'other' ? fmtNum(position.price) : '')
  const [buyValue, setBuyValue] = useState(position?.buyValue ? fmtNum(position.buyValue) : '')

  const etfs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? ETFS.filter((e) => e.name.toLowerCase().includes(q) || e.isin.toLowerCase().includes(q)) : ETFS
  }, [query])

  const a = parseAmount(amount)
  const p = parseAmount(price)
  const bv = buyValue.trim() ? parseAmount(buyValue) : 0
  const valid =
    accId && Number.isFinite(a) && a > 0 && Number.isFinite(bv) &&
    (kind === 'other' ? name.trim() && Number.isFinite(p) && p >= 0 : !!pick)

  const switchKind = (k) => { setKind(k); setPick(null) }

  const save = async () => {
    if (!valid) return
    const data =
      kind === 'other'
        ? { accountId: accId, kind, name: name.trim(), symbol: '', isin: '', cgId: '', amount: a, price: p, buyValue: bv }
        : { accountId: accId, kind, name: pick.name, symbol: pick.symbol || '', isin: pick.isin || '', cgId: pick.cgId || '', amount: a, buyValue: bv }
    let id = position?.id
    if (position) dispatch({ type: 'asset/update', asset: { ...data, id } })
    else {
      id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      dispatch({ type: 'asset/add', asset: { ...data, id, price: 0 } })
    }
    onClose()
    if (kind !== 'other' && (!position || position.isin !== data.isin || position.cgId !== data.cgId)) {
      toast('Kurs wird geladen …')
      const prices = await fetchPrices([{ ...data, id }])
      if (prices[id]) {
        dispatch({ type: 'asset/prices', prices })
        toast(`Gespeichert · Kurs ${fmtEUR(prices[id].price)}`)
      } else toast('Gespeichert · Kurs kommt beim nächsten Update')
    } else toast('Position gespeichert')
  }

  if (!investAccounts.length) {
    return (
      <Sheet open onClose={onClose} title="Erst ein Depot anlegen">
        <p className="text-muted">Lege zuerst ein Konto mit der Kontoart <b>Depot</b> (z. B. Trade Republic) oder <b>Krypto-Wallet</b> (z. B. Ledger) an.</p>
        <Button className="w-full mt-6" onClick={onClose}>Okay</Button>
      </Sheet>
    )
  }

  return (
    <Sheet open onClose={onClose} title={position ? 'Position bearbeiten' : 'Neue Position'}>
      {investAccounts.length > 1 && (
        <Field label="Depot / Wallet">
          <div className="flex gap-2 flex-wrap">
            {investAccounts.map((x) => (
              <button key={x.id} type="button" onClick={() => setAccId(x.id)} className={`rounded-full px-4 min-h-10 text-sm border ${accId === x.id ? 'border-white bg-surface-2' : 'border-line text-muted'}`}>{x.name}</button>
            ))}
          </div>
        </Field>
      )}

      <div className="mt-4">
        <Segmented value={kind} onChange={switchKind} options={[{ value: 'etf', label: 'ETF / Aktie' }, { value: 'crypto', label: 'Krypto' }, { value: 'other', label: 'Sonstiges' }]} />
      </div>

      {kind === 'etf' && (
        <Field label="ETF oder Aktie auswählen" hint="Kurse werden automatisch aktualisiert (Xetra, in Euro).">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input className={`${inputCls} pl-11`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name oder ISIN, z. B. MSCI World, Microsoft" />
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-line divide-y divide-line/60">
            {etfs.map((e) => (
              <button key={e.isin} type="button" onClick={() => setPick({ name: e.name, symbol: e.symbol, isin: e.isin })} className={`w-full text-left px-4 py-2.5 flex items-center gap-2 ${pick?.isin === e.isin ? 'bg-save/10' : 'active:bg-surface-2'}`}>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{e.name}</span>
                  <span className="block text-xs text-muted">{e.stock ? 'Aktie' : 'ETF'} · {e.isin}</span>
                </span>
                {pick?.isin === e.isin && <Check size={18} className="text-save" />}
              </button>
            ))}
            {!etfs.length && <p className="text-sm text-muted p-4">Nicht in der Liste? Wähle „Sonstiges“ und trag den Kurs selbst ein, oder sag Bescheid, dann nehme ich ihn in die automatische Liste auf.</p>}
          </div>
        </Field>
      )}

      {kind === 'crypto' && (
        <Field label="Kryptowährung" hint="Kurse live von CoinGecko, ohne API-Key.">
          <div className="flex gap-2 flex-wrap">
            {CRYPTOS.map((c) => (
              <button key={c.id} type="button" onClick={() => setPick({ name: c.name, symbol: c.symbol, cgId: c.id })} className={`rounded-full px-3.5 min-h-10 text-sm border ${pick?.cgId === c.id ? 'border-white bg-surface-2' : 'border-line text-muted'}`}>{c.symbol}</button>
            ))}
          </div>
        </Field>
      )}

      {kind === 'other' && (
        <>
          <Field label="Bezeichnung"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Apple-Aktie" maxLength={40} /></Field>
          <Field label="Kurs pro Stück (€)" hint="Manuell, wird nicht automatisch aktualisiert.">
            <input inputMode="decimal" className={`${inputCls} tabular`} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </Field>
        </>
      )}

      <Field label={kind === 'crypto' ? `Menge${pick ? ` (${pick.symbol})` : ''}` : 'Stückzahl'} hint="Bei Trade Republic findest du die Stückzahl in der Position.">
        <input inputMode="decimal" className={`${inputCls} tabular text-lg`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={kind === 'crypto' ? '0,0125' : '12,345'} />
      </Field>
      <Field label="Kaufwert gesamt (optional)" hint="Was du insgesamt investiert hast. Dann siehst du deinen Gewinn/Verlust.">
        <input inputMode="decimal" className={`${inputCls} tabular`} value={buyValue} onChange={(e) => setBuyValue(e.target.value)} placeholder="0,00 €" />
      </Field>

      <div className="flex gap-2 mt-6">
        {position && <ConfirmButton className="flex-1" onConfirm={() => { dispatch({ type: 'asset/delete', id: position.id }); toast('Position gelöscht'); onClose() }} />}
        <Button className="flex-[2]" onClick={save} disabled={!valid}>Speichern</Button>
      </div>
    </Sheet>
  )
}
