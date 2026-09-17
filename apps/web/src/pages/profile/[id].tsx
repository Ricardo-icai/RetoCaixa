import Head from 'next/head';
import { useRouter } from 'next/router';
import { PublicProfileView } from '../../components/PublicProfileView';
export default function ProfilePage() {
  const router = useRouter();
  if (!router.isReady || typeof router.query.id !== 'string') return <p className="p-6 text-slate-400">Cargando perfil…</p>;
  return <><Head><title>Perfil · KAI</title></Head><PublicProfileView userId={router.query.id} /></>;
}
