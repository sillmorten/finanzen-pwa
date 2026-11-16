import { useCallback, useEffect, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import BottomNav from './components/BottomNav'
import TransactionSheet from './components/TransactionSheet'
import { Toast } from './components/ui'
import Dashboard from './views/Dashboard'
import Savings from './views/Savings'
import Transactions from './views/Transactions'
import Assets from './views/Assets'
import Settings from './views/Settings'

const TITLES = { dashboard: 'Übersicht', savings: 'Sparziele', transactions: 'Buchungen', assets: 'Vermögen' }
const getHashTab = () => {
  const h = location.hash.replace('#', '')
  return TITLES[h] ? h : 'dashboard'
}

export default function App() {
  const [tab, setTab] = useState(getHashTab)
  const [txOpen, setTxOpen] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toast = useCallback((m) => setToastMsg(m), [])
  const clearToast = useCallback(() => setToastMsg(''), [])

  useEffect(() => {
    const onHash = () => setTab(getHashTab())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goTab = (t) => {
    history.replaceState(null, '', `#${t}`)
    setTab(t)
    window.scrollTo({ top: 0 })
  }
  const openAdd = () => { setEditTx(null); setTxOpen(true) }

  return (
    <div className="min-h-dvh pb-32">
      <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur pt-safe">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 h-16">
          <h1 className="text-2xl font-bold tracking-tight">{TITLES[tab]}</h1>
          <button onClick={() => setSettingsOpen(true)} className="size-11 grid place-items-center rounded-full bg-surface text-muted" aria-label="Einstellungen">
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-1">
        {tab === 'dashboard' && <Dashboard onTab={goTab} onAdd={openAdd} onSettings={() => setSettingsOpen(true)} />}
        {tab === 'savings' && <Savings toast={toast} />}
        {tab === 'transactions' && <Transactions onEdit={(t) => { setEditTx(t); setTxOpen(true) }} onSettings={() => setSettingsOpen(true)} />}
        {tab === 'assets' && <Assets toast={toast} />}
      </main>

      <BottomNav tab={tab} onTab={goTab} onAdd={openAdd} />
      <TransactionSheet open={txOpen} editTx={editTx} onClose={() => setTxOpen(false)} onSaved={toast} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} toast={toast} />
      <Toast message={toastMsg} onDone={clearToast} />
    </div>
  )
}
