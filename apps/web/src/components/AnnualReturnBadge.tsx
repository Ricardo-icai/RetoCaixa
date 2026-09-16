import { useEffect, useState } from 'react';
import type { AnnualReturn, AssetSearchResult } from '../market/types';
import { percent } from '../market/trading';

export function AnnualReturnBadge({ asset }: { asset: AssetSearchResult }) {
  const [performance, setPerformance] = useState<AnnualReturn | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setPerformance(null);
    const query = new URLSearchParams({ action: 'performance', symbol: asset.symbol, exchange: asset.exchange });
    fetch('/api/market?' + query, { signal: controller.signal }).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (!controller.signal.aborted) setPerformance(data.performance);
    }).catch(() => {});
    return () => controller.abort();
  }, [asset.symbol, asset.exchange]);
  return <span title={performance ? `Variación del precio de ${performance.from} a ${performance.to}. Twelve Data. No incluye dividendos.` : 'No hay histórico contrastado disponible.'} className={`shrink-0 text-xs ${performance ? performance.percent >= 0 ? 'text-emerald-300' : 'text-rose-300' : 'text-slate-500'}`}>{performance ? `${percent(performance.percent)} · 1 año` : '1 año: —'}</span>;
}
