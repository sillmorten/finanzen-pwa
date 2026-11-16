/**
 * Kassenbon-Erkennung komplett im Browser (Tesseract, deutsches Sprachmodell).
 * Das Foto verlässt das Gerät nicht; die Modelldateien liegen unter /ocr/ neben der App.
 */

const STORES = ['REWE', 'EDEKA', 'ALDI', 'LIDL', 'PENNY', 'NETTO', 'KAUFLAND', 'NORMA', 'DM', 'ROSSMANN', 'MÜLLER', 'IKEA', 'MEDIAMARKT', 'MEDIA MARKT', 'SATURN', 'HORNBACH', 'OBI', 'BAUHAUS', 'TOOM', 'GLOBUS', 'TEDI', 'ACTION', 'PRIMARK', 'H&M', 'ZARA', 'DECATHLON', 'MCDONALD', 'BURGER KING', 'KFC', 'STARBUCKS', 'SHELL', 'ARAL', 'ESSO', 'BACKWERK', 'APOTHEKE', 'TEGUT', 'BUDNI', 'FAMILA', 'MARKTKAUF', 'THALIA', 'DEICHMANN', 'TK MAXX', 'SUBWAY']

// Zeilen, in denen der Endbetrag steht (stärkste zuerst)
const TOTAL_RE = [
  /\b(zu\s*zahlen|zahlbetrag|gesamtbetrag|endbetrag|summe\s*eur|gesamt\s*eur)\b/i,
  /\b(summe|gesamt|total|betrag)\b/i,
  /\b(ec[- ]?cash|girocard|kartenzahlung|karte|bar|visa|mastercard|gegeben)\b/i,
]
const SKIP_RE = /\b(mwst|ust|netto|steuer|rückgeld|rueckgeld|zurück|pfand|rabatt|ersparnis|gespart|punkte|payback)\b/i

const AMOUNT_RE = /(-?\d{1,4}(?:[.\s]\d{3})*)\s?[,.]\s?(\d{2})(?!\d)/g

function amountsIn(line) {
  const out = []
  line = line.replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, ' ').replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, ' ')
  for (const m of line.matchAll(AMOUNT_RE)) {
    const v = Number(m[1].replace(/[.\s]/g, '') + '.' + m[2])
    if (Number.isFinite(v) && v > 0 && v < 100000) out.push(v)
  }
  return out
}

function findDate(text) {
  const m = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/)
  if (!m) return null
  let [, d, mo, y] = m.map(Number)
  if (y < 100) y += 2000
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2015 || y > 2100) return null
  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const today = new Date().toISOString().slice(0, 10)
  return iso > today ? null : iso
}

function findStore(lines) {
  const up = lines.slice(0, 12).join(' ').toUpperCase()
  const hit = STORES.find((s) => new RegExp(`(^|[^A-ZÄÖÜ])${s.replace(/[&]/g, '\\$&')}([^A-ZÄÖÜ]|$)`).test(up))
  if (hit) return hit === 'MCDONALD' ? "McDonald's" : hit.length <= 4 ? hit : hit.charAt(0) + hit.slice(1).toLowerCase()
  const first = lines.find((l) => /[a-zäöü]{3,}/i.test(l) && !/\d{3,}/.test(l) && l.length <= 32)
  return first ? first.replace(/[^\p{L}\d &'.-]/gu, '').trim() : ''
}

/** Wertet erkannten Bon-Text aus: Endbetrag, Datum, Geschäft + weitere Kandidaten */
export function parseReceipt(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
  let total = null
  for (const re of TOTAL_RE) {
    for (const l of lines) {
      if (!re.test(l) || SKIP_RE.test(l)) continue
      const a = amountsIn(l)
      if (a.length) { total = a[a.length - 1]; break }
    }
    if (total != null) break
  }
  const all = lines.filter((l) => !SKIP_RE.test(l)).flatMap(amountsIn)
  const byCount = [...new Set(all)].sort((a, b) => b - a)
  if (total == null) total = byCount[0] ?? null
  const candidates = [total, ...byCount.filter((v) => v !== total)].filter((v) => v != null).slice(0, 4)
  return { amount: total, candidates, date: findDate(text), store: findStore(lines), text }
}

/** Bild verkleinern + Graustufen/Kontrast für bessere Erkennung */
async function prepare(file) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  const g = c.getContext('2d')
  g.filter = 'grayscale(1) contrast(1.6) brightness(1.08)'
  g.drawImage(bmp, 0, 0, c.width, c.height)
  return c
}

let workerP = null
async function getWorker(onProgress) {
  if (!workerP) {
    workerP = (async () => {
      const { createWorker } = await import('tesseract.js')
      const base = `${location.origin}${import.meta.env.BASE_URL}ocr/`
      return createWorker('deu', 1, {
        workerPath: base + 'worker.min.js',
        corePath: base,
        langPath: base.replace(/\/$/, ''),
        gzip: true,
        logger: (m) => workerP.progress?.(m),
      })
    })()
    workerP.catch(() => { workerP = null })
  }
  workerP.progress = onProgress
  return workerP
}

export async function scanReceipt(file, onProgress = () => {}) {
  onProgress({ status: 'Bild wird vorbereitet', progress: 0 })
  const img = await prepare(file)
  const worker = await getWorker((m) => {
    const label = m.status?.includes('recogniz') ? 'Text wird gelesen' : 'Texterkennung wird geladen'
    onProgress({ status: label, progress: m.progress || 0 })
  })
  const { data } = await worker.recognize(img)
  return parseReceipt(data.text || '')
}
