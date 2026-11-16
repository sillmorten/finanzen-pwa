import { createContext, useCallback, useContext, useState } from 'react'
import { Lock, Delete } from 'lucide-react'
import { useStore } from './store'
import { Sheet, Button } from '../components/ui'
import { vibrate } from './confetti'

export async function hashPin(pin) {
  const data = new TextEncoder().encode('finanzen-pwa:' + pin)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const LockCtx = createContext(null)
export const useLock = () => useContext(LockCtx)

/** Stellt toggleLock(account) bereit und zeigt bei Bedarf PIN-Abfrage / PIN-Einrichtung */
export function LockProvider({ children, toast }) {
  const { state, dispatch } = useStore()
  const [req, setReq] = useState(null) // { mode: 'unlock'|'setup', account }

  const toggleLock = useCallback(
    (acc) => {
      if (!acc.locked) {
        if (!state.pinHash) return setReq({ mode: 'setup', account: acc })
        dispatch({ type: 'acc/lock', id: acc.id, locked: true })
        vibrate(20)
        toast(`🔒 ${acc.name} gesperrt`)
      } else {
        if (!state.pinHash) {
          dispatch({ type: 'acc/lock', id: acc.id, locked: false })
          toast(`🔓 ${acc.name} entsperrt`)
        } else setReq({ mode: 'unlock', account: acc })
      }
    },
    [state.pinHash, dispatch, toast],
  )

  return (
    <LockCtx.Provider value={{ toggleLock, hasPin: !!state.pinHash, openPinSetup: () => setReq({ mode: 'setup', account: null }) }}>
      {children}
      {req && <PinSheet {...req} onClose={() => setReq(null)} toast={toast} />}
    </LockCtx.Provider>
  )
}

function PinSheet({ mode, account, onClose, toast }) {
  const { state, dispatch } = useStore()
  const [pin, setPin] = useState('')
  const [first, setFirst] = useState(null) // Setup: erste Eingabe
  const [error, setError] = useState('')
  const [step, setStep] = useState(mode === 'setup' ? 'choose' : 'enter')

  const done = (msg) => { toast(msg); onClose() }

  const submit = async (value) => {
    if (mode === 'unlock') {
      if ((await hashPin(value)) === state.pinHash) {
        dispatch({ type: 'acc/lock', id: account.id, locked: false })
        done(`🔓 ${account.name} entsperrt`)
      } else {
        vibrate([40, 50, 40]); setError('Falsche PIN'); setPin('')
      }
      return
    }
    if (mode === 'change') return
    // Setup
    if (!first) { setFirst(value); setPin(''); setError(''); return }
    if (first !== value) { vibrate([40, 50, 40]); setError('PINs stimmen nicht überein'); setFirst(null); setPin(''); return }
    dispatch({ type: 'pin/set', hash: await hashPin(value) })
    if (account) { dispatch({ type: 'acc/lock', id: account.id, locked: true }); done(`🔒 ${account.name} gesperrt · PIN aktiv`) }
    else done('PIN gespeichert')
  }

  const press = (d) => {
    setError('')
    const next = (pin + d).slice(0, 4)
    setPin(next)
    if (next.length === 4) setTimeout(() => submit(next), 120)
  }

  if (step === 'choose') {
    return (
      <Sheet open onClose={onClose} title={account ? `${account.name} sperren` : 'PIN festlegen'}>
        <div className="flex flex-col items-center text-center py-2">
          <div className="size-16 rounded-full bg-surface-2 grid place-items-center mb-3"><Lock size={28} /></div>
          <p className="text-muted text-sm">Gesperrte Karten zeigen keine Beträge mehr, bis du sie wieder entsperrst. Mit einer PIN kann sie nur entsperren, wer die PIN kennt.</p>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={() => setStep('enter')}>Mit 4-stelliger PIN schützen</Button>
          {account && (
            <Button variant="ghost" onClick={() => { dispatch({ type: 'acc/lock', id: account.id, locked: true }); done(`🔒 ${account.name} gesperrt`) }}>Ohne PIN sperren</Button>
          )}
        </div>
      </Sheet>
    )
  }

  const title = mode === 'unlock' ? 'PIN eingeben' : first ? 'PIN wiederholen' : 'Neue PIN wählen'
  return (
    <Sheet open onClose={onClose} title={mode === 'unlock' ? `${account.name} entsperren` : 'PIN festlegen'}>
      <div className="text-center">
        <p className="text-muted text-sm">{title}</p>
        <div className="flex justify-center gap-4 my-5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`size-4 rounded-full border-2 ${i < pin.length ? 'bg-white border-white' : 'border-line'} ${error ? 'border-spend' : ''}`} />
          ))}
        </div>
        <p className="text-spend text-sm h-5">{error}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2 max-w-xs mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) =>
          k === '' ? <span key="e" /> : (
            <button
              key={k}
              onClick={() => (k === 'del' ? setPin((p) => p.slice(0, -1)) : press(k))}
              className="h-16 rounded-2xl bg-surface-2 text-2xl font-medium active:bg-line grid place-items-center"
              aria-label={k === 'del' ? 'Löschen' : k}
            >
              {k === 'del' ? <Delete size={22} /> : k}
            </button>
          ),
        )}
      </div>
      {mode === 'unlock' && <p className="text-xs text-muted text-center mt-4">PIN vergessen? Unter „Backup“ kannst du die PIN mit allen Daten zurücksetzen.</p>}
    </Sheet>
  )
}
