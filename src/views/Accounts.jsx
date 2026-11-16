import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Pencil, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../lib/store'
import { accountPerformance, accountBalance, visibleAssetsTotal, visibleNetWorth, lockedCount, monthFlow, limitUsage } from '../lib/finance'
import { useLock } from '../lib/lock'
import { Lock, Unlock } from 'lucide-react'
import { fmtEUR, fmtEUR0, monthKey, monthLabel } from '../lib/format'
import TxList, { sortTx } from '../components/TxList'
import LimitBar from '../components/LimitBar'
import CardDetail from './CardDetail'
import ReorderSheet from '../components/ReorderSheet'
import { ArrowUpDown } from 'lucide-react'
import { Card, SectionTitle, Button } from '../components/ui'
import BankCard, { AddCard } from '../components/BankCard'
import AccountSheet from '../components/AccountSheet'
import SaveLevel from '../components/SaveLevel'

export default function Accounts({ selectedId, onSelect, onBook, onEditTx, onTab, toast, detail, setDetail, newAccount, setNewAccount }) {
  const { state } = useStore()
  const [editState, setEdit] = useState(null) // account | 'new'
  const edit = newAccount ? 'new' : editState
  const closeEdit = () => { setEdit(null); setNewAccount(false) }
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem('finanzen-pwa:hide') === '1' } catch { return false } })
  const scroller = useRef(null)

  const accounts = state.accounts
  const selected = accounts.find((a) => a.id === selectedId) || accounts[0]
  const key = monthKey()
  const flow = selected ? monthFlow(state, selected.id, key) : null

  const toggleHidden = () => {
    setHidden((h) => { try { localStorage.setItem('finanzen-pwa:hide', h ? '0' : '1') } catch {} return !h })
  }

  // Auswahl beim Wischen erkennen (Karte, die der Mitte am nächsten ist)
  const nearestIndex = () => {
    const el = scroller.current
    if (!el) return 0
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0, dist = Infinity
    ;[...el.children].forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid)
      if (d < dist) { dist = d; best = i }
    })
    return best
  }
  const onScroll = () => {
    const idx = nearestIndex()
    const acc = accounts[idx]
    if (acc && acc.id !== selected?.id) onSelect(acc.id)
  }
  // Ausgewählte Karte in die Mitte scrollen (z. B. nach Neuanlage)
  useEffect(() => {
    const el = scroller.current
    if (!el || !selected) return
    const idx = accounts.findIndex((a) => a.id === selected.id)
    const c = el.children[idx]
    if (!c) return
    const left = c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2
    if (Math.abs(el.scrollLeft - left) > 4) el.scrollTo({ left, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, accounts.length])

  const txs = useMemo(() => {
    if (!selected) return []
    return state.transactions.filter((t) => t.accountId === selected.id).sort(sortTx)
  }, [state.transactions, selected])
  const usage = selected ? limitUsage(state, selected, key) : null

  const { toggleLock } = useLock()
  const [reorder, setReorder] = useState(false)
  const locked = !!selected?.locked
  const money = (v, f = fmtEUR) => (hidden ? '•••••' : f(v))
  const smoney = (v, f = fmtEUR) => (hidden || locked ? '•••••' : f(v))

  return (
    <div>
      {/* Gesamtvermögen */}
      <div className="flex items-end justify-between px-1">
        <div>
          <div className="text-sm text-muted">Gesamtvermögen</div>
          <div className="text-[34px] leading-tight font-bold tabular">{money(visibleNetWorth(state))}</div>
        </div>
        <button onClick={toggleHidden} className="size-11 grid place-items-center rounded-full bg-surface text-muted mb-1" aria-label={hidden ? 'Beträge zeigen' : 'Beträge verbergen'}>
          {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <div className="text-xs text-muted px-1 mt-0.5">
        {state.accounts.length} {state.accounts.length === 1 ? 'Konto' : 'Konten'}{visibleAssetsTotal(state) > 0 && <> · davon investiert {money(visibleAssetsTotal(state), fmtEUR0)}</>}
        {lockedCount(state) > 0 && <> · 🔒 {lockedCount(state)} gesperrt (nicht eingerechnet)</>}
      </div>

      {/* Karten-Karussell */}
      <div
        ref={scroller}
        onScroll={onScroll}
        className="relative flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-[8%] mt-4 pb-3 pt-1"
      >
        {accounts.map((a) => (
          <div key={a.id} className={`snap-center shrink-0 w-[84%] transition-transform duration-300 ${a.id === selected?.id ? 'scale-100' : 'scale-[0.94] opacity-70'}`}>
            <BankCard account={a} balance={accountBalance(state, a)} perf={accountPerformance(state, a.id)} hidden={hidden} onClick={() => { onSelect(a.id); setDetail(true) }} className="cursor-pointer active:scale-[0.98] transition-transform" />
          </div>
        ))}
        <div className="snap-center shrink-0 w-[84%]">
          <AddCard onClick={() => setEdit('new')} />
        </div>
      </div>

      {/* Punkte-Indikator + Reihenfolge */}
      {accounts.length > 1 && (
        <div className="relative flex justify-center items-center gap-1.5 mt-1 h-9">
          {accounts.map((a) => (
            <span key={a.id} className={`h-1.5 rounded-full transition-all ${a.id === selected?.id ? 'w-5 bg-white' : 'w-1.5 bg-line'}`} />
          ))}
          <button onClick={() => setReorder(true)} className="absolute right-0 flex items-center gap-1 text-xs text-muted min-h-9 px-2 rounded-full active:bg-surface" aria-label="Reihenfolge ändern">
            <ArrowUpDown size={14} /> Reihenfolge
          </button>
        </div>
      )}

      {!selected ? (
        <p className="text-sm text-muted text-center mt-3 px-6">Tippe auf die Karte oben, gib deinem Konto einen Namen, wähle ein Design und trag den aktuellen Kontostand ein.</p>
      ) : (
        <>
          {/* Aktionen */}
          {locked ? (
            <Card className="mt-4 text-center">
              <div className="size-12 rounded-full bg-surface-2 grid place-items-center mx-auto"><Lock size={22} /></div>
              <p className="font-semibold mt-2">{selected.name} ist gesperrt</p>
              <p className="text-sm text-muted mt-1">Beträge und Buchungen sind ausgeblendet.</p>
              <Button className="w-full mt-4 flex items-center justify-center gap-2" onClick={() => toggleLock(selected)}><Unlock size={18} /> Entsperren</Button>
            </Card>
          ) : (
          <>
          <div className="grid grid-cols-4 gap-2 mt-4">
            <Action icon={<ArrowDownLeft size={22} />} label="Einzahlen" cls="text-save" onClick={() => onBook('income')} />
            <Action icon={<ArrowUpRight size={22} />} label="Auszahlen" cls="text-spend" onClick={() => onBook('expense')} />
            <Action icon={<Pencil size={20} />} label="Bearbeiten" cls="text-white/85" onClick={() => setEdit(selected)} />
            <Action icon={<Lock size={20} />} label="Sperren" cls="text-amber-300" onClick={() => toggleLock(selected)} />
          </div>

          {/* Monat */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Card className="!p-3">
              <div className="text-xs text-muted">Eingänge {monthLabel(key, true)}</div>
              <div className="text-lg font-semibold text-save tabular">+{money(flow.income, fmtEUR0)}</div>
            </Card>
            <Card className="!p-3">
              <div className="text-xs text-muted">Ausgänge {monthLabel(key, true)}</div>
              <div className="text-lg font-semibold text-spend tabular">−{money(flow.expense, fmtEUR0)}</div>
            </Card>
          </div>
          {usage && <div className="mt-2"><LimitBar usage={usage} hidden={hidden} onClick={() => setDetail(true)} /></div>}
          <p className="text-xs text-muted text-center mt-3">Tipp: Karte antippen für alle Buchungen</p>
          </>
          )}
        </>
      )}

      {/* Spar-Level */}
      <SectionTitle action={<button onClick={() => onTab('savings')} className="text-sm text-save min-h-9 px-1">Sparziele →</button>}>Dein Spar-Level</SectionTitle>
      <SaveLevel compact onClick={() => onTab('savings')} />

      {/* Letzte Bewegungen */}
      {selected && !locked && (
        <>
          <SectionTitle action={txs.length > 0 && <button onClick={() => setDetail(true)} className="text-sm text-save min-h-9 px-1">Alle →</button>}>Letzte Buchungen</SectionTitle>
          {txs.length === 0 ? (
            <Card><p className="text-sm text-muted text-center py-4">Noch keine Buchungen. Tippe auf Einzahlung oder Auszahlung.</p></Card>
          ) : (
            <>
              <TxList txs={txs.slice(0, 5)} onEdit={onEditTx} hidden={hidden} />
              {txs.length > 5 && <Button variant="ghost" className="w-full text-sm" onClick={() => setDetail(true)}>Alle {txs.length} Buchungen ansehen</Button>}
            </>
          )}
        </>
      )}

      {detail && selected && (
        <CardDetail account={selected} hidden={hidden} onClose={() => setDetail(false)} onBook={onBook} onEditTx={onEditTx} onEditAccount={() => setEdit(selected)} toast={toast} />
      )}
      {reorder && <ReorderSheet onClose={() => setReorder(false)} onFirst={(id) => id && onSelect(id)} />}
      {edit && <AccountSheet account={edit === 'new' ? null : edit} onClose={closeEdit} onCreated={onSelect} toast={toast} />}
    </div>
  )
}

function Action({ icon, label, cls, onClick }) {
  return (
    <button onClick={onClick} className="min-h-20 rounded-2xl bg-surface border border-line/60 flex flex-col items-center justify-center gap-1.5 active:bg-surface-2">
      <span className={cls}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
