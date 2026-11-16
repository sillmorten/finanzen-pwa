import { useRef, useState } from 'react'
import { Download, Upload, Trash2, ShieldCheck } from 'lucide-react'
import { useStore, exportJSON, normalize } from '../lib/store'
import { Sheet, Card, SectionTitle, Button, ConfirmButton } from '../components/ui'

export default function Settings({ open, onClose, toast }) {
  const { state, dispatch } = useStore()
  const fileRef = useRef(null)
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


  return (
    <Sheet open={open} onClose={onClose} title="Daten & Backup">
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
            <p>„{pendingImport.name}“ enthält {pendingImport.data.accounts.length} Konten, {pendingImport.data.transactions.length} Buchungen, {pendingImport.data.pots.length} Spartöpfe und {pendingImport.data.assets.length} Bestände. Deine aktuellen Daten werden ersetzt.</p>
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
      <p className="text-center text-xs text-muted mt-6">Finanzen PWA · v2.0</p>

    </Sheet>
  )
}

