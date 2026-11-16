import { useEffect, useRef, useState, memo } from 'react'
import { Search, Plus, X, ChevronUp, ChevronDown, Maximize2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { searchMarket, SUGGESTED } from '../lib/market'
import { Sheet, SectionTitle, inputCls } from '../components/ui'

/** Bindet ein TradingView-Widget ein (kostenlos, ohne Schlüssel, Kurse live bzw. leicht verzögert) */
const TVWidget = memo(function TVWidget({ type, config, height }) {
  const ref = useRef(null)
  const cfg = JSON.stringify(config)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = '<div class="tradingview-widget-container__widget"></div>'
    const s = document.createElement('script')
    s.src = `https://s3.tradingview.com/external-embedding/embed-widget-${type}.js`
    s.async = true
    s.innerHTML = cfg
    el.appendChild(s)
    return () => { el.innerHTML = '' }
  }, [type, cfg])
  return <div ref={ref} className="tradingview-widget-container w-full overflow-hidden" style={{ height }} />
})

const base = { colorTheme: 'dark', isTransparent: true, locale: 'de_DE' }

export default function Market() {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const [big, setBig] = useState(null)
  const results = searchMarket(q)
  const list = state.watchlist
  const has = (s) => list.some((w) => w.symbol === s)
  const add = (item) => { dispatch({ type: 'watch/add', item: { symbol: item.symbol, name: item.name } }); setQ('') }
  const freeSymbol = q.trim().toUpperCase().replace(/\s+/g, '')

  return (
    <div>
      {list.length > 0 && (
        <div className="-mx-4 mb-3 border-y border-line/60">
          <TVWidget type="ticker-tape" height={46} config={{ ...base, symbols: list.map((w) => ({ proName: w.symbol, title: w.name })), showSymbolLogo: true, displayMode: 'adaptive' }} />
        </div>
      )}

      {/* Suche */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input className={`${inputCls} pl-11`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Aktie, ETF oder Coin suchen, z. B. GTA, Nvidia" />
        {q && <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center text-muted" aria-label="Suche leeren"><X size={18} /></button>}
      </div>
      {q.trim() && (
        <div className="mt-2 rounded-2xl bg-surface border border-line/60 divide-y divide-line/60 overflow-hidden">
          {results.map((m) => (
            <button key={m.symbol} onClick={() => add(m)} disabled={has(m.symbol)} className="w-full flex items-center justify-between px-4 min-h-13 py-2.5 text-left active:bg-surface-2 disabled:opacity-50">
              <span className="min-w-0"><span className="block font-medium truncate">{m.name}</span><span className="block text-xs text-muted">{m.symbol}</span></span>
              {has(m.symbol) ? <span className="text-xs text-muted">beobachtet</span> : <Plus size={20} className="text-save shrink-0" />}
            </button>
          ))}
          {freeSymbol.length >= 1 && freeSymbol.length <= 20 && !results.some((m) => m.symbol.endsWith(':' + freeSymbol)) && (
            <button onClick={() => add({ symbol: freeSymbol, name: freeSymbol })} className="w-full flex items-center justify-between px-4 min-h-13 py-2.5 text-left active:bg-surface-2">
              <span className="min-w-0"><span className="block font-medium">Kürzel „{freeSymbol}“ beobachten</span><span className="block text-xs text-muted">für alles, was nicht in der Liste ist, z. B. ein Börsenkürzel</span></span>
              <Plus size={20} className="text-save shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Beobachtungsliste */}
      <SectionTitle>Beobachtung{list.length ? ` · ${list.length}` : ''}</SectionTitle>
      {list.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-line p-5 text-center">
          <p className="text-sm text-muted">Noch nichts auf der Beobachtungsliste. Such oben nach einem Wert oder tipp einen Vorschlag an:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {SUGGESTED.map((m) => (
              <button key={m.symbol} onClick={() => add(m)} className="rounded-full border border-line px-3 min-h-10 text-sm active:bg-surface-2">+ {m.name}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((w, i) => (
            <div key={w.symbol} className="rounded-3xl bg-surface border border-line/60 overflow-hidden">
              <div className="flex items-center gap-1 pl-4 pr-1.5 pt-1.5">
                <span className="flex-1 min-w-0 text-xs text-muted truncate">{w.name} · {w.symbol}</span>
                <button onClick={() => dispatch({ type: 'watch/move', symbol: w.symbol, dir: -1 })} disabled={i === 0} className="size-9 grid place-items-center text-muted disabled:opacity-25" aria-label="Nach oben"><ChevronUp size={18} /></button>
                <button onClick={() => dispatch({ type: 'watch/move', symbol: w.symbol, dir: 1 })} disabled={i === list.length - 1} className="size-9 grid place-items-center text-muted disabled:opacity-25" aria-label="Nach unten"><ChevronDown size={18} /></button>
                <button onClick={() => setBig(w)} className="size-9 grid place-items-center text-muted" aria-label="Großer Chart"><Maximize2 size={16} /></button>
                <button onClick={() => dispatch({ type: 'watch/remove', symbol: w.symbol })} className="size-9 grid place-items-center text-muted" aria-label="Entfernen"><X size={18} /></button>
              </div>
              <TVWidget type="mini-symbol-overview" height={190} config={{ ...base, symbol: w.symbol, width: '100%', height: 190, dateRange: '1D', trendLineColor: '#60a5fa', underLineColor: 'rgba(96,165,250,0.18)', underLineBottomColor: 'rgba(96,165,250,0)', chartOnly: false, noTimeScale: false }} />
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted mt-4 px-1 leading-snug">
        Kurse und Charts von TradingView, je nach Börse live oder leicht verzögert. Die App schickt dafür nur die Kürzel deiner Beobachtungsliste an TradingView, keine Beträge.
      </p>

      {big && (
        <Sheet open onClose={() => setBig(null)} title={big.name}>
          <div className="-mx-2">
            <TVWidget type="advanced-chart" height={460} config={{ ...base, symbol: big.symbol, autosize: true, interval: '15', timezone: 'Europe/Berlin', style: '1', hide_side_toolbar: true, allow_symbol_change: false, withdateranges: true, save_image: false, backgroundColor: 'rgba(19,26,34,1)' }} />
          </div>
        </Sheet>
      )}
    </div>
  )
}
