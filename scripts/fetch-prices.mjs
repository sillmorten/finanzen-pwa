// Holt aktuelle Kurse (Euro) für alle Papiere aus src/lib/instruments.js
// und schreibt sie nach public/prices.json. Läuft im GitHub-Actions-Build.
import { writeFile } from 'node:fs/promises'
import { ETFS, CRYPTOS } from '../src/lib/instruments.js'

const out = { updatedAt: new Date().toISOString(), etf: {}, crypto: {} }
const UA = { 'User-Agent': 'Mozilla/5.0 (finanzen-pwa price fetcher)' }

async function yahoo(symbol) {
  for (const host of ['query1', 'query2']) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`, { headers: UA })
      if (!r.ok) continue
      const j = await r.json()
      const m = j?.chart?.result?.[0]?.meta
      if (m?.regularMarketPrice && m.currency === 'EUR') {
        return { price: m.regularMarketPrice, prevClose: m.chartPreviousClose ?? m.previousClose ?? null, time: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null }
      }
    } catch {}
  }
  return null
}

for (const e of ETFS) {
  const q = await yahoo(e.symbol)
  if (q) out.etf[e.isin] = q
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

await writeFile(new URL('../public/prices.json', import.meta.url), JSON.stringify(out))
console.log(`ETFs: ${Object.keys(out.etf).length}/${ETFS.length}`)
