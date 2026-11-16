# 💶 Finanzen – persönliche Spar- & Finanz-PWA

Mobile-first Progressive Web App für das persönliche Finanz- und Sparmanagement.
Dunkles Design, große Buttons für die Einhand-Bedienung, installierbar auf dem Handy (z. B. Pixel / Android).

**Alle Daten bleiben lokal auf deinem Gerät** (Browser-Speicher). Es gibt keinen Server, kein Konto und kein Tracking.

👉 Live: https://sillmorten.github.io/finanzen-pwa/

## Funktionen

| Bereich | Inhalt |
|---|---|
| **Konten** | Deine Konten als wischbare Bankkarten mit eigenem Namen, Kontoart, Kartendesign und optional den letzten 4 Ziffern. Karte antippen öffnet alle Buchungen der Karte (Monatsfilter, Eingänge/Ausgänge). Optionales monatliches Ausgabenlimit pro Karte mit Warnung. Ein- und Auszahlungen pro Konto, Kontostand jederzeit korrigierbar, Gesamtvermögen oben, Beträge per 👁 ausblendbar |
| **Sparen** | Spartöpfe mit Zielbetrag & Deadline (inkl. „x € / Monat bis …“), Schnell-Buttons +10 / +25 / +50 / +100 € |
| **Spaß am Sparen** | Spar-Level (🌱 bis 👑), wöchentliche Spar-Serie 🔥, Abzeichen für Meilensteine, Konfetti bei Einzahlungen, Level-Ups und erreichten Zielen |
| **Depot** | Konten der Art *Depot* (z. B. Trade Republic) oder *Krypto-Wallet* (z. B. Ledger) mit Positionen. ETFs aus einer Liste (MSCI World, All-World, S&P 500 …) und Kryptowährungen bekommen ihren Kurs automatisch, der Wert landet direkt auf der Karte. Optional Kaufwert für Gewinn/Verlust |
| **Backup** | JSON-Export / -Import, alles löschen |

## Auf dem Handy installieren

1. Die Live-URL in Chrome auf dem Handy öffnen.
2. Menü (⋮) → **„App installieren“** bzw. „Zum Startbildschirm hinzufügen“.
3. Die App startet danach im Vollbild und funktioniert auch offline.

> **Backup:** Da die Daten nur im Browser liegen, regelmäßig unter *Backup → Als JSON exportieren* sichern. Beim Löschen der Browserdaten oder Deinstallieren der App gehen sie sonst verloren.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver auf http://localhost:5173
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
```

## Tech-Stack

- [React 19](https://react.dev) + [Vite](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Lucide](https://lucide.dev) für Icons
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (Manifest + Service Worker, offlinefähig)
- Speicherung: `localStorage` (Schlüssel `finanzen-pwa:v1`)

## Projektstruktur

```
src/
  App.jsx                 Layout, Tabs, Header
  components/
    BankCard.jsx          Bankkarten-Darstellung
    AccountSheet.jsx      Konto anlegen / bearbeiten / Kontostand korrigieren
    TransactionSheet.jsx  Ein- / Auszahlung erfassen
    SaveLevel.jsx         Spar-Level & Serie
    BottomNav.jsx         Untere Navigation mit +-Button
    ui.jsx                Basis-Komponenten (Card, Sheet, Button …)
  views/
    Accounts.jsx          Konten mit Karten-Karussell
    Savings.jsx           Spartöpfe & Abzeichen
    Assets.jsx            Krypto & sonstige Werte
    Settings.jsx          Backup: Export / Import
  lib/
    store.jsx             Zustand, Persistenz, Import-Validierung, Migration
    finance.js            Kontostände & Summen
    gamify.js             Level, Serien, Abzeichen
    confetti.js           Konfetti-Effekt
    categories.js         Kontoarten, Kartendesigns, Coin-IDs
    format.js             Euro-/Datumsformatierung, Betragseingabe
.github/workflows/deploy.yml   Automatisches Deployment auf GitHub Pages
```

## Automatische Kurse

- **ETFs:** `scripts/fetch-prices.mjs` holt beim Build die Xetra-Kurse (Euro) aller Papiere aus `src/lib/instruments.js` und legt sie als `prices.json` neben die App. Der Workflow läuft Mo–Fr stündlich, am Wochenende alle 4 Stunden.
- **Krypto:** live von CoinGecko im Browser, ohne API-Key (Fallback: `prices.json`).
- Die App aktualisiert beim Öffnen, alle 10 Minuten und beim Zurückkehren.
- Neues Papier? In `src/lib/instruments.js` mit ISIN und Yahoo-Ticker ergänzen.

## Deployment

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Actions auf GitHub Pages.
Einmalig nötig: im Repository unter **Settings → Pages → Source** „**GitHub Actions**“ auswählen.

Alternativ funktioniert auch Vercel / Netlify ohne Konfiguration (Build-Befehl `npm run build`, Ausgabeordner `dist`).
