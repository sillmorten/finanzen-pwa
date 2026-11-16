import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { fmtEUR, fmtNum } from '../lib/format'
import { Sheet, Button, Card } from './ui'

/** Liest "#add=<base64url-JSON>" aus der Adresse (verlässt nie das Gerät) */
function readHash() {
  const m = location.hash.match(/^#add=([A-Za-z0-9_-]+)/)
  if (!m) return null
  try {
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export default function AddLink({ toast, onDone }) {
  const { state, dispatch } = useStore()
  const [data, setData] = useState(readHash)

  useEffect(() => {
    const onHash = () => setData(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (!data?.accounts?.length) return null
  const close = () => {
    history.replaceState(null, '', location.pathname + '#accounts')
    setData(null)
  }
  const confirm = async () => {
    dispatch({ type: 'merge', data })
    close()
    onDone?.()
    toast('Hinzugefügt · Kurse werden geladen …')
  }

  return (
    <Sheet open onClose={close} title="Zu deiner App hinzufügen?">
      {data.accounts.map((acc, i) => {
        const exists = state.accounts.some((a) => a.name.trim().toLowerCase() === acc.name.trim().toLowerCase())
        return (
          <div key={i} className="mt-2">
            <div className="font-semibold">{acc.name} <span className="text-xs text-muted font-normal">{exists ? '(bestehendes Konto wird ergänzt)' : '(neues Konto)'}</span></div>
            <Card className="!p-0 mt-2 divide-y divide-line/60">
              {(acc.positions || []).map((p, j) => (
                <div key={j} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="flex-1 min-w-0 truncate">{p.name}</span>
                  <span className="text-muted tabular">{fmtNum(p.amount)} Stk.</span>
                  {p.buyValue ? <span className="tabular w-20 text-right">{fmtEUR(p.buyValue)}</span> : null}
                </div>
              ))}
            </Card>
          </div>
        )
      })}
      <p className="text-xs text-muted mt-3">Bestehende Daten bleiben erhalten. Ist ein Papier schon im Konto, werden Stückzahl und Kaufwert aktualisiert.</p>
      <div className="flex gap-2 mt-6">
        <Button variant="ghost" className="flex-1" onClick={close}>Abbrechen</Button>
        <Button className="flex-[2]" onClick={confirm}>Hinzufügen</Button>
      </div>
    </Sheet>
  )
}
