import { createContext, useContext, useEffect, useReducer } from 'react'
import { uid, todayISO } from './format'
import { CRYPTOS } from './instruments'

const CRYPTO_BY_SYMBOL = Object.fromEntries(CRYPTOS.map((c) => [c.symbol, c]))

const STORAGE_KEY = 'finanzen-pwa:v1'
export const SCHEMA_VERSION = 2

export const emptyState = () => ({
  version: SCHEMA_VERSION,
  /** Konten / Karten: { id, name, type, theme, last4, initialBalance } */
  accounts: [],
  /** Buchungen: { id, accountId, type: 'income'|'expense', amount, note, date } */
  transactions: [],
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
  const out = {
    ...base,
    accounts: arr(data.accounts).map((a) => ({
      id: a.id || uid(),
      name: a.name || 'Konto',
      type: a.type || 'giro',
      theme: a.theme || 'emerald',
      last4: String(a.last4 || '').replace(/\D/g, '').slice(-4),
      initialBalance: n(a.initialBalance),
      limit: Math.abs(n(a.limit)),
    })),
    transactions: arr(data.transactions)
      .filter((t) => t && (t.type === 'income' || t.type === 'expense'))
      .map((t) => ({ id: t.id || uid(), accountId: t.accountId || null, type: t.type, amount: Math.abs(n(t.amount)), note: t.note || '', date: t.date || todayISO() })),
    pots: arr(data.pots).map((p) => ({
      id: p.id || uid(),
      name: p.name || 'Spartopf',
      emoji: p.emoji || '💰',
      color: p.color || '#34d399',
      target: Math.abs(n(p.target)),
      deadline: p.deadline || '',
      history: arr(p.history).map((h) => ({ id: h.id || uid(), amount: n(h.amount), date: h.date || todayISO(), note: h.note || '' })),
    })),
    /** Positionen: { id, accountId, kind: 'etf'|'crypto'|'other', name, symbol, isin, cgId, amount, price, buyValue, change, updatedAt } */
    assets: arr(data.assets).map((a) => ({
      id: a.id || uid(),
      accountId: a.accountId || null,
      kind: ['etf', 'crypto', 'other'].includes(a.kind) ? a.kind : 'other',
      name: a.name || a.symbol || 'Position',
      symbol: (a.symbol || '').toUpperCase(),
      isin: a.isin || '',
      cgId: a.cgId || '',
      amount: n(a.amount),
      price: n(a.price),
      buyValue: a.buyValue ? n(a.buyValue) : 0,
      change: a.change ?? null,
      updatedAt: a.updatedAt || null,
    })),
    pricesUpdatedAt: data.pricesUpdatedAt || null,
  }
  // Migration: Positionen ohne Konto einer Krypto-Wallet zuordnen
  const looseAssets = out.assets.filter((a) => !a.accountId || !out.accounts.some((x) => x.id === a.accountId))
  if (looseAssets.length) {
    const wallet = { id: uid(), name: 'Krypto-Wallet', type: 'wallet', theme: 'black', last4: '', initialBalance: 0, limit: 0 }
    out.accounts.push(wallet)
    out.assets = out.assets.map((a) => {
      if (!looseAssets.includes(a)) return a
      const crypto = CRYPTO_BY_SYMBOL[a.symbol]
      return { ...a, accountId: wallet.id, kind: crypto ? 'crypto' : a.kind, cgId: a.cgId || crypto?.id || '' }
    })
  }
  // Migration v1 -> v2: Buchungen ohne Konto einem Hauptkonto zuordnen
  const orphans = out.transactions.filter((t) => !t.accountId || !out.accounts.some((a) => a.id === t.accountId))
  if (orphans.length) {
    let main = out.accounts[0]
    if (!main) {
      main = { id: uid(), name: 'Hauptkonto', type: 'giro', theme: 'emerald', last4: '', initialBalance: 0 }
      out.accounts.push(main)
    }
    out.transactions = out.transactions.map((t) => (orphans.includes(t) ? { ...t, accountId: main.id } : t))
  }
  return out
}

function reducer(state, action) {
  switch (action.type) {
    case 'tx/add':
      return { ...state, transactions: [{ id: uid(), ...action.tx }, ...state.transactions] }
    case 'tx/update':
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.tx.id ? { ...t, ...action.tx } : t)) }
    case 'tx/delete':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }

    case 'acc/add':
      return { ...state, accounts: [...state.accounts, { id: action.id || uid(), ...action.account }] }
    case 'acc/update':
      return { ...state, accounts: state.accounts.map((a) => (a.id === action.account.id ? { ...a, ...action.account } : a)) }
    case 'acc/delete':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.id),
        transactions: state.transactions.filter((t) => t.accountId !== action.id),
        assets: state.assets.filter((a) => a.accountId !== action.id),
      }

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
      return { ...state, assets: state.assets.map((a) => (a.id === action.asset.id ? { ...a, ...action.asset } : a)) }
    case 'asset/delete':
      return { ...state, assets: state.assets.filter((a) => a.id !== action.id) }
    case 'asset/prices':
      return {
        ...state,
        pricesUpdatedAt: new Date().toISOString(),
        assets: state.assets.map((a) => {
          const q = action.prices[a.id]
          return q ? { ...a, price: q.price, change: q.change ?? null, updatedAt: q.time || new Date().toISOString() } : a
        }),
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
