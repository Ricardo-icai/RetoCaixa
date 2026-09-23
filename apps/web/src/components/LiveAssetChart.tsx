import { useEffect, useState } from 'react';
import type { AssetHistory, AssetQuote, AssetSearchResult, ChartPeriod } from '../market/types';
import { money, percent } from '../market/trading';

type LiveAssetChartProps = { asset: AssetSearchResult; initialQuote?: AssetQuote };
const periods: ChartPeriod[] = ['1D', '1W', '1M', '1Y'];
const labels = { '1D': '1 día', '1W': '1 semana', '1M': '1 mes', '1Y': '1 año' };
const formatPrice = (value: number, currency: string) => `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: value < 10 ? 6 : 2 }).format(value)} ${currency}`;
function pointDate(at: string) {
  return at.length === 10 ? at.split('-').reverse().join('/') : new Date(at).toLocaleString('es-ES', { timeZone: 'UTC', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UTC';
}

export function LiveAssetChart(props: LiveAssetChartProps) {
  return <AssetChart key={`${props.asset.symbol}|${props.asset.exchange}|${props.asset.micCode ?? ''}`} {...props} />;
}

function AssetChart({ asset, initialQuote }: LiveAssetChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>('1D');
  const [history, setHistory] = useState<AssetHistory>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<number>();
  const params = new URLSearchParams({ symbol: asset.symbol, name: asset.name, exchange: asset.exchange, currency: asset.currency, type: asset.type });
  if (asset.micCode) params.set('micCode', asset.micCode);
  const query = params.toString();

  useEffect(() => {
    let alive = true;
    let busy = false;
    const controller = new AbortController();
    setHistory(undefined);
    setSelected(undefined);
    setLoading(true);
    setError('');
    const refresh = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const response = await fetch(`/api/market?action=history&period=${period}&${query}`, { cache: 'no-store', signal: controller.signal });
        const next = await response.json() as AssetHistory & { error?: string };
        if (!response.ok) throw new Error(next.error || 'No se ha podido actualizar el gráfico.');
        if (!alive) return;
        setHistory(next);
        setError('');
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : 'No se ha podido actualizar el gráfico.');
      } finally {
        busy = false;
        if (alive) setLoading(false);
      }
    };
    const onVisible = () => { if (!document.hidden) void refresh(); };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; controller.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [query, period, retry]);

  const points = history?.points ?? [];
  const first = points[0];
  const latest = points.at(-1);
  const active = selected === undefined ? latest : points[Math.min(selected, points.length - 1)];
  const change = first && latest ? (latest.price / first.price - 1) * 100 : undefined;
  const positive = (change ?? 0) >= 0;
  const currency = history?.currency || asset.currency;
  const min = points.length ? Math.min(...points.map(point => point.price)) : 0;
  const max = points.length ? Math.max(...points.map(point => point.price)) : 1;
  const padding = Math.max((max - min) * 0.1, max * 0.001, 0.000001);
  const low = min - padding, high = max + padding;
  const x = (index: number) => 12 + index / Math.max(points.length - 1, 1) * 576;
  const y = (price: number) => 180 - (price - low) / (high - low) * 164;
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.price)}`).join(' ');
  const color = positive ? '#34d399' : '#fb7185';
  const initialMatches = initialQuote?.symbol === asset.symbol && initialQuote.exchange === asset.exchange;

  return <section aria-label={`Gráfico de ${asset.symbol}`} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Historial del activo</p><h3 className="mt-1 break-words text-lg font-semibold text-white">{asset.symbol} <span className="font-normal text-slate-400">· {asset.name}</span></h3><p className="mt-1 text-xs text-slate-400">{history?.exchange || asset.exchange} · {asset.type} · {currency}</p></div>
      <div className="text-right">
        {active ? <><p className="text-lg font-semibold">{formatPrice(active.price, currency)}</p><p className="text-xs text-slate-400">{pointDate(active.at)}</p></> : initialMatches && <><p className="text-lg font-semibold">{money(initialQuote.price, initialQuote.currency)}</p><p className="text-xs text-slate-400">{initialQuote.source === 'illustrative' ? 'Precio ilustrativo' : `Cotización: ${pointDate(initialQuote.asOf)}`}</p></>}
        {change !== undefined && <p className={`mt-1 text-xs ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>{percent(change)} en el tramo mostrado</p>}
      </div>
    </div>
    <div role="group" aria-label="Periodo del gráfico" className="mt-4 flex gap-2">{periods.map(value => <button type="button" key={value} aria-pressed={period === value} onClick={() => { setPeriod(value); setHistory(undefined); setSelected(undefined); setLoading(true); }} disabled={period === value} className={`min-h-9 rounded-lg px-3 text-xs ${period === value ? 'bg-emerald-300 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>{labels[value]}</button>)}</div>
    <div aria-busy={loading} className="mt-3 overflow-hidden rounded-xl border border-white/5 bg-slate-900/80 p-3">
      {points.length ? <>
        <div className="flex justify-between gap-2 text-[11px] text-slate-400"><span>Mín. {formatPrice(min, currency)}</span><span>Máx. {formatPrice(max, currency)}</span></div>
        <svg viewBox="0 0 600 196" role="img" aria-label={`Precios de cierre de ${asset.symbol}. ${points.length} puntos; desde ${pointDate(first.at)} hasta ${pointDate(latest!.at)}.`} className="h-48 w-full" preserveAspectRatio="none" onPointerMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const ratio = ((event.clientX - bounds.left) / bounds.width * 600 - 12) / 576; setSelected(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1))))); }} onPointerLeave={() => setSelected(undefined)}>
          {[16, 98, 180].map(row => <path key={row} d={`M 12 ${row} L 588 ${row}`} stroke="rgba(148,163,184,0.15)" />)}
          {points.length > 1 && <><path d={`${path} L ${x(points.length - 1)} 180 L 12 180 Z`} fill={color} fillOpacity="0.07" /><path d={path} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></>}
          {active && <><path d={`M ${x(selected === undefined ? points.length - 1 : Math.min(selected, points.length - 1))} 16 V 180`} stroke={color} strokeDasharray="3 4" /><circle cx={x(selected === undefined ? points.length - 1 : Math.min(selected, points.length - 1))} cy={y(active.price)} r="4" fill={color} /></>}
        </svg>
        <div className="flex justify-between gap-3 text-[10px] text-slate-400"><span>{pointDate(first.at)}</span><span>{pointDate(latest!.at)}</span></div>
        <input type="range" aria-label="Explorar precios del gráfico" aria-valuetext={active ? `${pointDate(active.at)}: ${formatPrice(active.price, currency)}` : undefined} min={0} max={points.length - 1} value={selected ?? points.length - 1} onChange={event => setSelected(Number(event.target.value))} className="mt-3 w-full accent-emerald-300" />
      </> : <p role="status" className="flex min-h-48 items-center justify-center text-center text-sm text-slate-400">{loading ? 'Cargando historial…' : history?.configured === false ? 'El historial real todavía no está conectado. Los precios de la demo son ilustrativos.' : 'Historial no disponible para este activo.'}</p>}
    </div>
    {history?.configured && <p className="mt-2 text-[11px] text-slate-400">Twelve Data · Cierres de {history.interval} · Consulta automática cada 60 s. Tiempo real o retraso según mercado y cobertura del proveedor; latencia no verificada. {history.timezone !== 'UTC' && 'Fechas de la bolsa de origen.'}</p>}
    {latest && <p className="mt-1 text-[11px] text-slate-500">Última barra: {pointDate(latest.at)} · Consultado: {new Date(history!.fetchedAt).toLocaleTimeString('es-ES')}. El periodo termina en la última barra disponible.</p>}
    {error && <div role="status" className="mt-2 text-xs text-amber-200"><p>{error}{points.length > 0 && ' Se conserva el historial anterior; actualización pendiente.'}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-2 min-h-9 underline">Reintentar</button></div>}
  </section>;
}
