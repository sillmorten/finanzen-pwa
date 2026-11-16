import { useEffect, useState } from 'react'
import { todayISO } from './format'

/** Lädt Tageskurse (history.json aus dem Build) + Krypto-Fallback direkt von CoinGecko */
let cache = null
async function loadFile() {
  if (cache) return cache
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}history.json?t=${Math.floor(Date.now() / 3600000)}`)
    if (r.ok) cache = await r.json()
  } catch {}
  return cache || { etf: {}, crypto: {} }
}

async function cryptoFallback(id) {
  const key = `finanzen-pwa:hist:${id}`
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null')
    if (c && Date.now() - c.t < 6 * 3600 * 1000) return c.s
  } catch {}
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=eur&days=365&interval=daily`)
    if (!r.ok) return null
    const j = await r.json()
    const m = new Map()
    for (const [t, p] of j.prices || []) m.set(new Date(t).toISOString().slice(0, 10), p)
    const s = [...m.entries()]
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), s })) } catch {}
    return s
  } catch { return null }
}

export function useHistory(assets) {
  const [hist, setHist] = useState(null)
  const sig = assets.map((a) => a.isin || a.cgId).join(',')
  useEffect(() => {
    let alive = true
    ;(async () => {
      const f = await loadFile()
      const h = { etf: { ...f.etf }, crypto: { ...f.crypto } }
      const missing = [...new Set(assets.filter((a) => a.kind === 'crypto' && a.cgId && !h.crypto[a.cgId]).map((a) => a.cgId))]
      for (const id of missing) {
        const s = await cryptoFallback(id)
        if (s) h.crypto[id] = s
      }
      if (alive) setHist(h)
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])
  return hist
}

const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/**
 * Tageswerte eines Depots / einer Wallet (mit den heutigen Stückzahlen gerechnet).
 * Gibt [{ date, value }] für jeden Kalendertag zurück (Wochenenden bei ETFs = Freitagskurs).
 */
export function valueSeries(positions, hist, days = 400) {
  const today = todayISO()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const lines = positions.map((p) => {
    const s = p.kind === 'etf' ? hist?.etf?.[p.isin] : p.kind === 'crypto' ? hist?.crypto?.[p.cgId] : null
    let line = (s || []).filter(([d]) => d < today)
    // Vortageswert so setzen, dass „Heute“ genau der Tagesveränderung der App entspricht
    if (p.change != null && p.price) {
      const y = new Date(); y.setDate(y.getDate() - 1)
      const yk = iso(y)
      line = [...line.filter(([d]) => d < yk), [yk, p.price / (1 + p.change / 100)]]
    }
    return { p, s: line }
  })
  const firstKnown = lines.filter((l) => l.s.length).map((l) => l.s[0][0]).sort()[0]
  const out = []
  const ptr = lines.map(() => -1)
  for (let d = new Date(start); iso(d) <= today; d.setDate(d.getDate() + 1)) {
    const key = iso(d)
    if (firstKnown && key < firstKnown) continue
    let value = 0
    lines.forEach((l, i) => {
      if (key === today) { value += l.p.amount * l.p.price; return }
      while (ptr[i] + 1 < l.s.length && l.s[ptr[i] + 1][0] <= key) ptr[i]++
      const close = ptr[i] >= 0 ? l.s[ptr[i]][1] : l.s[0]?.[1] ?? l.p.price
      value += l.p.amount * close
    })
    out.push({ date: key, value })
  }
  return out
}

/** Gewinn/Verlust je Zeitraum aus der Wertreihe */
export function valueBuckets(series, period) {
  if (!series.length) return []
  const at = new Map(series.map((s) => [s.date, s.value]))
  const first = series[0]
  const valueAt = (key) => {
    // letzter bekannter Wert an oder vor key
    let v = first.value
    for (const s of series) { if (s.date > key) break; v = s.value }
    return v
  }
  const now = new Date()
  const rows = []
  const push = (key, short, sub, long, endKey, startKey) => {
    if (endKey < first.date) return
    const end = valueAt(endKey)
    const begin = startKey < first.date ? first.value : valueAt(startKey)
    rows.push({ key, short, sub, long, change: end - begin, pct: begin ? ((end - begin) / begin) * 100 : 0, value: end })
  }
  if (period === 'day') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const p = new Date(d); p.setDate(p.getDate() - 1)
      push(iso(d), i === 0 ? 'Heute' : d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', ''), `${d.getDate()}.`, d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }), iso(d), iso(p))
    }
  } else if (period === 'month') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const prevEnd = new Date(d.getFullYear(), d.getMonth(), 0)
      push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`, d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', ''), d.getMonth() === 0 || i === 11 ? String(d.getFullYear()).slice(2) : '', d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }), iso(endD > now ? now : endD), iso(prevEnd))
    }
  } else {
    for (let y = Number(first.date.slice(0, 4)); y <= now.getFullYear(); y++) {
      push(String(y), String(y), '', y === now.getFullYear() ? `${y} bisher` : `Jahr ${y}`, y === now.getFullYear() ? todayISO() : `${y}-12-31`, `${y - 1}-12-31`)
    }
  }
  void at
  return rows
}
