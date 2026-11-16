import { accountCash, positionValue, potsTotal } from './finance'
import { ETFS } from './instruments'
import { monthKey, shiftMonth } from './format'

const STOCK_ISINS = new Set(ETFS.filter((e) => e.stock).map((e) => e.isin))

/**
 * Regelbasierte, allgemeine Ideen, wo ungenutztes Geld sinnvoll hin könnte.
 * Kein Anlageberatung, nur Faustregeln (Notgroschen → Tagesgeld → breiter ETF-Sparplan).
 */
export function analyze(state, bufferMonths = 3) {
  const open = state.accounts.filter((a) => !a.locked)
  const cashOf = (types) => open.filter((a) => types.includes(a.type)).reduce((s, a) => s + Math.max(0, accountCash(state, a)), 0)
  const giro = cashOf(['giro', 'bar'])
  const safe = cashOf(['tagesgeld', 'spar']) + potsTotal(state)

  // Ø Ausgaben/Einnahmen der letzten 3 vollen Monate (mit Daten)
  const now = monthKey(new Date())
  const months = [1, 2, 3].map((i) => shiftMonth(now, -i))
  const flows = months.map((m) => {
    const tx = state.transactions.filter((t) => !t.transferId && t.date.startsWith(m))
    return {
      inc: tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      exp: tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  }).filter((f) => f.inc || f.exp)
  const hasData = flows.length > 0
  const avgExp = hasData ? flows.reduce((s, f) => s + f.exp, 0) / flows.length : 0
  const avgSurplus = hasData ? flows.reduce((s, f) => s + f.inc - f.exp, 0) / flows.length : 0
  const monthly = avgExp || 1000 // Annahme, wenn noch keine Buchungen da sind

  const buffer = Math.round(monthly * bufferMonths)
  const giroKeep = Math.round(monthly * 1.2) // ein Monat + Puffer bleibt auf dem Giro
  const giroIdle = Math.max(0, giro - giroKeep)
  const bufferGap = Math.max(0, buffer - safe)

  const pos = state.assets.filter((p) => open.some((a) => a.id === p.accountId))
  const invest = pos.reduce((s, p) => s + positionValue(p), 0)
  const crypto = pos.filter((p) => p.kind === 'crypto').reduce((s, p) => s + positionValue(p), 0)
  const stocks = pos.filter((p) => STOCK_ISINS.has(p.isin)).reduce((s, p) => s + positionValue(p), 0)

  const ideas = []
  if (bufferGap > 0) {
    ideas.push({
      id: 'buffer', emoji: '🛟', tone: 'amber',
      title: 'Erst den Notgroschen füllen',
      text: `Faustregel: ${bufferMonths} Monatsausgaben (≈ ${fmt(buffer)}) sicher auf Tagesgeld. Dir fehlen noch ≈ ${fmt(bufferGap)}.`,
      amount: Math.min(bufferGap, giroIdle) || null, action: 'Tagesgeld',
    })
  }
  if (giroIdle > 50) {
    const toBuffer = Math.min(giroIdle, bufferGap)
    const rest = giroIdle - toBuffer
    ideas.push({
      id: 'idle', emoji: '💤', tone: 'sky',
      title: `${fmt(giroIdle)} liegen ungenutzt auf dem Giro`,
      text: toBuffer > 0
        ? `Auf dem Giro gibt es keine Zinsen. Behalte ≈ ${fmt(giroKeep)} für den Alltag, ${fmt(toBuffer)} aufs Tagesgeld${rest > 0 ? ` und ${fmt(rest)} könnten investiert werden` : ''}.`
        : `Dein Notgroschen steht. Behalte ≈ ${fmt(giroKeep)} für den Alltag, den Rest könntest du langfristig investieren, z. B. in einen breiten Welt-ETF.`,
    })
  }
  if (bufferGap === 0 || giroIdle - bufferGap > 0 || avgSurplus > 0) {
    const plan = avgSurplus > 25 ? Math.max(25, Math.floor((avgSurplus * 0.5) / 25) * 25) : 25
    ideas.push({
      id: 'etf', emoji: '🌍', tone: 'save',
      title: `ETF-Sparplan ab ${fmt(plan)} im Monat`,
      text: `Breit gestreut über ein Welt-ETF (MSCI World / FTSE All-World / MSCI ACWI). Bei Trade Republic gratis als Sparplan. Langfristig (10+ Jahre) und automatisch, ohne Timing.${hasData && avgSurplus > 0 ? ` Vorschlag: die Hälfte deines Ø-Überschusses von ${fmt(avgSurplus)}.` : ''}`,
    })
  }
  if (invest > 0 && stocks / invest > 0.3) {
    ideas.push({
      id: 'stocks', emoji: '🧺', tone: 'violet',
      title: `${Math.round((stocks / invest) * 100)} % in Einzelaktien`,
      text: 'Einzelaktien schwanken viel stärker als ein ETF. Neues Geld eher in den Welt-ETF, so wird dein Depot automatisch breiter.',
    })
  }
  if (invest > 0 && crypto / (invest + safe + giro) > 0.15) {
    ideas.push({
      id: 'crypto', emoji: '🎢', tone: 'violet',
      title: 'Krypto ist ein großer Anteil',
      text: 'Viele halten Krypto bei max. 5–10 % des Vermögens, weil es sehr stark schwankt. Nur Geld, auf das du verzichten kannst.',
    })
  }
  if (!hasData) {
    ideas.push({
      id: 'data', emoji: '✍️', tone: 'muted',
      title: 'Trag Ein- und Ausgaben ein',
      text: 'Dann rechne ich mit deinen echten Monatsausgaben statt mit 1.000 € als Annahme.',
    })
  }
  return { ideas, giro, safe, buffer, giroIdle, hasData, avgExp, avgSurplus }
}

const fmt = (n) => Math.round(n).toLocaleString('de-DE') + ' €'

const EMOJI = [
  [/controller|konsole|playstation|ps5|xbox|switch|spiel|game/i, '🎮'],
  [/wasch|trockner|spül|kühlschrank|herd|staubsauger/i, '🧺'],
  [/bildschirm|monitor|fernseher|tv/i, '🖥️'],
  [/handy|iphone|smartphone|samsung|pixel/i, '📱'],
  [/laptop|pc|computer|macbook|rechner/i, '💻'],
  [/kopfhörer|airpods|headset|lautsprecher|box/i, '🎧'],
  [/auto|reifen|führerschein/i, '🚗'],
  [/rad|fahrrad|e-bike/i, '🚲'],
  [/urlaub|reise|flug/i, '✈️'],
  [/schuh|jacke|kleidung|sneaker/i, '👟'],
  [/uhr|watch/i, '⌚'],
  [/sofa|bett|möbel|stuhl|tisch|schreibtisch/i, '🛋️'],
]
export const guessEmoji = (name) => EMOJI.find(([re]) => re.test(name))?.[1] || '🎁'

const daysSince = (iso) => Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86400000)
const WAIT_DAYS = 30

