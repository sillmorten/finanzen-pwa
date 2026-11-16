import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`rounded-3xl bg-surface border border-line/60 p-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-2 px-1">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {action}
    </div>
  )
}

export function Progress({ value, color = 'var(--color-save)', className = 'h-2.5' }) {
  const pct = Math.max(0, Math.min(100, value || 0))
  return (
    <div className={`w-full rounded-full bg-surface-2 overflow-hidden ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function Button({ variant = 'primary', className = '', children, ...rest }) {
  const styles = {
    primary: 'bg-save text-bg font-semibold active:bg-save-strong',
    danger: 'bg-spend/15 text-spend font-semibold active:bg-spend/25',
    ghost: 'bg-surface-2 text-white/90 active:bg-line',
    outline: 'border border-line text-white/90 active:bg-surface-2',
  }
  return (
    <button className={`min-h-12 rounded-2xl px-4 text-base transition-colors disabled:opacity-40 ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

/** Bottom-Sheet für Formulare – gut mit dem Daumen erreichbar */
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 animate-fade" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-surface border-t border-line animate-sheet pb-safe">
        <div className="sticky top-0 z-10 bg-surface px-5 pt-3 pb-2">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="grid place-items-center size-10 rounded-full bg-surface-2" aria-label="Schließen">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block mt-4">
      <span className="block text-sm text-muted mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full min-h-12 rounded-2xl bg-surface-2 border border-line px-4 text-base text-white placeholder:text-muted/70 outline-none focus:border-save'

export function AmountInput({ value, onChange, autoFocus, color = 'text-white', ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 250)
  }, [autoFocus])
  return (
    <div className="relative">
      <input
        ref={ref}
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        className={`${inputCls} text-3xl font-semibold h-16 pr-12 tabular ${color}`}
        {...rest}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-muted">€</span>
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="grid gap-1 p-1 rounded-2xl bg-surface-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-11 rounded-xl text-sm font-medium transition-colors ${value === o.value ? o.activeCls || 'bg-surface text-white' : 'text-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Löschen mit zweitem Tippen statt Browser-Dialog */
export function ConfirmButton({ onConfirm, children = 'Löschen', confirmText = 'Wirklich löschen?', className = '' }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <Button variant="danger" className={className} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirmText : children}
    </Button>
  )
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="text-center py-10 px-6">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-semibold">{title}</p>
      {text && <p className="text-sm text-muted mt-1">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [message, onDone])
  if (!message) return null
  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-[calc(env(safe-area-inset-top)+1rem)] z-[60] whitespace-nowrap rounded-full bg-white text-bg px-5 py-3 text-sm font-medium shadow-lg animate-fade">
      {message}
    </div>
  )
}
