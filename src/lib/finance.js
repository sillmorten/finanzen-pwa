import { FIXED_CATEGORY_IDS, EXPENSE_CATEGORIES } from './categories'
import { shiftMonth } from './format'

const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0)

/** Kennzahlen für einen Monat ("YYYY-MM") */
export function monthStats(state, key) {
  const tx = state.transactions.filter((t) => t.date.startsWith(key))
  const recIncome = sum(state.recurring.filter((r) => r.type === 'income'), (r) => r.amount)
  const recExpense = sum(state.recurring.filter((r) => r.type === 'expense'), (r) => r.amount)

  const txIncome = sum(tx.filter((t) => t.type === 'income'), (t) => t.amount)
  const expenses = tx.filter((t) => t.type === 'expense')
  const txFixed = sum(expenses.filter((t) => FIXED_CATEGORY_IDS.includes(t.category)), (t) => t.amount)
  const variable = sum(expenses.filter((t) => !FIXED_CATEGORY_IDS.includes(t.category)), (t) => t.amount)

  const income = recIncome + txIncome
  const fixed = recExpense + txFixed
  const spent = fixed + variable
  const available = income - spent

  // Ausgaben je Kategorie (inkl. wiederkehrender Posten)
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    value:
      sum(expenses.filter((t) => t.category === c.id), (t) => t.amount) +
      sum(state.recurring.filter((r) => r.type === 'expense' && r.category === c.id), (r) => r.amount),
  }))

  const saved = sum(
    state.pots.flatMap((p) => p.history.filter((h) => h.date.startsWith(key))),
    (h) => h.amount,
  )

  return { income, fixed, variable, spent, available, byCategory, saved, txCount: tx.length, txIncome, recIncome, recExpense }
}

export function lastMonths(state, key, count = 6) {
  return Array.from({ length: count }, (_, i) => {
    const k = shiftMonth(key, i - count + 1)
    const s = monthStats(state, k)
    return { key: k, income: s.income, spent: s.spent, available: s.available }
  })
}

export const potBalance = (pot) => sum(pot.history, (h) => h.amount)
export const potsTotal = (state) => sum(state.pots, potBalance)
export const assetsTotal = (state) => sum(state.assets, (a) => a.amount * a.price)

export function pctChange(curr, prev) {
  if (!prev) return curr ? null : 0
  return ((curr - prev) / prev) * 100
}