/**
 * Einschätzung eines Wunsches:
 * good (✅) | wait (⏳) | save (🎯) | no (✋)
 */
export function wishVerdict(state, wish) {
  const r = analyze(state, 3)
  const pot = wish.potId ? state.pots.find((p) => p.id === wish.potId) : null
  const potBal = pot ? pot.history.reduce((s, h) => s + h.amount, 0) : 0
  const free = Math.max(0, r.giroIdle - Math.max(0, r.buffer - r.safe)) + potBal
  const price = wish.price
  const waited = daysSince(wish.createdAt)
  const missing = Math.max(0, price - free)
  const months = r.avgSurplus > 0 ? Math.ceil(missing / r.avgSurplus) : null
  const monthsTxt = months ? `Mit deinem Ø-Überschuss von ${fmt(r.avgSurplus)} hast du es in ca. ${months} ${months === 1 ? 'Monat' : 'Monaten'} zusammen.` : 'Leg einen Spartopf dafür an, dann siehst du, wann du es dir leisten kannst.'
  const share = r.avgSurplus > 0 ? price / r.avgSurplus : null

  if (pot && potBal >= price) {
    return { kind: 'good', label: 'Gute Idee', text: `Dein Spartopf „${pot.name}“ ist voll. Du hast es dir erspart, gönn dir!` }
  }
  if (missing === 0) {
    if (wish.need === 'need') return { kind: 'good', label: 'Gute Idee', text: 'Du brauchst es und kannst es bezahlen, ohne deinen Notgroschen anzufassen.' }
    if (price < 30) return { kind: 'good', label: 'Passt', text: 'Kleiner Betrag, den du locker übrig hast. Gönn dir.' }
    if (waited < WAIT_DAYS) {
      return { kind: 'wait', label: `Warte noch ${WAIT_DAYS - waited} Tage`, text: `Leisten kannst du es. Aber 30-Tage-Regel: Willst du es danach immer noch, ist es ein echter Wunsch und kein Impulskauf.${share && share > 1 ? ` Das sind übrigens ${share.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Monate Überschuss.` : ''}` }
    }
    return { kind: 'good', label: 'Gönn dir', text: `Du willst es seit ${waited} Tagen und es ist bezahlbar, ohne den Notgroschen anzufassen. Sieht nach einem echten Wunsch aus.` }
  }
  if (wish.need === 'need') {
    return { kind: 'save', label: 'Gezielt drauf sparen', text: `Dir fehlen noch ≈ ${fmt(missing)}, ohne deinen Notgroschen anzugreifen. ${monthsTxt} Ist es ein Notfall (z. B. Waschmaschine kaputt), dafür ist der Notgroschen da.` }
  }
  return { kind: 'no', label: 'Lieber noch nicht', text: `Würde gerade an deinen Notgroschen oder dein Alltagsgeld gehen, es fehlen ≈ ${fmt(missing)}. ${monthsTxt}` }
}
