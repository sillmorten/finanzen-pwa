import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { StoreProvider } from './lib/store'
import { registerSW } from 'virtual:pwa-register'

// Neue App-Versionen automatisch laden: beim Öffnen, beim Zurückkehren in die App und alle 30 Minuten prüfen.
// Die Daten liegen im Gerätespeicher, ein Neuladen verliert also nichts.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}) }
    setInterval(check, 30 * 60 * 1000)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
