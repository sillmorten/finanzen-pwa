/** Kontoarten */
export const ACCOUNT_TYPES = [
  { id: 'giro', label: 'Girokonto' },
  { id: 'spar', label: 'Sparkonto' },
  { id: 'tagesgeld', label: 'Tagesgeld' },
  { id: 'kredit', label: 'Kreditkarte' },
  { id: 'depot', label: 'Depot' },
  { id: 'bar', label: 'Bargeld' },
]
export const accountTypeLabel = (id) => ACCOUNT_TYPES.find((t) => t.id === id)?.label ?? 'Konto'

/** Kartendesigns (Verlauf) */
export const CARD_THEMES = [
  { id: 'emerald', label: 'Smaragd', bg: 'linear-gradient(135deg,#065f46 0%,#10b981 55%,#34d399 100%)' },
  { id: 'midnight', label: 'Mitternacht', bg: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)' },
  { id: 'ocean', label: 'Ozean', bg: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 55%,#38bdf8 100%)' },
  { id: 'violet', label: 'Violett', bg: 'linear-gradient(135deg,#3b0764 0%,#7c3aed 55%,#c084fc 100%)' },
  { id: 'sunset', label: 'Sonnenuntergang', bg: 'linear-gradient(135deg,#7c2d12 0%,#ea580c 55%,#fbbf24 100%)' },
  { id: 'rose', label: 'Rosé', bg: 'linear-gradient(135deg,#831843 0%,#db2777 55%,#f9a8d4 100%)' },
  { id: 'gold', label: 'Gold', bg: 'linear-gradient(135deg,#713f12 0%,#ca8a04 50%,#fde68a 100%)' },
  { id: 'black', label: 'Schwarz', bg: 'linear-gradient(135deg,#000000 0%,#18181b 60%,#3f3f46 100%)' },
]
export const cardTheme = (id) => CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0]

export const POT_PRESETS = [
  { name: 'Notgroschen', emoji: '🛟', color: '#34d399' },
  { name: 'Technik & Hardware', emoji: '💻', color: '#60a5fa' },
  { name: 'Urlaub', emoji: '🏝️', color: '#f59e0b' },
  { name: 'Investitionen', emoji: '📈', color: '#a78bfa' },
]

export const POT_COLORS = ['#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#facc15', '#fb923c']

/** Für optionale Kursabfrage (CoinGecko, ohne API-Key) */
export const COINGECKO_IDS = {
  BTC: 'bitcoin', ETH: 'ethereum', XRP: 'ripple', SOL: 'solana', ADA: 'cardano', DOGE: 'dogecoin',
  DOT: 'polkadot', LTC: 'litecoin', LINK: 'chainlink', XLM: 'stellar', USDT: 'tether', USDC: 'usd-coin',
  BNB: 'binancecoin', AVAX: 'avalanche-2', TRX: 'tron',
}
