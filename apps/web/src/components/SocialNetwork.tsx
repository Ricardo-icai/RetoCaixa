import { useCallback, useEffect, useRef, useState } from 'react';
import type { FollowersView, SocialProfile, SocialSnapshot } from '../community/socialTypes';
import { FollowButton } from './FollowButton';

export function SocialNetwork() {
  const [snapshot, setSnapshot] = useState<SocialSnapshot | null>(null);
  const [error, setError] = useState('');
  const [followers, setFollowers] = useState<(FollowersView & { name: string; id: string }) | null>(null);
  const request = useRef(0);
  const load = useCallback(async () => {
    const version = ++request.current;
    try {
      const response = await fetch('/api/social?action=getSuggestedCreators', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (version === request.current) { setSnapshot(data); setError(''); }
    } catch (cause) { if (version === request.current) setError(cause instanceof Error ? cause.message : 'No se ha podido cargar tu red.'); }
  }, []);
  useEffect(() => { void load(); const refresh = () => { if (!document.hidden) void load(); }; window.addEventListener('focus', refresh); return () => { request.current += 1; window.removeEventListener('focus', refresh); }; }, [load]);
  async function showFollowers(profile: Pick<SocialProfile, 'id' | 'name'>, offset = 0) {
    try {
      const response = await fetch(`/api/social?action=getFollowers&userId=${encodeURIComponent(profile.id)}&offset=${offset}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFollowers(previous => ({ ...data, id: profile.id, name: profile.name, profiles: offset && previous?.id === profile.id ? [...previous.profiles, ...data.profiles] : data.profiles }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se han podido consultar los seguidores.'); }
  }
  const changed = () => { setFollowers(null); void load(); };
  function profileCard(profile: SocialProfile, creator: boolean) {
    return <article key={profile.id} className="rounded-3xl border border-white/10 bg-[#101d2a] p-5"><div className="flex items-center justify-between gap-3"><div aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/15 text-xl font-semibold text-emerald-200">{profile.name.charAt(0)}</div>{snapshot && <FollowButton userId={profile.id} following={profile.following} csrfToken={snapshot.csrfToken} onChanged={changed} />}</div><h3 className="mt-4 text-xl font-semibold"><a href={`/profile/${profile.id}`} className="hover:text-emerald-200">{profile.name}</a></h3><p className="mt-2 text-sm leading-6 text-slate-300">{profile.focus}</p><div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400"><button onClick={() => void showFollowers(profile)} className="hover:text-emerald-200">{profile.followersCount} seguidores</button><span>{profile.followingCount} siguiendo</span>{profile.friend && <span className="text-cyan-200">Amigos · Os seguís</span>}</div><p className="mt-3 text-[11px] text-slate-500">{creator ? 'Creador ficticio · Canal gratuito' : 'Perfil público de la demo'}</p></article>;
  }
  return <div className="mt-6 space-y-7">
    {error && <p role="alert" className="text-sm text-rose-200">{error} <button onClick={() => void load()} className="underline">Reintentar</button></p>}
    {!snapshot && !error && <p className="text-sm text-slate-400">Cargando tu red…</p>}
    {snapshot && <>
      <div className="flex flex-wrap gap-4 text-sm text-slate-300"><a href="/profile" className="text-emerald-200">{snapshot.me.name} · Mi perfil ↗</a><button onClick={() => void showFollowers(snapshot.me)} className="text-emerald-200">{snapshot.me.followersCount} seguidores</button><span>{snapshot.me.followingCount} siguiendo</span></div>
      <section aria-labelledby="suggested-creators"><h2 id="suggested-creators" className="text-xl font-semibold">Creadores para descubrir</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{snapshot.creators.map(profile => profileCard(profile, true))}</div></section>
      <section aria-labelledby="public-members"><h2 id="public-members" className="text-xl font-semibold">Conecta con la comunidad</h2><p className="mt-2 text-xs leading-5 text-slate-400">Solo aparecen los perfiles públicos. Al seguiros mutuamente, la conexión se marca como amistad.</p>{snapshot.members.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{snapshot.members.map(profile => profileCard(profile, false))}</div> : <p className="mt-4 text-sm text-slate-500">Todavía no hay otros perfiles públicos disponibles.</p>}</section>
    </>}
    {followers && <section aria-label={`Seguidores de ${followers.name}`} className="rounded-2xl border border-white/15 bg-slate-900 p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">Seguidores de {followers.name} · {followers.total}</h2><button onClick={() => setFollowers(null)} className="text-xs text-slate-400">Cerrar</button></div><p className="mt-2 text-xs text-slate-400">Los perfiles privados se incluyen en el contador, pero no se muestran.</p><ul className="mt-4 space-y-3">{followers.profiles.map(profile => <li key={profile.id} className="flex items-center justify-between gap-3 text-sm"><span>{profile.name}</span>{snapshot && profile.id !== snapshot.me.id && <FollowButton userId={profile.id} following={profile.following} csrfToken={snapshot.csrfToken} onChanged={changed} />}</li>)}</ul>{followers.profiles.length === 0 && <p className="mt-3 text-sm text-slate-500">No hay perfiles visibles.</p>}{followers.nextOffset !== null && <button onClick={() => void showFollowers(followers, followers.nextOffset!)} className="mt-4 text-xs text-emerald-200">Ver más</button>}</section>}
  </div>;
}
