import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetSearchResponse, AssetSearchResult } from '../market/types';
import { assetKey } from '../market/catalogue';
import { decimal, money, percent, type PortfolioView } from '../market/trading';
import { TradeTicket } from './TradeTicket';
import { AnnualReturnBadge } from './AnnualReturnBadge';
import { LiveAssetChart } from './LiveAssetChart';

type Ideas = { assets: Array<AssetSearchResult & { kaiReason: string }>; personalized: boolean; learningNote: string };
export function TradeTab() {
  const [view, setView] = useState<'market' | 'portfolio'>('market');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssetSearchResult[]>([]);
  const [ideas, setIdeas] = useState<Ideas | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioView | null>(null);
  const [selected, setSelected] = useState<AssetSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [searchError, setSearchError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cursor, setCursor] = useState(-1);
  const request = useRef(0);
  const selection = useRef(selected); selection.current = selected;
  const load = useCallback(async (withIdeas = true) => {
    const version = ++request.current;
    try {
      const response = await fetch('/api/portfolio', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (version !== request.current) return;
      setPortfolio(data.portfolio); setError('');
      if (withIdeas) {
        const suggestions = await fetch('/api/market?action=suggestions', { cache: 'no-store' });
        if (!suggestions.ok) throw new Error('No se han podido cargar las ideas de KAI.');
        const next = await suggestions.json();
        if (version === request.current) setIdeas(next);
      }
    } catch (cause) { if (version === request.current) setError(cause instanceof Error ? cause.message : 'No se ha podido cargar la cartera.'); }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => { if (!document.hidden && !selection.current) void load(); };
    const timer = window.setInterval(() => { if (!document.hidden && !selection.current) void load(false); }, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { request.current += 1; clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [load]);
  useEffect(() => {
    const controller = new AbortController();
    setResults([]); setCursor(-1); setSearchError('');
    if (!query.trim()) { setSearching(false); return () => controller.abort(); }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/market?action=search&q=' + encodeURIComponent(query.trim()), { signal: controller.signal });
        const data = await response.json() as AssetSearchResponse & { error?: string };
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) { setResults(data.results); setConfigured(data.configured); }
      } catch (cause) { if (!controller.signal.aborted) setSearchError(cause instanceof Error ? cause.message : 'No se ha podido buscar.'); }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  function choose(asset: AssetSearchResult) { request.current += 1; setSelected(asset); setNotice(''); }

  return <main className="mx-auto max-w-5xl space-y-5 px-4 pb-10 pt-6 sm:px-6">
    <div className="flex items-end justify-between gap-3"><h1 className="text-3xl font-semibold">Invertir</h1><div className="text-right"><p className="text-xs text-slate-400">Efectivo virtual · EUR</p><p className="text-xl font-semibold">{portfolio ? money(portfolio.cash) : '…'}</p></div></div>
    <div className="flex gap-2 rounded-2xl border border-white/10 bg-slate-900 p-1" aria-label="Vista de inversión">{(['market', 'portfolio'] as const).map(item => <button key={item} aria-pressed={view === item} onClick={() => setView(item)} className={`flex-1 rounded-xl p-3 text-sm font-semibold ${view === item ? 'bg-emerald-300 text-slate-950' : 'text-slate-300'}`}>{item === 'market' ? 'Buscar y descubrir' : `Mis inversiones (${portfolio?.positions.length ?? 0})`}</button>)}</div>
    <p className="text-xs leading-5 text-slate-400">Cartera de práctica con 10.000 € virtuales. Las operaciones no mueven dinero real.</p>
    {error && <p role="alert" className="rounded-xl bg-rose-300/10 p-3 text-sm text-rose-200">{error} <button onClick={() => void load()} className="underline">Reintentar</button></p>}
    {notice && <p role="status" className="text-sm text-emerald-200">{notice}</p>}
    {view === 'market' ? <>
      <div className="relative"><label htmlFor="asset-search" className="sr-only">Buscar empresa, ticker o sector</label><input id="asset-search" role="combobox" aria-autocomplete="list" aria-expanded={results.length > 0} aria-controls="asset-results" aria-activedescendant={cursor >= 0 ? `asset-result-${cursor}` : undefined} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => {
        if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setCursor(value => (value + 1) % results.length); }
        if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setCursor(value => (value - 1 + results.length) % results.length); }
        if (event.key === 'Enter' && results.length) { event.preventDefault(); choose(results[Math.max(0, cursor)]); }
        if (event.key === 'Escape') setQuery('');
      }} maxLength={50} placeholder="Empresa, $NVDA, ETF o sector: IA…" className="w-full rounded-2xl border border-white/15 bg-slate-900 px-4 py-4 text-sm outline-none focus:border-emerald-300" />
        {results.length > 0 && <div id="asset-results" role="listbox" aria-label="Activos encontrados" className="mt-2 max-h-96 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900">{results.map((asset, index) => <button key={assetKey(asset)} id={`asset-result-${index}`} role="option" aria-selected={cursor === index} onClick={() => choose(asset)} className={`block w-full border-b border-white/5 p-4 text-left hover:bg-white/5 ${cursor === index ? 'bg-white/10' : ''}`}><span className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-emerald-200">{asset.symbol}</strong><AnnualReturnBadge asset={asset} /></span><span className="mt-1 block text-sm">{asset.name}</span><span className="mt-1 block text-xs text-slate-400">{asset.exchange} · {asset.currency} · {asset.type}</span></button>)}</div>}
      </div>
      {searching && <p role="status" className="text-xs text-slate-400">Buscando…</p>}
      {searchError && <p role="alert" className="text-sm text-rose-200">{searchError}</p>}
      {!searching && query && !results.length && !searchError && <p className="text-sm text-slate-400">Sin resultados. Prueba otro nombre o símbolo.</p>}
      {configured === false && <p className="text-xs text-amber-200">Catálogo de ejemplo. Los precios de la demo son ilustrativos.</p>}
      {ideas && <section aria-labelledby="kai-ideas"><h2 id="kai-ideas" className="text-xl font-semibold">{ideas.personalized ? 'Para explorar con KAI' : 'Descubre activos'}</h2><p className="mt-2 text-xs leading-5 text-slate-400">{ideas.learningNote}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{ideas.assets.map(asset => <button key={assetKey(asset)} onClick={() => choose(asset)} className="rounded-2xl border border-white/10 bg-slate-900 p-5 text-left hover:border-emerald-300/40"><span className="flex flex-wrap justify-between gap-2"><strong className="text-emerald-200">{asset.symbol}</strong><AnnualReturnBadge asset={asset} /></span><span className="mt-2 block text-sm">{asset.name}</span><span className="mt-2 block text-xs text-slate-400">{asset.exchange} · {asset.currency}</span><span className="mt-3 block text-xs leading-5 text-cyan-200">✦ {asset.kaiReason}</span></button>)}</div></section>}
    </> : portfolio && <section className="space-y-4" aria-label="Cartera virtual">
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-slate-400">Valor de las posiciones</p><p className="mt-2 text-3xl font-semibold">{money(portfolio.currentValue)}</p></div><div className={portfolio.profitLoss >= 0 ? 'text-emerald-300' : 'text-rose-300'}><p>{money(portfolio.profitLoss)}</p><p className="text-xs">{percent(portfolio.profitLossPercent)} desde la compra</p></div></div><dl className="mt-5 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">Invertido</dt><dd>{money(portfolio.invested)}</dd></div><div><dt className="text-slate-400">Total con efectivo</dt><dd>{money(portfolio.totalEquity)}</dd></div></dl><button onClick={() => void load(false)} className="mt-4 text-xs text-emerald-200">Actualizar valoración</button></div>
      {portfolio.stale && <p role="status" className="text-xs text-amber-200">No se han podido actualizar todas las posiciones. Se conservan los últimos valores disponibles.</p>}
      {!portfolio.positions.length && <p className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">Todavía no tienes inversiones virtuales.</p>}
      {portfolio.positions.map(position => <article key={position.id} className="rounded-2xl border border-white/10 bg-slate-900 p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{position.asset.symbol}</h3><p className="mt-1 text-xs text-slate-400">{position.asset.name} · {position.asset.exchange}</p></div><div className="text-right"><p>{money(position.currentValueEur)}</p><p className={`text-xs ${position.profitLossEur >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{money(position.profitLossEur)} · {percent(position.profitLossPercent)}</p></div></div><p className="mt-3 text-xs text-slate-300">{decimal(position.units)} unidades · Invertido: {money(position.investedEur)} · Precio medio: {money(position.averageBuyPrice, position.asset.currency)}</p><LiveAssetChart asset={position.asset} initialQuote={{ ...position.asset, price: position.price, asOf: position.asOf, source: position.source }} /><p className="mt-2 text-xs text-slate-500">{position.source === 'illustrative' ? 'Valoración ilustrativa' : 'Twelve Data'}{position.stale ? ' · Sin actualizar' : ''} · {new Date(position.asOf).toLocaleString('es-ES')}</p><button onClick={() => choose(position.asset)} className="mt-4 text-xs text-emerald-200">Revisar y ampliar posición</button></article>)}
    </section>}
    {selected && <TradeTicket key={assetKey(selected)} asset={selected} onClose={() => setSelected(null)} onBought={next => { request.current += 1; setPortfolio(next); setView('portfolio'); setNotice('Compra virtual registrada.'); }} />}
  </main>;
}
