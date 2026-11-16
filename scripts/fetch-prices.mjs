// Holt aktuelle Kurse (Euro) für alle Papiere aus src/lib/instruments.js
// und schreibt sie nach public/prices.json. Läuft im GitHub-Actions-Build.
import { writeFile } from 'node:fs/promises'
import { ETFS, CRYPTOS } from '../src/lib/instruments.js'

const out = { updatedAt: new Date().toISOString(), etf: {}, crypto: {} }
// Tagesschlusskurse der letzten 12 Monate → public/history.json
const hist = { updatedAt: out.updatedAt, etf: {}, crypto: {} }
const day = (sec, off = 0) => new Date((sec + off) * 1000).toISOString().slice(0, 10)
const r4 = (v) => Number(v.toPrecision(6))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const UA = { 'User-Agent': 'Mozilla/5.0 (finanzen-pwa price fetcher)' }

async function yahoo(symbol) {
  for (const host of ['query1', 'query2']) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`, { headers: UA })
      if (!r.ok) continue
      const j = await r.json()
      const m = j?.chart?.result?.[0]?.meta
      if (m?.regularMarketPrice && m.currency === 'EUR') {
        const res = j.chart.result[0]
        const ts = res.timestamp || [], cl = res.indicators?.quote?.[0]?.close || []
        const series = ts.map((t, i) => [day(t, m.gmtoffset || 0), cl[i]]).filter(([, c]) => c != null).map(([d, c]) => [d, r4(c)])
        const closes = series.filter(([d]) => d < day(m.regularMarketTime || Date.now() / 1000, m.gmtoffset || 0))
        // Vortagesschluss = letzter Schlusskurs vor dem aktuellen Handelstag (chartPreviousClose wäre bei range=1y vor einem Jahr!)
        const prevClose = closes.length ? closes[closes.length - 1][1] : (m.previousClose ?? null)
        return { series, price: m.regularMarketPrice, prevClose, time: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null }
      }
    } catch {}
  }
  return null
}

for (const e of ETFS) {
  const q = await yahoo(e.symbol)
  if (q) {
    const { series, ...rest } = q
    out.etf[e.isin] = rest
    hist.etf[e.isin] = series
  }
  console.log(`${q ? '✓' : '✗'} ${e.symbol.padEnd(8)} ${e.name}${q ? ` → ${q.price} €` : ''}`)
}

try {
  const ids = CRYPTOS.map((c) => c.id).join(',')
  const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`, { headers: UA })
  if (r.ok) {
    const j = await r.json()
    for (const c of CRYPTOS) if (j[c.id]?.eur) out.crypto[c.id] = { price: j[c.id].eur, change24h: j[c.id].eur_24h_change ?? null }
  }
} catch {}
console.log(`Krypto: ${Object.keys(out.crypto).length}/${CRYPTOS.length}`)

for (const c of CRYPTOS) {
  for (let attempt = 0; attempt < 3 && !hist.crypto[c.id]; attempt++) {
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${c.id}/market_chart?vs_currency=eur&days=365&interval=daily`, { headers: UA })
      if (r.status === 429) { await sleep(20000); continue }
      if (r.ok) {
        const j = await r.json()
        const m = new Map()
        for (const [t, p] of j.prices || []) m.set(day(t / 1000), r4(p))
        hist.crypto[c.id] = [...m.entries()]
      }
    } catch {}
  }
  await sleep(2500)
}
console.log(`Krypto-Verlauf: ${Object.keys(hist.crypto).length}/${CRYPTOS.length}`)
await writeFile(new URL('../public/history.json', import.meta.url), JSON.stringify(hist))

await writeFile(new URL('../public/prices.json', import.meta.url), JSON.stringify(out))
console.log(`ETFs: ${Object.keys(out.etf).length}/${ETFS.length}`)
