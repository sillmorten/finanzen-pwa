import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useStore } from '../lib/store'
import { accountCash, accountPositions, positionsValue, visibleAssetsTotal, accountPerformance } from '../lib/finance'
import { useLock } from '../lib/lock'
import { Lock } from 'lucide-react'
import { isInvest, cardTheme, accountTypeLabel } from '../lib/categories'
import { fmtEUR, fmtEUR0 } from '../lib/format'
import { timeAgo } from '../lib/prices'
import { Card, SectionTitle, Button, Empty } from '../components/ui'
import PositionList from '../components/PositionList'
import PositionSheet from '../components/PositionSheet'

export default function Depot({ toast, prices, onNewAccount, onOpenAccount }) {
  const { state } = useStore()
  const [edit, setEdit] = useState(null) // { position?, accountId? }
  const accounts = state.accounts.filter(isInvest)
  const { toggleLock } = useLock()
  const total = visibleAssetsTotal(state)
  const openIds = new Set(state.accounts.filter((a) => !a.locked).map((a) => a.id))
  const visible = state.assets.filter((p) => openIds.has(p.accountId))
  const invested = visible.reduce((s, p) => s + (p.buyValue || 0), 0)
  const withBuy = visible.filter((p) => p.buyValue)
  const gain = withBuy.reduce((s, p) => s + p.amount * p.price - p.buyValue, 0)

  const refresh = async () => {
    const r = await prices.refresh({ force: true })
    toast(r && Object.keys(r).length ? `${Object.keys(r).length} Kurse aktualisiert` : 'Keine neuen Kurse')
  }

  return (
    <div>
      <Card className="bg-gradient-to-br from-sky-500/10 via-surface to-surface border-sky-400/20">
        <div className="text-sm text-muted">Wertpapiere & Krypto</div>
        <div className="text-4xl font-bold mt-1 tabular">{fmtEUR(total)}</div>
        {withBuy.length > 0 && invested > 0 && (
          <div className={`text-sm mt-1 tabular ${gain >= 0 ? 'text-save' : 'text-spend'}`}>
            {gain >= 0 ? '+' : ''}{fmtEUR(gain)} ({gain >= 0 ? '+' : ''}{((gain / withBuy.reduce((s, p) => s + p.buyValue, 0)) * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} %) seit Kauf
          </div>
        )}
        <div className="flex items-center justify-between mt-3 text-xs text-muted">
          <span>Kurse aktualisiert: {timeAgo(state.pricesUpdatedAt)}</span>
          <button onClick={refresh} disabled={prices.loading} className="flex items-center gap-1.5 text-sky-300 min-h-9 px-2 -mr-2 disabled:opacity-50">
            <RefreshCw size={14} className={prices.loading ? 'animate-spin' : ''} /> Aktualisieren
          </button>
        </div>
      </Card>

      {accounts.length === 0 && (
        <Card className="mt-4">
          <Empty
            icon="📈"
            title="Noch kein Depot oder Wallet"
            text="Leg ein Konto mit der Kontoart „Depot“ (z. B. Trade Republic) oder „Krypto-Wallet“ (z. B. Ledger) an. Danach trägst du hier deine ETFs und Coins ein."
            action={<Button onClick={onNewAccount}>Depot / Wallet anlegen</Button>}
          />
        </Card>
      )}

      {accounts.map((acc) => {
        const pos = accountPositions(state, acc.id)
        const cash = accountCash(state, acc)
        const perf = accountPerformance(state, acc.id)
        if (acc.locked) {
          return (
            <button key={acc.id} onClick={() => toggleLock(acc)} className="w-full mt-6 rounded-3xl bg-surface border border-line/60 p-4 flex items-center gap-3 text-left active:bg-surface-2">
              <span className="size-11 rounded-xl bg-surface-2 grid place-items-center text-amber-300"><Lock size={20} /></span>
              <span className="flex-1"><span className="block font-semibold">{acc.name}</span><span className="block text-xs text-muted">Gesperrt · tippen zum Entsperren</span></span>
            </button>
          )
        }
        return (
          <div key={acc.id}>
            <SectionTitle action={<button onClick={() => setEdit({ accountId: acc.id })} className="flex items-center gap-1 text-sm text-save min-h-9 px-1"><Plus size={16} /> Position</button>}>
              <button onClick={() => onOpenAccount(acc.id)} className="flex items-center gap-2 normal-case tracking-normal text-base text-white font-semibold">
                <span className="h-4 w-6 rounded" style={{ background: cardTheme(acc.theme).bg }} />
                {acc.name}
              </button>
            </SectionTitle>
            <div className="flex justify-between text-xs text-muted px-1 mb-2">
              <span>
                {accountTypeLabel(acc.type)} · {pos.length} {pos.length === 1 ? 'Position' : 'Positionen'}
                {perf && <span className={perf.value >= 0 ? 'text-save' : 'text-spend'}> · {perf.value >= 0 ? '▲ +' : '▼ '}{perf.pct.toLocaleString('de-DE', { maximumFractionDigits: 1 })} % {perf.label}</span>}
              </span>
              <span className="tabular">{fmtEUR0(positionsValue(state, acc.id))}{cash !== 0 && ` + ${fmtEUR0(cash)} Cash`}</span>
            </div>
            {pos.length ? (
              <PositionList positions={pos} onEdit={(p) => setEdit({ position: p })} />
            ) : (
              <button onClick={() => setEdit({ accountId: acc.id })} className="w-full rounded-3xl border-2 border-dashed border-line py-6 text-muted text-sm active:bg-surface">
                + Erste Position hinzufügen ({acc.type === 'wallet' ? 'z. B. BTC, XRP' : 'z. B. MSCI World'})
              </button>
            )}
          </div>
        )
      })}

      <p className="text-xs text-muted mt-6 px-1">
        ETF-Kurse kommen stündlich (Mo–Fr) über GitHub Actions von Xetra, Krypto-Kurse live von CoinGecko. Gesendet werden nur die Namen der Papiere, nie deine Mengen oder Beträge. Die App aktualisiert beim Öffnen und alle 10 Minuten.
      </p>

      {edit && <PositionSheet position={edit.position} accountId={edit.accountId} onClose={() => setEdit(null)} toast={toast} />}
    </div>
  )
}
