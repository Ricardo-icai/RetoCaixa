import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { KaiHeaderIcon } from '../components/KaiHeaderIcon';
import type { AssetQuote, AssetSearchResponse, AssetSearchResult } from '../market/types';

type Holding = { symbol: string; currency: string; amount: number; units: number };
const money = (value: number, currency = 'EUR') => new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 2 }).format(value);
const formatNumber = (value?: number) => value === undefined ? '—' : new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 }).format(value);

function riskFor(type: string) {
  const value = type.toLowerCase();
  if (value.includes('digital') || value.includes('crypto')) return 'Alta volatilidad y riesgo tecnológico y de custodia.';
  if (value.includes('etf') || value.includes('fund')) return 'Revisa composición, diversificación, divisa, réplica y comisiones en su folleto.';
  if (value.includes('currency') || value.includes('forex')) return 'El precio depende de dos divisas. Esta simulación no utiliza apalancamiento.';
  if (value.includes('bond')) return 'Puede perder valor si suben los tipos o empeora la solvencia del emisor.';
  if (value.includes('metal') || value.includes('commodity')) return 'Puede sufrir movimientos bruscos y no genera ingresos periódicos.';
  return 'Existe riesgo de pérdida y de concentración en una sola empresa.';
}

export default function Simulator() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssetSearchResult[]>([]);
  const [selected, setSelected] = useState<AssetSearchResult | null>(null);
  const [quote, setQuote] = useState<AssetQuote | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [amount, setAmount] = useState('100');
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cash, setCash] = useState(10000);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const numericAmount = Number(amount);
  const units = quote && Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount / quote.price : 0;
  const canBuy = !!quote && reviewed && numericAmount > 0 && numericAmount <= cash && !busy;

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true); setError(''); setNotice(''); setSelected(null); setQuote(null); setReviewed(false);
    try {
      const response = await fetch('/api/market?action=search&q=' + encodeURIComponent(query.trim()));
      const data = await response.json() as AssetSearchResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido buscar el activo.');
      setResults(data.results); setConfigured(data.configured);
      if (!data.results.length) setError('No se han encontrado activos. Prueba con el nombre o ticker.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se ha podido buscar el activo.'); }
    finally { setBusy(false); }
  }

  async function loadQuote(asset: AssetSearchResult, details = true, background = false) {
    if (!background) { setBusy(true); setError(''); setNotice(''); setSelected(asset); setQuote(null); setReviewed(false); }
    try {
      const parameters = new URLSearchParams({ action: 'quote', symbol: asset.symbol, name: asset.name, exchange: asset.exchange, currency: asset.currency, type: asset.type, details: String(details) });
      if (asset.country) parameters.set('country', asset.country);
      if (asset.micCode) parameters.set('micCode', asset.micCode);
      const response = await fetch('/api/market?' + parameters.toString());
      const data = await response.json() as AssetQuote & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido cargar la cotización.');
      setQuote(data); setConfigured(data.source === 'twelve-data');
    } catch (cause) { if (!background) setError(cause instanceof Error ? cause.message : 'No se ha podido cargar la cotización.'); }
    finally { if (!background) setBusy(false); }
  }

  useEffect(() => {
    if (!selected || !quote || quote.source !== 'twelve-data') return;
    const timer = window.setInterval(() => { void loadQuote(selected, false, true); }, 15000);
    return () => window.clearInterval(timer);
  }, [selected, quote?.source]);

  function buy() {
    if (!quote || !canBuy) return;
    const message = 'Simular compra de ' + formatNumber(units) + ' unidades de ' + quote.symbol + ' por ' + money(numericAmount, quote.currency) + '. No se moverá dinero real.';
    if (!window.confirm(message)) return;
    setCash(value => Math.round((value - numericAmount) * 100) / 100);
    setHoldings(current => [...current, { symbol: quote.symbol, currency: quote.currency, amount: numericAmount, units }]);
    setNotice('Compra simulada de ' + quote.symbol + ' registrada.');
    setReviewed(false);
  }

  const dayPosition = useMemo(() => quote?.low !== undefined && quote.high !== undefined && quote.high > quote.low ? Math.min(100, Math.max(0, ((quote.price - quote.low) / (quote.high - quote.low)) * 100)) : null, [quote]);

  return <div className="min-h-screen bg-slate-950 pb-12 text-slate-100">
    <Head><title>Invertir · KAI</title><meta name="description" content="Busca activos, revisa su información clave y simula una compra." /></Head>
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur-md"><KaiHeaderIcon /></header>
    <main className="mx-auto max-w-5xl space-y-6 px-4 pt-6 sm:px-6">
      <section className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold">Invertir</h1><p className="mt-2 text-sm text-slate-400">Busca el activo y revisa sus datos antes de simular la compra.</p></div><div className="text-right"><p className="text-xs text-slate-400">Efectivo virtual</p><p className="text-2xl font-semibold">{money(cash)}</p></div></section>
      <form onSubmit={search} className="flex gap-2 rounded-2xl border border-white/10 bg-slate-900 p-2"><label htmlFor="asset-search" className="sr-only">Buscar activo</label><input id="asset-search" value={query} onChange={event => setQuery(event.target.value)} maxLength={50} placeholder="Empresa, ETF, cripto o ticker…" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-500" /><button disabled={busy || !query.trim()} className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">{busy ? 'Buscando…' : 'Buscar'}</button></form>
      {configured === false && <p className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100">Datos ilustrativos. Configura TWELVE_DATA_API_KEY para búsqueda y cotizaciones actuales.</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-200">{notice}</p>}

      {results.length > 0 && !selected && <section aria-labelledby="results-title"><h2 id="results-title" className="mb-3 text-sm font-semibold">Resultados</h2><div className="grid gap-3 sm:grid-cols-2">{results.map(asset => <button type="button" key={asset.symbol + '-' + asset.exchange} onClick={() => void loadQuote(asset)} className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-left hover:border-emerald-300/40"><span className="flex items-start justify-between gap-3"><span><strong className="block text-emerald-200">{asset.symbol}</strong><span className="mt-1 block text-sm text-slate-200">{asset.name}</span></span><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400">{asset.type}</span></span><span className="mt-3 block text-xs text-slate-500">{asset.exchange} · {asset.currency}</span></button>)}</div></section>}
      {selected && <button type="button" onClick={() => { setSelected(null); setQuote(null); setReviewed(false); }} className="text-sm text-emerald-200">← Volver a resultados</button>}
      {selected && busy && !quote && <p className="text-sm text-slate-400">Cargando información…</p>}

      {quote && <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
        <div className="border-b border-white/10 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-emerald-200">{quote.symbol}</p><h2 className="mt-1 text-2xl font-semibold">{quote.name}</h2><p className="mt-2 text-xs text-slate-400">{quote.type} · {quote.exchange} · {quote.currency}</p></div><div className="text-right"><p className="text-3xl font-semibold">{money(quote.price, quote.currency)}</p><p className={'mt-1 text-sm ' + ((quote.percentChange ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{quote.percentChange === undefined ? 'Cambio no disponible' : (quote.percentChange >= 0 ? '+' : '') + formatNumber(quote.percentChange) + ' %'}</p></div></div></div>
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Apertura', quote.open === undefined ? '—' : money(quote.open, quote.currency)], ['Máximo', quote.high === undefined ? '—' : money(quote.high, quote.currency)], ['Mínimo', quote.low === undefined ? '—' : money(quote.low, quote.currency)], ['Volumen', formatNumber(quote.volume)]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/[0.035] p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</div>
            {dayPosition !== null && <div><div className="mb-2 flex justify-between text-xs text-slate-400"><span>{money(quote.low!, quote.currency)}</span><span>Rango de hoy</span><span>{money(quote.high!, quote.currency)}</span></div><div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: String(dayPosition) + '%' }} /></div></div>}
            <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Rango de 52 semanas</dt><dd className="mt-1">{quote.fiftyTwoWeekLow === undefined || quote.fiftyTwoWeekHigh === undefined ? 'No disponible' : money(quote.fiftyTwoWeekLow, quote.currency) + ' – ' + money(quote.fiftyTwoWeekHigh, quote.currency)}</dd></div><div><dt className="text-xs text-slate-500">Mercado</dt><dd className="mt-1">{quote.marketOpen === undefined ? 'Estado no disponible' : quote.marketOpen ? 'Abierto' : 'Cerrado'}</dd></div><div><dt className="text-xs text-slate-500">Última actualización</dt><dd className="mt-1">{new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(quote.asOf))}</dd></div><div><dt className="text-xs text-slate-500">Fuente</dt><dd className="mt-1">{quote.source === 'twelve-data' ? 'Twelve Data' : 'Datos ilustrativos'}</dd></div></dl>
            {(quote.sector || quote.industry) && <p className="text-sm text-slate-300">{[quote.sector, quote.industry].filter(Boolean).join(' · ')}</p>}
            {quote.description && <p className="text-sm leading-6 text-slate-300">{quote.description}</p>}
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"><h3 className="text-sm font-semibold text-amber-100">Riesgos clave</h3><p className="mt-2 text-xs leading-5 text-amber-100/80">{riskFor(quote.type)} Puedes perder parte o todo el capital invertido.</p></div>
          </div>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-5"><h3 className="text-lg font-semibold">Simular compra</h3><label className="mt-4 block text-xs text-slate-300">Importe<input type="number" min="1" max={cash} step="0.01" value={amount} onChange={event => { setAmount(event.target.value); setReviewed(false); }} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-lg" /></label><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-400">Precio mostrado</dt><dd>{money(quote.price, quote.currency)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-400">Unidades estimadas</dt><dd>{formatNumber(units)}</dd></div></dl><p className="mt-4 text-xs leading-5 text-slate-400">El precio puede cambiar. No incluye impuestos, cambio de divisa ni comisiones.</p><label className="mt-4 flex gap-3 text-xs leading-5 text-slate-300"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} className="mt-1 accent-emerald-300" />He revisado el activo, el precio, la divisa y sus riesgos.</label>{numericAmount > cash && <p className="mt-3 text-xs text-rose-200">El importe supera tu efectivo virtual.</p>}<button type="button" disabled={!canBuy} onClick={buy} className="mt-5 w-full rounded-xl bg-emerald-300 p-4 text-sm font-semibold text-slate-950 disabled:opacity-35">Comprar en simulación</button></div>
        </div>
      </section>}

      {holdings.length > 0 && <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-7"><h2 className="text-xl font-semibold">Cartera simulada</h2><div className="mt-4 space-y-3">{holdings.map((holding, index) => <div key={holding.symbol + '-' + index} className="flex items-center justify-between gap-4 border-t border-white/10 pt-3"><div><p className="font-semibold">{holding.symbol}</p><p className="text-xs text-slate-500">{formatNumber(holding.units)} unidades</p></div><p>{money(holding.amount, holding.currency)}</p></div>)}</div></section>}
    </main>
  </div>;
}
