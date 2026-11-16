const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0)
const signed = (t) => (t.type === 'income' ? t.amount : -t.amount)

export const accountTx = (state, id) => state.transactions.filter((t) => t.accountId === id)
export const accountBalance = (state, acc) => acc.initialBalance + sum(accountTx(state, acc.id), signed)
export const accountsTotal = (state) => sum(state.accounts, (a) => accountBalance(state, a))

/** Ein- und Ausgänge eines Kontos (oder aller Konten bei id = null) in einem Monat */
export function monthFlow(state, id, key) {
  const tx = state.transactions.filter((t) => (id ? t.accountId === id : true) && t.date.startsWith(key))
  const income = sum(tx.filter((t) => t.type === 'income'), (t) => t.amount)
  const expense = sum(tx.filter((t) => t.type === 'expense'), (t) => t.amount)
  return { income, expense, net: income - expense }
}

export const potBalance = (pot) => sum(pot.history, (h) => h.amount)
export const potsTotal = (state) => sum(state.pots, potBalance)
export const assetsTotal = (state) => sum(state.assets, (a) => a.amount * a.price)
export const netWorth = (state) => accountsTotal(state) + assetsTotal(state)
