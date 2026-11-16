import { createContext, useContext, useEffect, useReducer } from 'react'
import { uid, todayISO } from './format'

const STORAGE_KEY = 'finanzen-pwa:v1'
export const SCHEMA_VERSION = 1

export const emptyState = () => ({
  version: SCHEMA_VERSION,
  /** Einzelbuchungen: { id, type: 'income'|'expense', amount, category, note, date } */
  transactions: [],
  /** Monatlich wiederkehrende Posten: { id, type, name, amount, category } */
  recurring: [],
  /** Spartöpfe: { id, name, emoji, color, target, deadline, history: [{ id, amount, date, note }] } */
  pots: [],
  /** Vermögenswerte: { id, name, symbol, kind: 'crypto'|'other', amount, price, updatedAt } */
  assets: [],
})

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    return normalize(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

/** Prüft und vervollständigt importierte / gespeicherte Daten */
export function normalize(data) {
  if (!data || typeof data !== 'object') throw new Error('Ungültige Datei')
  const base = emptyState()
  const arr = (v) => (Array.isArray(v) ? v : [])
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  return {
    ...base,
    transactions: arr(data.transactions)
      .filter((t) => t && (t.type === 'income' || t.type === 'expense'))
      .map((t) => ({ id: t.id || uid(), type: t.type, amount: Math.abs(n(t.amount)), category: t.category || 'sonstiges', note: t.note || '', date: t.date || todayISO() })),
    recurring: arr(data.recurring)
      .filter((r) => r && (r.type === 'income' || r.type === 'expense'))
      .map((r) => ({ id: r.id || uid(), type: r.type, name: r.name || '', amount: Math.abs(n(r.amount)), category: r.category || (r.type === 'income' ? 'gehalt' : 'fixkosten') })),
    pots: arr(data.pots).map((p) => ({
      id: p.id || uid(),
      name: p.name || 'Spartopf',
      emoji: p.emoji || '💰',
      color: p.color || '#34d399',
      target: Math.abs(n(p.target)),
      deadline: p.deadline || '',
      history: arr(p.history).map((h) => ({ id: h.id || uid(), amount: n(h.amount), date: h.date || todayISO(), note: h.note || '' })),
    })),
    assets: arr(data.assets).map((a) => ({
      id: a.id || uid(),
      name: a.name || a.symbol || 'Asset',
      symbol: (a.symbol || '').toUpperCase(),
      kind: a.kind === 'other' ? 'other' : 'crypto',
      amount: n(a.amount),
      price: n(a.price),
      updatedAt: a.updatedAt || null,
    })),
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'tx/add':
      return { ...state, transactions: [{ id: uid(), ...action.tx }, ...state.transactions] }
    case 'tx/update':
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.tx.id ? { ...t, ...action.tx } : t)) }
    case 'tx/delete':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }

    case 'rec/add':
      return { ...state, recurring: [...state.recurring, { id: uid(), ...action.item }] }
    case 'rec/update':
      return { ...state, recurring: state.recurring.map((r) => (r.id === action.item.id ? { ...r, ...action.item } : r)) }
    case 'rec/delete':
      return { ...state, recurring: state.recurring.filter((r) => r.id !== action.id) }

    case 'pot/add':
      return { ...state, pots: [...state.pots, { id: uid(), history: [], ...action.pot }] }
    case 'pot/update':
      return { ...state, pots: state.pots.map((p) => (p.id === action.pot.id ? { ...p, ...action.pot } : p)) }
    case 'pot/delete':
      return { ...state, pots: state.pots.filter((p) => p.id !== action.id) }
    case 'pot/move':
      return {
        ...state,
        pots: state.pots.map((p) =>
          p.id === action.id
            ? { ...p, history: [{ id: uid(), amount: action.amount, date: todayISO(), note: action.note || '' }, ...p.history] }
            : p,
        ),
      }
    case 'pot/undo':
      return { ...state, pots: state.pots.map((p) => (p.id === action.id ? { ...p, history: p.history.filter((h) => h.id !== action.entryId) } : p)) }

    case 'asset/add':
      return { ...state, assets: [...state.assets, { id: uid(), updatedAt: new Date().toISOString(), ...action.asset }] }
    case 'asset/update':
      return { ...state, assets: state.assets.map((a) => (a.id === action.asset.id ? { ...a, ...action.asset, updatedAt: new Date().toISOString() } : a)) }
    case 'asset/delete':
      return { ...state, assets: state.assets.filter((a) => a.id !== action.id) }
    case 'asset/prices':
      return {
        ...state,
        assets: state.assets.map((a) => (action.prices[a.id] != null ? { ...a, price: action.prices[a.id], updatedAt: new Date().toISOString() } : a)),
      }

    case 'import':
      return normalize(action.data)
    case 'reset':
      return emptyState()
    default:
      return state
  }
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Speichern fehlgeschlagen', e)
    }
  }, [state])

  useEffect(() => {
    // Bittet den Browser, die Daten nicht automatisch zu löschen
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  return <StoreCtx.Provider value={{ state, dispatch }}>{children}</StoreCtx.Provider>
}

export const useStore = () => useContext(StoreCtx)

export function exportJSON(state) {
  const payload = { app: 'finanzen-pwa', exportedAt: new Date().toISOString(), ...state }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finanzen-backup-${todayISO()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
