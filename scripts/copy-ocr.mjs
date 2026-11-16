// Kopiert die Texterkennung (Tesseract) in public/ocr, damit sie ohne fremde Server läuft.
import { mkdir, copyFile } from 'node:fs/promises'
const dst = new URL('../public/ocr/', import.meta.url)
await mkdir(dst, { recursive: true })
const nm = new URL('../node_modules/', import.meta.url)
const files = [
  ['tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz', 'deu.traineddata.gz'],
]
for (const [from, to] of files) await copyFile(new URL(from, nm), new URL(to, dst))
console.log('OCR-Dateien kopiert')
