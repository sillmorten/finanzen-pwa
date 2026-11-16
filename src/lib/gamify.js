import { potBalance } from './finance'

export const LEVELS = [
  { min: 0, name: 'Spar-Neuling', emoji: '🌱' },
  { min: 100, name: 'Kleingeld-Sammler', emoji: '🪙' },
  { min: 250, name: 'Sparfuchs', emoji: '🦊' },
  { min: 500, name: 'Rücklagen-Bauer', emoji: '🧱' },
  { min: 1000, name: 'Vierstellig', emoji: '🚀' },
  { min: 2500, name: 'Finanz-Ninja', emoji: '🥷' },
  { min: 5000, name: 'Vermögensaufbauer', emoji: '🏗️' },
  { min: 10000, name: 'Fünfstellig', emoji: '💎' },
  { min: 25000, name: 'Sparmeister', emoji: '🏆' },
  { min: 50000, name: 'Finanz-Legende', emoji: '🦁' },
  { min: 100000, name: 'Sechsstellig', emoji: '👑' },
]

export function levelFor(total) {
  let i = 0
  while (i + 1 < LEVELS.length && total >= LEVELS[i + 1].min) i++
  const cur = LEVELS[i]
  const next = LEVELS[i + 1] || null
  const progress = next ? ((total - cur.min) / (next.min - cur.min)) * 100 : 100
  return { index: i, level: i + 1, ...cur, next, progress, toNext: next ? next.min - total : 0 }
}

/** Montag der Woche als "YYYY-MM-DD" */
function weekStart(iso) {
  const d = new Date(iso + 'T00:00:00')
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

/** Alle Einzahlungen in Spartöpfe */
export const deposits = (state) => state.pots.flatMap((p) => p.history.filter((h) => h.amount > 0))

/** Spar-Serie: aufeinanderfolgende Wochen mit mindestens einer Einzahlung */
export function weekStreak(state) {
  const weeks = new Set(deposits(state).map((h) => weekStart(h.date)))
  if (!weeks.size) return { streak: 0, thisWeek: false }
  const today = new Date()
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  let cursor = new Date(weekStart(iso(today)) + 'T00:00:00')
  const thisWeek = weeks.has(iso(cursor))
  if (!thisWeek) cursor.setDate(cursor.getDate() - 7) // Serie bleibt bis Wochenende erhalten
  let streak = 0
  while (weeks.has(iso(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }
  return { streak, thisWeek }
}

export function badges(state) {
  const deps = deposits(state)
  const total = state.pots.reduce((s, p) => s + potBalance(p), 0)
  const { streak } = weekStreak(state)
  const goalsDone = state.pots.filter((p) => p.target > 0 && potBalance(p) >= p.target).length
  const best = Math.max(0, ...deps.map((d) => d.amount))
  return [
    { id: 'first', emoji: '🎯', name: 'Erster Schritt', desc: 'Erste Einzahlung in einen Spartopf', done: deps.length >= 1 },
    { id: 'pot3', emoji: '🗂️', name: 'Gut sortiert', desc: '3 Spartöpfe angelegt', done: state.pots.length >= 3 },
    { id: 'd10', emoji: '🔟', name: 'Dranbleiber', desc: '10 Einzahlungen', done: deps.length >= 10 },
    { id: 'd50', emoji: '🧲', name: 'Sparmagnet', desc: '50 Einzahlungen', done: deps.length >= 50 },
    { id: 's4', emoji: '🔥', name: 'Heiße Serie', desc: '4 Wochen in Folge gespart', done: streak >= 4 },
    { id: 's12', emoji: '☄️', name: 'Unaufhaltsam', desc: '12 Wochen in Folge gespart', done: streak >= 12 },
    { id: 'big', emoji: '💪', name: 'Großer Wurf', desc: '500 € auf einmal eingezahlt', done: best >= 500 },
    { id: 'goal', emoji: '🏁', name: 'Ziel erreicht', desc: 'Einen Spartopf komplett gefüllt', done: goalsDone >= 1 },
    { id: 'goal3', emoji: '🥇', name: 'Zielsicher', desc: '3 Spartöpfe komplett gefüllt', done: goalsDone >= 3 },
    { id: 't1k', emoji: '🚀', name: 'Tausender', desc: '1.000 € insgesamt gespart', done: total >= 1000 },
    { id: 't10k', emoji: '💎', name: 'Zehntausender', desc: '10.000 € insgesamt gespart', done: total >= 10000 },
  ]
}

const CHEERS = [
  'Stark! Jeder Euro zählt. 💪',
  'Weiter so, dein Zukunfts-Ich dankt dir! 🙌',
  'Läuft bei dir! 🚀',
  'Schritt für Schritt zum Ziel! 🎯',
  'Sauber gespart! ✨',
  'Dein Vermögen wächst! 🌱',
]
export const randomCheer = () => CHEERS[Math.floor(Math.random() * CHEERS.length)]
