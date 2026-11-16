/** Auswahl bekannter Werte für die Suche im Markt-Bereich (TradingView-Symbole) */
export const MARKET = [
  // Gaming
  { symbol: 'NASDAQ:TTWO', name: 'Take-Two Interactive', tags: 'gta rockstar 2k take two' },
  { symbol: 'NASDAQ:EA', name: 'Electronic Arts', tags: 'ea fifa fc sports' },
  { symbol: 'EURONEXT:UBI', name: 'Ubisoft', tags: 'assassins creed' },
  { symbol: 'NYSE:SONY', name: 'Sony', tags: 'playstation ps5' },
  { symbol: 'OTC:NTDOY', name: 'Nintendo', tags: 'switch mario' },
  { symbol: 'NYSE:RBLX', name: 'Roblox', tags: '' },
  { symbol: 'NYSE:U', name: 'Unity Software', tags: '' },
  { symbol: 'NASDAQ:TTWO', name: 'Rockstar Games (Take-Two)', tags: 'gta 6 vi' },
  // US Tech
  { symbol: 'NASDAQ:AAPL', name: 'Apple', tags: 'iphone' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft', tags: 'xbox windows' },
  { symbol: 'NASDAQ:NVDA', name: 'NVIDIA', tags: 'ki ai grafikkarte' },
  { symbol: 'NASDAQ:AMZN', name: 'Amazon', tags: '' },
  { symbol: 'NASDAQ:GOOGL', name: 'Alphabet (Google)', tags: 'google youtube' },
  { symbol: 'NASDAQ:META', name: 'Meta (Facebook)', tags: 'facebook instagram whatsapp' },
  { symbol: 'NASDAQ:TSLA', name: 'Tesla', tags: 'elon musk' },
  { symbol: 'NASDAQ:NFLX', name: 'Netflix', tags: '' },
  { symbol: 'NASDAQ:AMD', name: 'AMD', tags: 'ryzen' },
  { symbol: 'NASDAQ:INTC', name: 'Intel', tags: '' },
  { symbol: 'NYSE:PLTR', name: 'Palantir', tags: '' },
  { symbol: 'NYSE:ORCL', name: 'Oracle', tags: '' },
  { symbol: 'NASDAQ:AVGO', name: 'Broadcom', tags: '' },
  { symbol: 'NYSE:TSM', name: 'TSMC', tags: 'taiwan semiconductor' },
  { symbol: 'NASDAQ:COIN', name: 'Coinbase', tags: '' },
  { symbol: 'NYSE:SPOT', name: 'Spotify', tags: '' },
  { symbol: 'NYSE:UBER', name: 'Uber', tags: '' },
  { symbol: 'NYSE:DIS', name: 'Disney', tags: '' },
  { symbol: 'NYSE:NKE', name: 'Nike', tags: '' },
  { symbol: 'NYSE:KO', name: 'Coca-Cola', tags: 'cola' },
  { symbol: 'NASDAQ:PEP', name: 'PepsiCo', tags: 'pepsi' },
  { symbol: 'NYSE:MCD', name: "McDonald's", tags: 'mcdonalds' },
  { symbol: 'NYSE:V', name: 'Visa', tags: '' },
  { symbol: 'NYSE:JPM', name: 'JPMorgan', tags: 'bank' },
  { symbol: 'NYSE:BRK.B', name: 'Berkshire Hathaway', tags: 'buffett' },
  { symbol: 'NASDAQ:MSTR', name: 'MicroStrategy (Strategy)', tags: 'bitcoin' },
  // Deutschland / Europa
  { symbol: 'XETR:RHM', name: 'Rheinmetall', tags: 'rüstung' },
  { symbol: 'XETR:SAP', name: 'SAP', tags: '' },
  { symbol: 'XETR:SIE', name: 'Siemens', tags: '' },
  { symbol: 'XETR:ALV', name: 'Allianz', tags: 'versicherung' },
  { symbol: 'XETR:DTE', name: 'Deutsche Telekom', tags: 'telekom' },
  { symbol: 'XETR:VOW3', name: 'Volkswagen', tags: 'vw' },
  { symbol: 'XETR:BMW', name: 'BMW', tags: '' },
  { symbol: 'XETR:MBG', name: 'Mercedes-Benz', tags: 'daimler' },
  { symbol: 'XETR:P911', name: 'Porsche', tags: '' },
  { symbol: 'XETR:ADS', name: 'Adidas', tags: '' },
  { symbol: 'XETR:DBK', name: 'Deutsche Bank', tags: 'bank' },
  { symbol: 'XETR:BAS', name: 'BASF', tags: '' },
  { symbol: 'XETR:BAYN', name: 'Bayer', tags: '' },
  { symbol: 'XETR:HNR1', name: 'Hannover Rück', tags: 'hannover' },
  { symbol: 'XETR:CON', name: 'Continental', tags: 'hannover reifen' },
  { symbol: 'XETR:TUI1', name: 'TUI', tags: 'hannover reise' },
  { symbol: 'XETR:HAG', name: 'Hensoldt', tags: 'rüstung' },
  { symbol: 'XETR:RENK', name: 'Renk', tags: 'rüstung' },
  { symbol: 'XETR:AIR', name: 'Airbus', tags: '' },
  { symbol: 'EURONEXT:ASML', name: 'ASML', tags: '' },
  { symbol: 'NYSE:NVO', name: 'Novo Nordisk', tags: 'ozempic' },
  // Indizes & ETFs
  { symbol: 'XETR:DAX', name: 'DAX', tags: 'index deutschland' },
  { symbol: 'FOREXCOM:SPXUSD', name: 'S&P 500', tags: 'index usa sp500' },
  { symbol: 'FOREXCOM:NSXUSD', name: 'Nasdaq 100', tags: 'index' },
  { symbol: 'XETR:EUNL', name: 'iShares Core MSCI World ETF', tags: 'etf msci world' },
  { symbol: 'XETR:XDWD', name: 'Xtrackers MSCI World ETF', tags: 'etf msci world' },
  { symbol: 'XETR:VWCE', name: 'Vanguard FTSE All-World ETF', tags: 'etf all world' },
  { symbol: 'XETR:SXR8', name: 'iShares Core S&P 500 ETF', tags: 'etf sp500' },
  // Krypto & Rohstoffe
  { symbol: 'BITSTAMP:BTCEUR', name: 'Bitcoin (EUR)', tags: 'btc krypto crypto' },
  { symbol: 'BITSTAMP:ETHEUR', name: 'Ethereum (EUR)', tags: 'eth krypto' },
  { symbol: 'BITSTAMP:XRPEUR', name: 'XRP (EUR)', tags: 'ripple krypto' },
  { symbol: 'COINBASE:SOLEUR', name: 'Solana (EUR)', tags: 'sol krypto' },
  { symbol: 'TVC:GOLD', name: 'Gold', tags: 'rohstoff' },
  { symbol: 'TVC:SILVER', name: 'Silber', tags: 'rohstoff' },
  { symbol: 'FX:EURUSD', name: 'Euro / US-Dollar', tags: 'eur usd devisen' },
]

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function searchMarket(q) {
  const n = norm(q.trim())
  if (!n) return []
  const seen = new Set()
  return MARKET.filter((m) => {
    const hay = norm(`${m.name} ${m.symbol.split(':')[1]} ${m.tags}`)
    return n.split(/\s+/).every((w) => hay.includes(w))
  })
    .filter((m) => (seen.has(m.symbol) ? false : seen.add(m.symbol)))
    .slice(0, 8)
}

export const SUGGESTED = ['NASDAQ:TTWO', 'NASDAQ:NVDA', 'XETR:RHM', 'NASDAQ:MSFT', 'BITSTAMP:BTCEUR', 'XETR:DAX'].map((s) => MARKET.find((m) => m.symbol === s))
