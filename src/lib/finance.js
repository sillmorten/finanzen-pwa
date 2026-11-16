const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0)
const signed = (t) => (t.type === 'income' ? t.amount : -t.amount)

export const accountTx = (state, id) => state.transactions.filter((t) => t.accountId === id)
/** Guthaben (Cash) eines Kontos */
export const accountCash = (state, acc) => acc.initialBalance + sum(accountTx(state, acc.id), signed)
/** Positionen eines Kontos */
export const accountPositions = (state, id) => state.assets.filter((a) => a.accountId === id)
export const positionValue = (p) => p.amount * p.price
export const positionsValue = (state, id) => sum(accountPositions(state, id), positionValue)
/** Kontostand = Cash + Wert aller Positionen */
export const accountBalance = (state, acc) => accountCash(state, acc) + positionsValue(state, acc.id)
export const accountsTotal = (state) => sum(state.accounts, (a) => accountBalance(state, a))

/** Ein- und Ausgänge eines Kontos (oder aller Konten bei id = null) in einem Monat */
export function monthFlow(state, id, key) {
  const tx = state.transactions.filter((t) => !t.transferId && (id ? t.accountId === id : true) && t.date.startsWith(key))
  const income = sum(tx.filter((t) => t.type === 'income'), (t) => t.amount)
  const expense = sum(tx.filter((t) => t.type === 'expense'), (t) => t.amount)
  return { income, expense, net: income - expense }
}

export const potBalance = (pot) => sum(pot.history, (h) => h.amount)
export const potsTotal = (state) => sum(state.pots, potBalance)
export const assetsTotal = (state) => sum(state.assets, positionValue)
export const netWorth = (state) => accountsTotal(state)

/** Limit-Auslastung eines Kontos im Monat (null, wenn kein Limit) */
export function limitUsage(state, acc, key) {
  if (!acc?.limit) return null
  const spent = monthFlow(state, acc.id, key).expense
  return { spent, limit: acc.limit, left: acc.limit - spent, pct: (spent / acc.limit) * 100, over: spent > acc.limit }
}

/**
 * Wertentwicklung eines Depots / einer Wallet:
 * - seit Kauf (wenn Kaufwerte eingetragen sind), sonst
 * - heute (Tagesveränderung der Kurse)
 */
export function accountPerformance(state, id) {
  const pos = accountPositions(state, id)
  if (!pos.length) return null
  const withBuy = pos.filter((p) => p.buyValue > 0)
  if (withBuy.length) {
    const cost = sum(withBuy, (p) => p.buyValue)
    const gain = sum(withBuy, (p) => positionValue(p) - p.buyValue)
    return { value: gain, pct: (gain / cost) * 100, label: 'seit Kauf' }
  }
  const withChange = pos.filter((p) => p.change != null)
  if (!withChange.length) return null
  const now = sum(withChange, positionValue)
  const before = sum(withChange, (p) => positionValue(p) / (1 + p.change / 100))
  const gain = now - before
  return { value: gain, pct: before ? (gain / before) * 100 : 0, label: 'heute' }
}

/** Nur entsperrte Konten (für sichtbare Summen) */
export const unlocked = (state) => state.accounts.filter((a) => !a.locked)
export const lockedCount = (state) => state.accounts.filter((a) => a.locked).length
export const visibleNetWorth = (state) => sum(unlocked(state), (a) => accountBalance(state, a))
export const visibleAssetsTotal = (state) => {
  const ids = new Set(unlocked(state).map((a) => a.id))
  return sum(state.assets.filter((p) => ids.has(p.accountId)), positionValue)
}
