import { useEffect, useRef, useState } from 'react';

export function FollowButton({ userId, following, csrfToken, onChanged }: { userId: string; following: boolean; csrfToken: string; onChanged?: () => void }) {
  const [value, setValue] = useState(following);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  useEffect(() => { if (!pending.current) setValue(following); }, [following]);
  async function toggle() {
    if (pending.current) return;
    const previous = value;
    pending.current = true; setBusy(true); setValue(!previous); setError('');
    try {
      const response = await fetch('/api/social', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify({ operation: 'toggleFollowUser', userId, following: !previous }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido actualizar.');
      onChanged?.();
    } catch (cause) { setValue(previous); setError(cause instanceof Error ? cause.message : 'Vuelve a intentarlo.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <span className="inline-flex flex-col items-start gap-1"><button type="button" onClick={() => void toggle()} disabled={busy} aria-pressed={value} aria-busy={busy} className={`rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60 ${value ? 'border border-emerald-300/40 text-emerald-200' : 'bg-emerald-300 text-slate-950'}`}>{value ? 'Siguiendo' : 'Seguir'}</button>{error && <span role="alert" className="max-w-xs text-xs text-rose-200">{error}</span>}</span>;
}
