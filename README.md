# 💶 Finanzen – persönliche Spar- & Finanz-PWA

Mobile-first Progressive Web App für das persönliche Finanz- und Sparmanagement.
Dunkles Design, große Buttons für die Einhand-Bedienung, installierbar auf dem Handy (z. B. Pixel / Android).

**Alle Daten bleiben lokal auf deinem Gerät** (Browser-Speicher). Es gibt keinen Server, kein Konto und kein Tracking.

👉 Live: https://sillmorten.github.io/finanzen-pwa/

## Funktionen

| Bereich | Inhalt |
|---|---|
| **Übersicht** | Verfügbare Sparrate des Monats, Sparquote, Einnahmen / Fixkosten / variable Ausgaben, Sparziel-Fortschritt, Ausgaben-Donut nach Kategorie, 6-Monats-Verlauf, Gesamtvermögen |
| **Sparen** | Spartöpfe mit Zielbetrag & Deadline (inkl. „x € / Monat bis …“), Schnell-Buttons +10 / +25 / +50 / +100 €, Ein- und Auszahlungen mit Verlauf und Rückgängig |
| **Buchungen** | Schnelleingabe über den grünen +-Button, Kategorien (Lebensmittel, Freizeit, Fixkosten, Abo, Sonstiges), Monatsfilter, Kategoriefilter, Vergleich zum Vormonat |
| **Vermögen** | Manuelle Erfassung von Krypto (BTC, XRP, …) und sonstigen Werten; optional Kursabruf über CoinGecko ohne API-Key |
| **Einstellungen** (Zahnrad) | Monatliche Einnahmen (Gehalt) & Fixkosten (Miete, Abos …), JSON-Export / -Import, alles löschen |

## Auf dem Handy installieren

1. Die Live-URL in Chrome auf dem Handy öffnen.
2. Menü (⋮) → **„App installieren“** bzw. „Zum Startbildschirm hinzufügen“.
3. Die App startet danach im Vollbild und funktioniert auch offline.

> **Backup:** Da die Daten nur im Browser liegen, regelmäßig unter *Einstellungen → Als JSON exportieren* sichern. Beim Löschen der Browserdaten oder Deinstallieren der App gehen sie sonst verloren.

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
- [Recharts](https://recharts.org) für Diagramme, [Lucide](https://lucide.dev) für Icons
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (Manifest + Service Worker, offlinefähig)
- Speicherung: `localStorage` (Schlüssel `finanzen-pwa:v1`)

## Projektstruktur

```
src/
  App.jsx                 Layout, Tabs, Header
  components/
    BottomNav.jsx         Untere Navigation mit +-Button
    TransactionSheet.jsx  Schnelleingabe / Bearbeiten von Buchungen
    ui.jsx                Basis-Komponenten (Card, Sheet, Button, Progress …)
  views/
    Dashboard.jsx         Übersicht
    Savings.jsx           Spartöpfe
    Transactions.jsx      Buchungen & Monatsvergleich
    Assets.jsx            Krypto & Vermögen
    Settings.jsx          Fixposten, Export / Import
  lib/
    store.jsx             Zustand, Persistenz, Import-Validierung, Export
    finance.js            Berechnungen (Monatswerte, Salden)
    categories.js         Kategorien, Farben, Coin-IDs
    format.js             Euro-/Datumsformatierung, Betragseingabe
.github/workflows/deploy.yml   Automatisches Deployment auf GitHub Pages
```

## Deployment

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Actions auf GitHub Pages.
Einmalig nötig: im Repository unter **Settings → Pages → Source** „**GitHub Actions**“ auswählen.

Alternativ funktioniert auch Vercel / Netlify ohne Konfiguration (Build-Befehl `npm run build`, Ausgabeordner `dist`).
