// Farben: validierte Kategorie-Palette (dunkler Hintergrund, farbenblind-tauglich)
export const EXPENSE_CATEGORIES = [
  { id: 'lebensmittel', label: 'Lebensmittel', emoji: '🛒', color: '#3987e5' },
  { id: 'freizeit', label: 'Freizeit', emoji: '🎉', color: '#d95926' },
  { id: 'fixkosten', label: 'Fixkosten', emoji: '🏠', color: '#199e70' },
  { id: 'abo', label: 'Abo', emoji: '🔁', color: '#c98500' },
  { id: 'sonstiges', label: 'Sonstiges', emoji: '📦', color: '#d55181' },
]

export const INCOME_CATEGORIES = [
  { id: 'gehalt', label: 'Gehalt', emoji: '💼', color: '#34d399' },
  { id: 'nebenjob', label: 'Nebeneinkunft', emoji: '🧾', color: '#2dd4bf' },
  { id: 'sonstiges-ein', label: 'Sonstiges', emoji: '✨', color: '#a3e635' },
]

/** Kategorien, die als Fixkosten zählen */
export const FIXED_CATEGORY_IDS = ['fixkosten', 'abo']

const ALL = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
export const getCategory = (id) => ALL.find((c) => c.id === id) ?? { id, label: id, emoji: '•', color: '#94a3b8' }

export const POT_PRESETS = [
  { name: 'Notgroschen', emoji: '🛟', color: '#34d399' },
  { name: 'Technik & Hardware', emoji: '💻', color: '#60a5fa' },
  { name: 'Urlaub', emoji: '🏝️', color: '#f59e0b' },
  { name: 'Investitionen', emoji: '📈', color: '#a78bfa' },
]

export const POT_COLORS = ['#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#facc15', '#fb923c']

/** Für optionale Kursabfrage (CoinGecko, ohne API-Key) */
export const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  XRP: 'ripple',
  SOL: 'solana',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  LTC: 'litecoin',
  LINK: 'chainlink',
  XLM: 'stellar',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  TRX: 'tron',
}
