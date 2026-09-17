import { useState } from 'react';
import type { CommunitySnapshot } from '../community/types';
import { currentLegalAcceptance, legalVersions } from '../legal/policy';
import { tagLabels } from '../../../../packages/types/src/social';

export function FeedPersonalizationSettings({ snapshot, onChange }: { snapshot: CommunitySnapshot; onChange: (value: CommunitySnapshot['personalization']) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function update(body: Record<string, unknown>) {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/engagement', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': snapshot.csrfToken }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onChange(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  }
  const current = currentLegalAcceptance(snapshot.onboarding.legalAcceptance);
  return <section id="feed-personalization" className="border-y border-white/10 py-6">
    <h2 className="text-lg font-semibold">Preferencias del feed</h2>
    <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-emerald-300" checked={snapshot.personalization.enabled} disabled={busy || (!current && !snapshot.personalization.enabled)} onChange={event => void update({ operation: 'consent', enabled: event.target.checked, privacyVersion: legalVersions.privacy })} /><span>Personalizar con los reels que veo <span className="text-slate-400">(opcional)</span></span></label>
    <p className="mt-3 text-xs leading-6 text-slate-400">Si lo activas, usaremos el tiempo de reproducción visible y una estimación de la proporción vista para ordenar contenido educativo. Los intereses se borran al desactivarlo o, como máximo, al caducar a las 24 horas. Sin publicidad ni cambios en tu perfil de riesgo. <a href="/legal/privacy" className="text-emerald-200 underline">Privacidad</a></p>
    {!current && <a href="/verify-identity" className="mt-3 block text-xs text-emerald-200 underline">Revisar la información de privacidad vigente</a>}
    {snapshot.personalization.excludedTags.length > 0 && <div className="mt-5"><p className="text-sm">Contenido oculto: {snapshot.personalization.excludedTags.map(tag => tagLabels[tag]).join(', ')}</p><button type="button" disabled={busy} onClick={() => void update({ operation: 'restorePreferences' })} className="mt-3 text-xs text-emerald-200 underline disabled:opacity-50">Restaurar temas ocultos</button></div>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}
  </section>;
}
