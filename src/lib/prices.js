import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { ETFS } from './instruments'

const ETF_BY_ISIN = Object.fromEntries(ETFS.map((e) => [e.isin, e]))
export const hasAutoPrice = (p) => (p.kind === 'crypto' && !!p.cgId) || (p.kind === 'etf' && !!ETF_BY_ISIN[p.isin])

/** Holt Kurse: ETFs aus prices.json (stündlich von GitHub Actions), Krypto live von CoinGecko */
export async function fetchPrices(assets) {
  const result = {}
  const auto = assets.filter(hasAutoPrice)
  if (!auto.length) return result

  // 1) prices.json neben der App (ETFs + Krypto-Fallback)
  let file = null
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}prices.json?t=${Date.now()}`, { cache: 'no-store' })
    if (r.ok) file = await r.json()
  } catch {}

  // 2) Krypto live (aktueller als prices.json)
  let live = null
  const ids = [...new Set(auto.filter((a) => a.kind === 'crypto').map((a) => a.cgId))]
  if (ids.length) {
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=eur&include_24hr_change=true`, { cache: 'no-store' })
      if (r.ok) live = await r.json()
    } catch {}
  }

  for (const a of auto) {
    if (a.kind === 'etf') {
      const q = file?.etf?.[a.isin]
      if (q?.price) result[a.id] = { price: q.price, change: q.prevClose ? ((q.price - q.prevClose) / q.prevClose) * 100 : null, time: q.time }
    } else {
      const l = live?.[a.cgId]
      const f = file?.crypto?.[a.cgId]
      if (l?.eur) result[a.id] = { price: l.eur, change: l.eur_24h_change ?? null }
      else if (f?.price) result[a.id] = { price: f.price, change: f.change24h ?? null, time: file.updatedAt }
    }
  }
  return result
}

const INTERVAL = 10 * 60 * 1000

/** Aktualisiert Kurse beim Start, alle 10 Minuten und beim Zurückkehren in die App */
export function usePriceUpdater() {
  const { state, dispatch } = useStore()
  const [loading, setLoading] = useState(false)
  const assetsRef = useRef(state.assets)
  assetsRef.current = state.assets
  const last = useRef(0)

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!force && Date.now() - last.current < 60 * 1000) return null
    last.current = Date.now()
    setLoading(true)
    try {
      const prices = await fetchPrices(assetsRef.current)
      if (Object.keys(prices).length) dispatch({ type: 'asset/prices', prices })
      return prices
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  const autoCount = state.assets.filter(hasAutoPrice).length
  useEffect(() => {
    if (!autoCount) return
    refresh({ force: true })
    const t = setInterval(() => refresh(), INTERVAL)
    const onVis = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [autoCount, refresh])

  return { refresh, loading }
}

export function timeAgo(iso) {
  if (!iso) return 'nie'
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min.`
  const h = Math.round(min / 60)
  if (h < 24) return `vor ${h} Std.`
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}
