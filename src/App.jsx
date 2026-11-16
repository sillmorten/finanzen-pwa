import { useCallback, useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import BottomNav from './components/BottomNav'
import TransactionSheet from './components/TransactionSheet'
import { Toast } from './components/ui'
import { useStore } from './lib/store'
import Accounts from './views/Accounts'
import Savings from './views/Savings'
import Depot from './views/Depot'
import { usePriceUpdater } from './lib/prices'
import Settings from './views/Settings'
import AddLink from './components/AddLink'
import { LockProvider } from './lib/lock'

const TITLES = { accounts: 'Meine Konten', savings: 'Sparen', depot: 'Depot & Krypto' }
const getHashTab = () => {
  const h = location.hash.replace('#', '')
  return TITLES[h] ? h : 'accounts'
}
const SEL_KEY = 'finanzen-pwa:selected'

export default function App() {
  const { state } = useStore()
  const [tab, setTab] = useState(getHashTab)
  const [tx, setTx] = useState(null) // { editTx?, defaults? }
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [selectedId, setSelectedId] = useState(() => { try { return localStorage.getItem(SEL_KEY) } catch { return null } })
  const [detail, setDetail] = useState(false)
  const [newAccount, setNewAccount] = useState(false)
  const prices = usePriceUpdater()
  const toast = useCallback((m) => setToastMsg(m), [])
  const clearToast = useCallback(() => setToastMsg(''), [])

  const selected = state.accounts.find((a) => a.id === selectedId) || state.accounts[0]
  const select = useCallback((id) => {
    setSelectedId(id)
    try { localStorage.setItem(SEL_KEY, id) } catch {}
  }, [])

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
  const book = (type) => setTx({ defaults: { type, accountId: selected?.id } })

  return (
    <LockProvider toast={toast}>
    <div className="min-h-dvh pb-32">
      <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur pt-safe">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 h-16">
          <h1 className="text-2xl font-bold tracking-tight">{TITLES[tab]}</h1>
          <button onClick={() => setSettingsOpen(true)} className="h-11 px-3.5 flex items-center gap-1.5 rounded-full bg-surface text-muted text-sm" aria-label="Daten & Backup">
            <Shield size={18} /> Backup
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-1">
        {tab === 'accounts' && (
          <Accounts selectedId={selected?.id} onSelect={select} onBook={book} onEditTx={(t) => setTx({ editTx: t })} onTab={goTab} toast={toast} detail={detail} setDetail={setDetail} newAccount={newAccount} setNewAccount={setNewAccount} />
        )}
        {tab === 'savings' && <Savings toast={toast} />}
        {tab === 'depot' && (
          <Depot toast={toast} prices={prices} onNewAccount={() => { goTab('accounts'); setNewAccount(true) }} onOpenAccount={(id) => { select(id); goTab('accounts'); setDetail(true) }} />
        )}
      </main>

      <BottomNav tab={tab} onTab={goTab} onAdd={() => book('expense')} />
      <TransactionSheet open={!!tx} editTx={tx?.editTx} defaults={tx?.defaults} onClose={() => setTx(null)} onSaved={toast} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} toast={toast} />
      <AddLink toast={toast} onDone={() => { setTab('accounts'); setTimeout(() => prices.refresh({ force: true }), 50) }} />
      <Toast message={toastMsg} onDone={clearToast} />
    </div>
    </LockProvider>
  )
}
