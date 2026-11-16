import { accountCash } from './finance'
import { todayISO } from './format'

const pad = (n) => String(n).padStart(2, '0')
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Zeiträume (Buckets) für Tag / Monat / Jahr, ältester zuerst */
export function buckets(period, txs) {
  const now = new Date()
  const out = []
  if (period === 'day') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = isoOf(d)
      out.push({ key, short: i === 0 ? 'Heute' : d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', ''), sub: `${d.getDate()}.`, long: d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) })
    }
  } else if (period === 'month') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
      out.push({ key, short: d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', ''), sub: d.getMonth() === 0 || i === 11 ? String(d.getFullYear()).slice(2) : '', long: d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) })
    }
  } else {
    const first = txs.reduce((m, t) => Math.min(m, Number(t.date.slice(0, 4))), now.getFullYear())
    for (let y = Math.min(first, now.getFullYear() - 2); y <= now.getFullYear(); y++) {
      out.push({ key: String(y), short: String(y), sub: '', long: `Jahr ${y}` })
    }
  }
  return out
}

/** Statistik: Einnahmen / Ausgaben je Zeitraum + Kontostand (Cash) am Ende jedes Zeitraums */
export function stats(state, period) {
  const open = state.accounts.filter((a) => !a.locked)
  const ids = new Set(open.map((a) => a.id))
  const txs = state.transactions.filter((t) => ids.has(t.accountId))
  const list = buckets(period, txs)
  const len = period === 'day' ? 10 : period === 'month' ? 7 : 4
  const cashNow = open.reduce((s, a) => s + accountCash(state, a), 0)
  const today = todayISO()

  const rows = list.map((b) => {
    const tx = txs.filter((t) => t.date.slice(0, len) === b.key)
    const income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    // Kontostand am Ende des Zeitraums = heute minus alles, was danach gebucht wurde
    const later = txs.filter((t) => t.date.slice(0, len) > b.key && t.date <= today)
    const balance = cashNow - later.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
    return { ...b, income, expense, net: income - expense, balance, tx }
  })
  return { rows, hasTx: txs.length > 0 }
}
