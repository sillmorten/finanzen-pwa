/** Kontoarten */
export const ACCOUNT_TYPES = [
  { id: 'giro', label: 'Girokonto' },
  { id: 'spar', label: 'Sparkonto' },
  { id: 'tagesgeld', label: 'Tagesgeld' },
  { id: 'kredit', label: 'Kreditkarte' },
  { id: 'depot', label: 'Depot' },
  { id: 'wallet', label: 'Krypto-Wallet' },
  { id: 'bar', label: 'Bargeld' },
]
/** Kontoarten mit Wertpapier-/Krypto-Positionen */
export const INVEST_TYPES = ['depot', 'wallet']
export const isInvest = (acc) => INVEST_TYPES.includes(acc?.type)

export const accountTypeLabel = (id) => ACCOUNT_TYPES.find((t) => t.id === id)?.label ?? 'Konto'

/** Kartendesigns im Metall-Look (ink: Schriftfarbe) */
export const CARD_THEMES = [
  { id: 'black', label: 'Black Metal', ink: 'light', bg: 'linear-gradient(135deg,#2b2b2e 0%,#0d0d0f 45%,#1c1c20 70%,#050506 100%)' },
  { id: 'midnight', label: 'Titan', ink: 'light', bg: 'linear-gradient(135deg,#4b5563 0%,#1f2933 40%,#374151 70%,#111827 100%)' },
  { id: 'platin', label: 'Platin', ink: 'dark', bg: 'linear-gradient(135deg,#f5f5f4 0%,#c9cbcf 35%,#eef0f2 60%,#a8adb4 100%)' },
  { id: 'gold', label: 'Gold', ink: 'dark', bg: 'linear-gradient(135deg,#f6e3a1 0%,#c9a24a 35%,#f2d98c 60%,#a57c2c 100%)' },
  { id: 'rose', label: 'Roségold', ink: 'dark', bg: 'linear-gradient(135deg,#f6d5c8 0%,#c98f7a 38%,#f0c4b2 62%,#a46a58 100%)' },
  { id: 'emerald', label: 'Smaragd', ink: 'light', bg: 'linear-gradient(135deg,#0f5132 0%,#052e1c 40%,#0b4a30 70%,#021a10 100%)' },
  { id: 'ocean', label: 'Saphir', ink: 'light', bg: 'linear-gradient(135deg,#1e3a8a 0%,#0b1a45 42%,#1d3f8f 70%,#060f2b 100%)' },
  { id: 'violet', label: 'Amethyst', ink: 'light', bg: 'linear-gradient(135deg,#4c1d95 0%,#1e0b3d 42%,#4a1f8a 70%,#12062a 100%)' },
  { id: 'bordeaux', label: 'Bordeaux', ink: 'light', bg: 'linear-gradient(135deg,#7f1d1d 0%,#2f0a0d 42%,#6b1a1f 70%,#1a0507 100%)' },
  { id: 'sunset', label: 'Kupfer', ink: 'light', bg: 'linear-gradient(135deg,#b45f2d 0%,#5a2a12 42%,#a35428 70%,#2e1408 100%)' },
]
export const cardTheme = (id) => CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0]

export const POT_PRESETS = [
  { name: 'Notgroschen', emoji: '🛟', color: '#34d399' },
  { name: 'Technik & Hardware', emoji: '💻', color: '#60a5fa' },
  { name: 'Urlaub', emoji: '🏝️', color: '#f59e0b' },
  { name: 'Investitionen', emoji: '📈', color: '#a78bfa' },
]

export const POT_COLORS = ['#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#facc15', '#fb923c']

