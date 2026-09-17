import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { KaiIcon, type KaiIconName } from './KaiIcon';
import { investmentTags, type ProfileDetail, type InvestmentTag } from '../community/persona';

const inputStyle = 'mt-2 w-full border-b border-slate-700 bg-transparent py-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none';
export function EditProfileSettings() {
  const [detail, setDetail] = useState<ProfileDetail | null>(null);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [tag, setTag] = useState<InvestmentTag | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  function populate(data: ProfileDetail) { setDetail(data); setName(data.profile.name); setHandle(data.profile.handle); setBio(data.profile.bio); setTag(data.profile.investmentTag); setAvatar(data.profile.avatar); }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/profile', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error); populate(data);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, []);

  async function upload(file?: File) {
    if (!file) return;
    setError(''); setSaved(false); setImageBusy(true);
    let url: string | undefined;
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Foto: usa un JPEG, PNG o WebP de hasta 5 MB.');
      url = URL.createObjectURL(file);
      const image = new Image(); image.src = url; await image.decode();
      if (image.naturalWidth * image.naturalHeight > 16000000) throw new Error('Foto: usa una imagen de hasta 16 megapíxeles.');
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
      const context = canvas.getContext('2d'); if (!context) throw new Error('No se ha podido preparar la foto.');
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      context.fillStyle = '#0f172a'; context.fillRect(0, 0, 256, 256);
      context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 256, 256);
      setAvatar(canvas.toDataURL('image/jpeg', 0.85));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se puede leer esa imagen.'); }
    finally { if (url) URL.revokeObjectURL(url); setImageBusy(false); if (input.current) input.current.value = ''; }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!detail || pending.current || imageBusy) return;
    pending.current = true; setBusy(true); setError(''); setSaved(false);
    try {
      const response = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': detail.csrfToken }, body: JSON.stringify({ name: name.trim(), handle, bio, investmentTag: tag, avatar, revision: detail.revision }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      populate(data); setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se han guardado los cambios.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <main className="mx-auto min-h-screen max-w-md bg-slate-950 px-5 pb-28 pt-6 text-slate-100">
    <Link href="/settings" className="text-sm text-emerald-200">← Ajustes</Link>
    <h1 className="mt-6 text-2xl font-semibold">Editar perfil</h1>
    <p className="mt-2 text-sm leading-6 text-slate-400">Dale tu toque. Tu perfil es {detail?.visibility === 'PUBLIC' ? 'público' : 'privado'}.</p>
    {!detail && !error && <p className="mt-6 text-sm">Cargando perfil…</p>}
    {error && <p role="alert" className="my-5 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{error} <Link href="/verify-identity" className="underline">Revisar el alta</Link></p>}
    {saved && <p role="status" className="my-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-200">Cambios guardados. <Link href="/profile" className="underline">Ver mi perfil</Link></p>}
    {detail && <form onSubmit={event => void save(event)} onChange={() => setSaved(false)}>
      <fieldset disabled={busy || imageBusy} className="space-y-7">
        <div className="my-8 flex flex-col items-center gap-3">
          <button type="button" onClick={() => input.current?.click()} aria-label="Cambiar foto de perfil" className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-500/50 bg-slate-800 transition-shadow hover:shadow-[0_0_15px_rgba(52,211,153,0.4)] focus:shadow-[0_0_15px_rgba(52,211,153,0.4)]">
            {avatar ? <img src={avatar} alt="Vista previa de tu foto" className="h-full w-full object-cover" /> : <span className="text-4xl text-emerald-200">{name.charAt(0)}</span>}
            <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-slate-900/50 text-2xl opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus:opacity-100"><KaiIcon name="camera" className="h-7 w-7" /></span>
          </button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void upload(event.target.files?.[0])} className="sr-only" aria-label="Archivo de foto de perfil" tabIndex={-1} />
          <button type="button" onClick={() => input.current?.click()} className="text-xs text-cyan-200">{imageBusy ? 'Preparando foto…' : 'Cambiar foto · hasta 5 MB'}</button>
          {avatar && <button type="button" onClick={() => { setAvatar(null); setSaved(false); }} className="text-xs text-slate-400">Quitar foto</button>}
        </div>
        <label className="block text-xs text-slate-400">Nombre visible<input name="name" required minLength={2} maxLength={50} value={name} onChange={event => setName(event.target.value)} className={inputStyle} /></label>
        <label className="block text-xs text-slate-400">Usuario (@)<input name="handle" required minLength={3} maxLength={36} pattern="[a-zA-Z0-9_]{3,36}" autoCapitalize="none" spellCheck={false} value={handle} onChange={event => setHandle(event.target.value.replace(/^@/, '').toLowerCase())} className={inputStyle} /><span className="mt-2 block">Letras sin tildes, números y guion bajo.</span></label>
        <label className="block text-xs text-slate-400">Biografía<textarea name="bio" rows={3} maxLength={150} value={bio} onChange={event => setBio(event.target.value)} className={`${inputStyle} resize-y`} /><span className="mt-1 block text-right font-mono text-[10px]">{bio.length}/150</span></label>
        <div><p className="text-xs text-slate-400">Tu estilo · opcional</p><div className="mt-3 flex flex-wrap gap-2">{investmentTags.map(item => <button key={item} type="button" aria-pressed={tag === item} onClick={() => { setTag(tag === item ? null : item); setSaved(false); }} className={`rounded-full border px-3 py-2 text-xs backdrop-blur-md ${tag === item ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)]' : 'border-slate-700 bg-slate-900/60 text-slate-300'}`}><span className="inline-flex items-center gap-2"><KaiIcon name={(['growth', 'shield', 'globe', 'tech', 'crypto'] as KaiIconName[])[investmentTags.indexOf(item)]} className="h-4 w-4" />{item.slice(item.indexOf(' ') + 1)}</span></button>)}</div><p className="mt-3 text-xs leading-5 text-slate-500">Describe tus intereses, no tu capacidad para asumir riesgos.</p></div>
        <p className="text-xs leading-5 text-slate-500">Los cambios se guardan en la sesión de esta demo y pueden perderse al reiniciar el servidor.</p>
      </fieldset>
      <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md gap-3 border-t border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl">
        <button type="button" disabled={busy || imageBusy} onClick={() => { populate(detail); setError(''); setSaved(false); }} className="flex-1 rounded-xl py-3 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
        <button type="submit" disabled={busy || imageBusy} className="flex-[2] rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg disabled:opacity-40">{busy ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>
    </form>}
  </main>;
}
