import { useEffect, useRef, useState } from 'react';
import type { AssetSearchResult } from '../market/types';
import { decimal, money, percent, riskFor, type PortfolioView, type TradePreview } from '../market/trading';
import { LiveAssetChart } from './LiveAssetChart';

export function TradeTicket({ asset, copying = false, onClose, onBought }: { asset: AssetSearchResult; copying?: boolean; onClose: () => void; onBought?: (portfolio: PortfolioView) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef(0);
  const locked = useRef(false);
  const [amount, setAmount] = useState('50');
  const [csrfToken, setCsrfToken] = useState('');
  const [preview, setPreview] = useState<TradePreview | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const expired = !!preview && Date.parse(preview.expiresAt) <= now;

  useEffect(() => {
    dialog.current?.showModal();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { request.current += 1; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    let alive = true;
    fetch('/api/community').then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (alive) setCsrfToken(data.csrfToken);
    }).catch(cause => { if (alive) setError(cause.message); });
    return () => { alive = false; };
  }, []);

  useEffect(() => { if (csrfToken) void review(); }, [csrfToken]);

  async function review() {
    if (!csrfToken || locked.current) return;
    const version = ++request.current;
    locked.current = true; setBusy(true); setError(''); setReviewed(false); setPreview(null);
    try {
      const response = await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify({ operation: 'preview', symbol: asset.symbol, exchange: asset.exchange, amountEur: Number(amount) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (version === request.current) setPreview(data.preview);
    } catch (cause) { if (version === request.current) setError(cause instanceof Error ? cause.message : 'No se puede consultar este activo.'); }
    finally { locked.current = false; if (version === request.current) setBusy(false); }
  }
  async function buy() {
    if (!preview || !reviewed || expired || locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify({ operation: 'buy', previewId: preview.id, reviewed }) });
      const data = await response.json();
      if (!response.ok) { if (response.status === 409) setPreview(null); throw new Error(data.error); }
      onBought?.(data.portfolio); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se ha podido confirmar. Puedes reintentar sin duplicar la compra.'); }
    finally { locked.current = false; setBusy(false); }
  }

  const quote = preview?.asset;
  return <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else onClose(); }} aria-labelledby="trade-title" className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-5 text-slate-100 backdrop:bg-slate-950/85 sm:p-7" data-swipe-ignore>
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-emerald-300">{copying ? 'Copiar en simulación' : 'Compra virtual'} · Sin dinero real</p><h2 id="trade-title" className="mt-2 text-2xl font-semibold">{asset.symbol}</h2><p className="mt-1 text-sm text-slate-400">{asset.name} · {asset.exchange}</p></div><button disabled={busy} onClick={onClose} aria-label="Cerrar compra" className="rounded-lg px-3 py-2 text-xl disabled:opacity-40">×</button></div>
    {copying && <p className="mt-4 text-xs leading-5 text-amber-200">Copiar prepara este activo con el importe que tú elijas. No replica una cartera ni acredita los resultados de un creador.</p>}
    <div className="mt-5"><LiveAssetChart asset={asset} initialQuote={quote} /></div>
    <label className="mt-5 block text-sm">Importe en euros<input type="number" min="1" max="10000" step="0.01" value={amount} disabled={busy} onChange={event => { setAmount(event.target.value); setPreview(null); setReviewed(false); }} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950 p-3" /></label>
    <div className="mt-2 flex gap-2">{[25, 50, 100].map(value => <button key={value} type="button" disabled={busy} onClick={() => { setAmount(String(value)); setPreview(null); setReviewed(false); }} className="rounded-lg border border-white/10 px-4 py-2 text-xs">{value} €</button>)}</div>
    {!preview || expired ? <button disabled={!csrfToken || busy || !Number.isFinite(Number(amount)) || Number(amount) < 1} onClick={() => void review()} className="mt-4 w-full rounded-xl bg-emerald-300 p-3 font-semibold text-slate-950 disabled:opacity-40">{busy ? 'Consultando…' : expired ? 'Actualizar información' : 'Revisar activo y precio'}</button> : null}
    {error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}
    {preview && quote && <div className="mt-5 space-y-4">
      <div className="flex justify-between gap-3"><div><p className="text-2xl font-semibold">{money(quote.price, quote.currency)}</p><p className="mt-1 text-xs text-slate-400">{quote.type} · {quote.currency}</p></div><div className="text-right text-xs"><p>{quote.percentChange === undefined ? 'Cambio diario: —' : `${percent(quote.percentChange)} diario`}</p><p className="mt-2">{quote.oneYearReturn ? `${percent(quote.oneYearReturn.percent)} · 1 año` : '1 año: no disponible'}</p></div></div>
      <p className={`text-xs ${quote.source === 'illustrative' ? 'text-amber-200' : 'text-slate-400'}`}>{quote.source === 'illustrative' ? 'Precios y cambio ilustrativos; no son cotizaciones actuales.' : 'Fuente: Twelve Data. La cobertura y el retraso dependen del mercado y del plan.'} · {new Date(quote.asOf).toLocaleString('es-ES')}</p>
      {quote.oneYearReturn && <p className="text-xs text-slate-400">Variación del precio entre {quote.oneYearReturn.from} y {quote.oneYearReturn.to}, sin dividendos.</p>}
      <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">Rango del día</dt><dd>{quote.low === undefined || quote.high === undefined ? '—' : `${money(quote.low, quote.currency)} – ${money(quote.high, quote.currency)}`}</dd></div><div><dt className="text-slate-400">Rango de 52 semanas</dt><dd>{quote.fiftyTwoWeekLow === undefined || quote.fiftyTwoWeekHigh === undefined ? '—' : `${money(quote.fiftyTwoWeekLow, quote.currency)} – ${money(quote.fiftyTwoWeekHigh, quote.currency)}`}</dd></div><div><dt className="text-slate-400">Unidades</dt><dd>{decimal(preview.units)}</dd></div><div><dt className="text-slate-400">Cambio usado</dt><dd>1 EUR = {decimal(preview.fx.perEuro)} {quote.currency}</dd></div></dl>
      {quote.description && <details className="text-sm"><summary className="cursor-pointer text-emerald-200">Conocer el activo</summary><p className="mt-2 leading-6 text-slate-300">{quote.description}</p></details>}
      <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100"><strong>Riesgos clave</strong><p>{riskFor(quote.type)} Puedes perder el capital invertido.</p></div>
      <p className="text-xs leading-5 text-slate-400">Total: {money(preview.amountEur)} ({money(preview.nativeAmount, quote.currency)}). Sin comisiones ni impuestos. La simulación usa este precio durante 60 segundos; una orden real puede ejecutarse a otro precio.</p>
      <label className="flex gap-3 text-xs leading-5"><input type="checkbox" checked={reviewed} disabled={busy || expired} onChange={event => setReviewed(event.target.checked)} className="accent-emerald-300" />He revisado el activo, la divisa, el precio y sus riesgos.</label>
      {expired && <p role="status" className="text-xs text-amber-200">La propuesta ha caducado. Actualízala antes de comprar.</p>}
      <button disabled={!reviewed || busy || expired} onClick={() => void buy()} className="w-full rounded-xl bg-emerald-300 p-4 text-sm font-semibold text-slate-950 disabled:opacity-40">{busy ? 'Confirmando…' : `Confirmar compra virtual · ${money(preview.amountEur)}`}</button>
    </div>}
  </dialog>;
}
