import Head from 'next/head';
import { KaiHeaderIcon } from '../components/KaiHeaderIcon';
import { TradeTab } from '../components/TradeTab';

export default function Simulator() {
  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <Head><title>Invertir · KAI</title><meta name="description" content="Explora activos, revisa su información y practica con una cartera virtual." /></Head>
    <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-3"><KaiHeaderIcon /></header>
    <TradeTab />
  </div>;
}
