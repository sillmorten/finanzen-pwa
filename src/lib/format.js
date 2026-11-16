const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const eur0 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 8 })

export const fmtEUR = (v) => eur.format(Number.isFinite(v) ? v : 0)
export const fmtEUR0 = (v) => eur0.format(Number.isFinite(v) ? v : 0)
export const fmtNum = (v) => num.format(Number.isFinite(v) ? v : 0)
export const fmtPct = (v) =>
  `${v > 0 ? '+' : ''}${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(v)} %`

/** Akzeptiert "12,50", "12.50", "1.234,56" */
export function parseAmount(input) {
  if (typeof input === 'number') return input
  let s = String(input ?? '').trim().replace(/\s|€/g, '')
  if (!s) return NaN
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  return Number(s)
}

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Monatsschlüssel "YYYY-MM" */
export const monthKey = (date = new Date()) =>
  typeof date === 'string' ? date.slice(0, 7) : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return monthKey(d)
}

export function monthLabel(key, short = false) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('de-DE', short ? { month: 'short' } : { month: 'long', year: 'numeric' })
}

export function dateLabel(iso) {
  const today = todayISO()
  const d = new Date(iso + 'T00:00:00')
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (iso === today) return 'Heute'
  if (iso === monthKey(y) + '-' + String(y.getDate()).padStart(2, '0')) return 'Gestern'
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long' })
}

export function monthsUntil(deadlineISO) {
  if (!deadlineISO) return null
  const now = new Date()
  const d = new Date(deadlineISO + 'T00:00:00')
  const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()) + (d.getDate() >= now.getDate() ? 0 : -1)
  return months
}
