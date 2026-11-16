import { useRef, useState } from 'react'
import { Download, Upload, Trash2, Plus, ShieldCheck } from 'lucide-react'
import { useStore, exportJSON, normalize } from '../lib/store'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategory } from '../lib/categories'
import { fmtEUR, fmtNum, parseAmount } from '../lib/format'
import { Sheet, Card, SectionTitle, Button, ConfirmButton, Field, inputCls, Segmented, AmountInput } from '../components/ui'

export default function Settings({ open, onClose, toast }) {
  const { state, dispatch } = useStore()
  const fileRef = useRef(null)
  const [edit, setEdit] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = normalize(JSON.parse(await file.text()))
      setPendingImport({ data, name: file.name })
    } catch {
      toast('Datei konnte nicht gelesen werden')
    }
  }

  const income = state.recurring.filter((r) => r.type === 'income')
  const expense = state.recurring.filter((r) => r.type === 'expense')

  return (
    <Sheet open={open} onClose={onClose} title="Einstellungen & Daten">
      <SectionTitle action={<AddBtn onClick={() => setEdit({ type: 'income' })} />}>Monatliche Einnahmen</SectionTitle>
      <RecList items={income} onEdit={setEdit} empty="z. B. Gehalt" />
      <SectionTitle action={<AddBtn onClick={() => setEdit({ type: 'expense' })} />}>Monatliche Fixkosten</SectionTitle>
      <RecList items={expense} onEdit={setEdit} empty="z. B. Miete, Strom, Handy, Netflix" />
      <p className="text-xs text-muted mt-2 px-1">Diese Posten werden jeden Monat automatisch eingerechnet. Einmalige Buchungen erfasst du über den +-Button.</p>

      <SectionTitle>Datensicherung</SectionTitle>
      <Card className="space-y-2">
        <div className="flex gap-2 text-sm text-muted mb-1">
          <ShieldCheck size={18} className="text-save shrink-0" />
          <span>Alle Daten liegen nur auf diesem Gerät. Exportiere regelmäßig ein Backup, z. B. bevor du den Browser-Speicher leerst.</span>
        </div>
        <Button variant="ghost" className="w-full flex items-center justify-center gap-2" onClick={() => { exportJSON(state); toast('Backup exportiert') }}>
          <Download size={18} /> Als JSON exportieren
        </Button>
        <Button variant="ghost" className="w-full flex items-center justify-center gap-2" onClick={() => fileRef.current?.click()}>
          <Upload size={18} /> JSON importieren
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
        {pendingImport && (
          <div className="rounded-2xl border border-line p-3 text-sm">
            <p>„{pendingImport.name}“ enthält {pendingImport.data.transactions.length} Buchungen, {pendingImport.data.pots.length} Spartöpfe und {pendingImport.data.assets.length} Bestände. Deine aktuellen Daten werden ersetzt.</p>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" className="flex-1" onClick={() => setPendingImport(null)}>Abbrechen</Button>
              <Button className="flex-1" onClick={() => { dispatch({ type: 'import', data: pendingImport.data }); setPendingImport(null); toast('Daten importiert') }}>Ersetzen</Button>
            </div>
          </div>
        )}
      </Card>

      <SectionTitle>Gefahrenzone</SectionTitle>
      <ConfirmButton className="w-full" confirmText="Nochmal tippen: alles löschen" onConfirm={() => { dispatch({ type: 'reset' }); toast('Alle Daten gelöscht') }}>
        <span className="inline-flex items-center gap-2"><Trash2 size={18} /> Alle Daten löschen</span>
      </ConfirmButton>
      <p className="text-center text-xs text-muted mt-6">Finanzen PWA · v1.0</p>

      {edit && <RecSheet item={edit} onClose={() => setEdit(null)} toast={toast} />}
    </Sheet>
  )
}

function AddBtn({ onClick }) {
  return <button onClick={onClick} className="size-9 grid place-items-center rounded-full bg-surface-2 text-save" aria-label="Hinzufügen"><Plus size={18} /></button>
}

function RecList({ items, onEdit, empty }) {
  if (!items.length) return <p className="text-sm text-muted px-1">Noch nichts angelegt ({empty}).</p>
  const total = items.reduce((s, r) => s + r.amount, 0)
  return (
    <Card className="!p-0 divide-y divide-line/60 overflow-hidden">
      {items.map((r) => {
        const c = getCategory(r.category)
        return (
          <button key={r.id} onClick={() => onEdit(r)} className="w-full flex items-center gap-3 px-4 min-h-14 text-left active:bg-surface-2">
            <span className="text-lg">{c.emoji}</span>
            <span className="flex-1 truncate">{r.name || c.label}</span>
            <span className={`tabular font-medium ${r.type === 'income' ? 'text-save' : ''}`}>{fmtEUR(r.amount)}</span>
          </button>
        )
      })}
      <div className="flex px-4 py-2.5 text-sm text-muted"><span>Summe / Monat</span><span className="ml-auto tabular text-white">{fmtEUR(total)}</span></div>
    </Card>
  )
}

function RecSheet({ item, onClose, toast }) {
  const { dispatch } = useStore()
  const isNew = !item.id
  const [type, setType] = useState(item.type)
  const [name, setName] = useState(item.name || '')
  const [amount, setAmount] = useState(item.amount ? fmtNum(item.amount) : '')
  const [category, setCategory] = useState(item.category || (item.type === 'income' ? 'gehalt' : 'fixkosten'))
  const v = parseAmount(amount)
  const valid = name.trim() && Number.isFinite(v) && v > 0
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES.filter((c) => c.id !== 'lebensmittel' && c.id !== 'freizeit')

  const save = () => {
    if (!valid) return
    const data = { type, name: name.trim(), amount: Math.round(v * 100) / 100, category }
    if (isNew) dispatch({ type: 'rec/add', item: data })
    else dispatch({ type: 'rec/update', item: { ...data, id: item.id } })
    toast('Gespeichert')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={isNew ? 'Monatlicher Posten' : 'Posten bearbeiten'}>
      <Segmented value={type} onChange={(t) => { setType(t); setCategory(t === 'income' ? 'gehalt' : 'fixkosten') }} options={[
        { value: 'expense', label: 'Fixkosten', activeCls: 'bg-spend/20 text-spend' },
        { value: 'income', label: 'Einnahme', activeCls: 'bg-save/20 text-save' },
      ]} />
      <Field label="Bezeichnung"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'income' ? 'Gehalt' : 'Miete'} maxLength={40} /></Field>
      <Field label="Betrag pro Monat"><AmountInput value={amount} onChange={setAmount} /></Field>
      <Field label="Kategorie">
        <div className="flex gap-2 flex-wrap">
          {cats.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`rounded-full px-4 min-h-10 text-sm border ${category === c.id ? 'border-white bg-surface-2' : 'border-line text-muted'}`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex gap-2 mt-6">
        {!isNew && <ConfirmButton className="flex-1" onConfirm={() => { dispatch({ type: 'rec/delete', id: item.id }); onClose() }} />}
        <Button className="flex-[2]" onClick={save} disabled={!valid}>Speichern</Button>
      </div>
    </Sheet>
  )
}
