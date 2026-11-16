import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useStore } from '../lib/store'
import { assetsTotal, accountsTotal } from '../lib/finance'
import { COINGECKO_IDS } from '../lib/categories'
import { fmtEUR, fmtEUR0, fmtNum, parseAmount } from '../lib/format'
import { Card, SectionTitle, Sheet, Field, inputCls, Button, ConfirmButton, Empty, Segmented, Progress } from '../components/ui'

export default function Assets({ toast }) {
  const { state, dispatch } = useStore()
  const [edit, setEdit] = useState(null)
  const [loading, setLoading] = useState(false)
  const aTotal = assetsTotal(state)
  const pTotal = accountsTotal(state)
  const net = aTotal + Math.max(0, pTotal)
  const netShown = aTotal + pTotal
  const cryptoWithId = state.assets.filter((a) => a.kind === 'crypto' && COINGECKO_IDS[a.symbol])

  async function refreshPrices() {
    setLoading(true)
    try {
      const ids = [...new Set(cryptoWithId.map((a) => COINGECKO_IDS[a.symbol]))].join(',')
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`)
      if (!res.ok) throw new Error(res.status)
      const data = await res.json()
      const prices = {}
      for (const a of cryptoWithId) {
        const p = data[COINGECKO_IDS[a.symbol]]?.eur
        if (p != null) prices[a.id] = p
      }
      dispatch({ type: 'asset/prices', prices })
      toast(`${Object.keys(prices).length} Kurse aktualisiert`)
    } catch {
      toast('Kurse konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card className="bg-gradient-to-br from-income/10 via-surface to-surface border-income/20">
        <div className="text-sm text-muted">Gesamtvermögen</div>
        <div className="text-4xl font-bold mt-1 tabular">{fmtEUR(netShown)}</div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <div className="text-muted text-xs">Konten</div>
            <div className="font-semibold text-save tabular">{fmtEUR0(pTotal)}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Krypto & Assets</div>
            <div className="font-semibold text-income tabular">{fmtEUR0(aTotal)}</div>
          </div>
        </div>
        {net > 0 && (
          <div className="flex h-3 rounded-full overflow-hidden mt-3 gap-0.5 bg-surface-2">
            <div className="bg-save" style={{ width: `${(pTotal / net) * 100}%` }} />
            <div className="bg-income" style={{ width: `${(aTotal / net) * 100}%` }} />
          </div>
        )}
      </Card>

      <SectionTitle
        action={
          cryptoWithId.length > 0 && (
            <button onClick={refreshPrices} disabled={loading} className="flex items-center gap-1.5 text-sm text-income min-h-9 px-1 disabled:opacity-50">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Kurse
            </button>
          )
        }
      >
        Bestände
      </SectionTitle>

      {state.assets.length === 0 ? (
        <Card><Empty icon="🪙" title="Noch keine Bestände" text="Trage z. B. BTC oder XRP mit Menge und Kurs ein, ganz ohne API-Keys." /></Card>
      ) : (
        <Card className="!p-0 divide-y divide-line/60 overflow-hidden">
          {state.assets.map((a) => {
            const v = a.amount * a.price
            return (
              <button key={a.id} onClick={() => setEdit(a)} className="w-full text-left px-4 py-3 active:bg-surface-2">
                <div className="flex items-center gap-3">
                  <span className="size-11 rounded-xl grid place-items-center bg-surface-2 text-xs font-bold shrink-0">{a.symbol.slice(0, 4) || '•'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium truncate">{a.name}</span>
                    <span className="block text-xs text-muted tabular">{fmtNum(a.amount)} × {fmtEUR(a.price)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular">{fmtEUR(v)}</span>
                    <span className="block text-xs text-muted tabular">{aTotal ? Math.round((v / aTotal) * 100) : 0} %</span>
                  </span>
                </div>
                <Progress value={aTotal ? (v / aTotal) * 100 : 0} color="var(--color-income)" className="h-1.5 mt-2" />
              </button>
            )
          })}
        </Card>
      )}

      <Button variant="outline" className="w-full mt-4 flex items-center justify-center gap-2" onClick={() => setEdit('new')}>
        <Plus size={20} /> Bestand hinzufügen
      </Button>
      <p className="text-xs text-muted mt-3 px-1">
        Kurse trägst du manuell ein. Optional holt „Kurse“ aktuelle Euro-Preise für bekannte Coins (BTC, ETH, XRP, SOL …) von CoinGecko, ohne Konto oder API-Key. Dabei werden nur die Coin-Namen gesendet, keine Mengen.
      </p>

      {edit && <AssetSheet asset={edit === 'new' ? null : edit} onClose={() => setEdit(null)} toast={toast} />}
    </div>
  )
}

function AssetSheet({ asset, onClose, toast }) {
  const { dispatch } = useStore()
  const [kind, setKind] = useState(asset?.kind || 'crypto')
  const [symbol, setSymbol] = useState(asset?.symbol || '')
  const [name, setName] = useState(asset?.name || '')
  const [amount, setAmount] = useState(asset ? fmtNum(asset.amount) : '')
  const [price, setPrice] = useState(asset ? fmtNum(asset.price) : '')
  const a = parseAmount(amount)
  const p = parseAmount(price)
  const valid = (name.trim() || symbol.trim()) && Number.isFinite(a) && a >= 0 && Number.isFinite(p) && p >= 0

  const save = () => {
    if (!valid) return
    const data = { kind, symbol: symbol.trim().toUpperCase(), name: name.trim() || symbol.trim().toUpperCase(), amount: a, price: p }
    if (asset) dispatch({ type: 'asset/update', asset: { ...data, id: asset.id } })
    else dispatch({ type: 'asset/add', asset: data })
    toast(asset ? 'Bestand aktualisiert' : 'Bestand hinzugefügt')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={asset ? 'Bestand bearbeiten' : 'Neuer Bestand'}>
      <Segmented value={kind} onChange={setKind} options={[{ value: 'crypto', label: 'Krypto' }, { value: 'other', label: 'Sonstiges (ETF, Konto …)' }]} />
      {kind === 'crypto' && !asset && (
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar -mx-5 px-5">
          {[['BTC', 'Bitcoin'], ['XRP', 'XRP'], ['ETH', 'Ethereum'], ['SOL', 'Solana']].map(([s, n]) => (
            <button key={s} onClick={() => { setSymbol(s); setName(n) }} className="shrink-0 rounded-full border border-line px-4 min-h-10 text-sm">{s}</button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="w-28"><Field label="Kürzel"><input className={`${inputCls} uppercase`} value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BTC" maxLength={8} /></Field></div>
        <div className="flex-1"><Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Bitcoin" maxLength={40} /></Field></div>
      </div>
      <Field label="Menge"><input inputMode="decimal" className={`${inputCls} tabular`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,05" /></Field>
      <Field label="Kurs pro Einheit (€)" hint={kind === 'other' ? 'Für Kontostände: Menge 1, Kurs = Betrag.' : undefined}>
        <input inputMode="decimal" className={`${inputCls} tabular`} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="80.000" />
      </Field>
      {valid && <p className="text-sm text-muted mt-3">Wert: <span className="text-white font-semibold">{fmtEUR(a * p)}</span></p>}
      <div className="flex gap-2 mt-6">
        {asset && <ConfirmButton className="flex-1" onConfirm={() => { dispatch({ type: 'asset/delete', id: asset.id }); toast('Bestand gelöscht'); onClose() }} />}
        <Button className="flex-[2]" onClick={save} disabled={!valid}>Speichern</Button>
      </div>
    </Sheet>
  )
}
