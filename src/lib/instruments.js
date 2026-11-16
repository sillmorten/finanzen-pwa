/**
 * Wertpapiere mit automatischem Kurs.
 * Die Kurse holt GitHub Actions stündlich (scripts/fetch-prices.mjs) und legt sie als prices.json neben die App.
 * Weitere Papiere einfach hier ergänzen: { isin, name, symbol (Yahoo-Ticker, möglichst Xetra ".DE" = Euro) }
 */
export const ETFS = [
  { isin: 'IE00B4L5Y983', name: 'iShares Core MSCI World', symbol: 'EUNL.DE' },
  { isin: 'IE00BJ0KDQ92', name: 'Xtrackers MSCI World 1C', symbol: 'XDWD.DE' },
  { isin: 'IE00BK5BQT80', name: 'Vanguard FTSE All-World (Acc)', symbol: 'VWCE.DE' },
  { isin: 'IE00B3RBWM25', name: 'Vanguard FTSE All-World (Dist)', symbol: 'VGWL.DE' },
  { isin: 'IE00B6R52259', name: 'iShares MSCI ACWI', symbol: 'IUSQ.DE' },
  { isin: 'IE00BK5BQV03', name: 'Vanguard FTSE Developed World', symbol: 'VGVF.DE' },
  { isin: 'IE00BKM4GZ66', name: 'iShares Core MSCI EM IMI', symbol: 'IS3N.DE' },
  { isin: 'IE00BTJRMP35', name: 'Xtrackers MSCI Emerging Markets', symbol: 'XMME.DE' },
  { isin: 'IE00BF4RFH31', name: 'iShares MSCI World Small Cap', symbol: 'IUSN.DE' },
  { isin: 'IE00BYX2JD69', name: 'iShares MSCI World SRI', symbol: '2B7K.DE' },
  { isin: 'IE00B5BMR087', name: 'iShares Core S&P 500', symbol: 'SXR8.DE' },
  { isin: 'IE00BFMXXD54', name: 'Vanguard S&P 500 (Acc)', symbol: 'VUAA.DE' },
  { isin: 'IE00B53SZB19', name: 'iShares Nasdaq 100', symbol: 'SXRV.DE' },
  { isin: 'DE0005933931', name: 'iShares Core DAX', symbol: 'EXS1.DE' },
  { isin: 'IE00BYZK4552', name: 'iShares Automation & Robotics', symbol: '2B76.DE' },
  { isin: 'IE00B1XNHC34', name: 'iShares Global Clean Energy', symbol: 'IQQH.DE' },
  { isin: 'DE000A0S9GB0', name: 'Xetra-Gold', symbol: '4GLD.DE' },
  // Aktien (Xetra, Euro)
  { isin: 'US5949181045', name: 'Microsoft', symbol: 'MSF.DE', stock: true },
  { isin: 'US0378331005', name: 'Apple', symbol: 'APC.DE', stock: true },
  { isin: 'US67066G1040', name: 'NVIDIA', symbol: 'NVD.DE', stock: true },
  { isin: 'US0231351067', name: 'Amazon', symbol: 'AMZ.DE', stock: true },
  { isin: 'US02079K3059', name: 'Alphabet (Google) A', symbol: 'ABEA.DE', stock: true },
  { isin: 'US30303M1027', name: 'Meta Platforms', symbol: 'FB2A.DE', stock: true },
  { isin: 'US88160R1014', name: 'Tesla', symbol: 'TL0.DE', stock: true },
  { isin: 'NL0010273215', name: 'ASML', symbol: 'ASME.DE', stock: true },
  { isin: 'DE0007164600', name: 'SAP', symbol: 'SAP.DE', stock: true },
  { isin: 'DE0007030033', name: 'Rheinmetall', symbol: 'RHM.DE', stock: true },
]

/** Kryptowährungen (Kurse live über CoinGecko, ohne API-Key) */
export const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', id: 'ethereum' },
  { symbol: 'XRP', name: 'XRP', id: 'ripple' },
  { symbol: 'SOL', name: 'Solana', id: 'solana' },
  { symbol: 'ADA', name: 'Cardano', id: 'cardano' },
  { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin' },
  { symbol: 'DOT', name: 'Polkadot', id: 'polkadot' },
  { symbol: 'LTC', name: 'Litecoin', id: 'litecoin' },
  { symbol: 'LINK', name: 'Chainlink', id: 'chainlink' },
  { symbol: 'XLM', name: 'Stellar', id: 'stellar' },
  { symbol: 'BNB', name: 'BNB', id: 'binancecoin' },
  { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2' },
  { symbol: 'TRX', name: 'TRON', id: 'tron' },
  { symbol: 'HBAR', name: 'Hedera', id: 'hedera-hashgraph' },
  { symbol: 'USDT', name: 'Tether', id: 'tether' },
  { symbol: 'USDC', name: 'USD Coin', id: 'usd-coin' },
]
