import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { legalDocuments } from '../../legal/documents';

type Props = { document: keyof typeof legalDocuments };
export const getStaticPaths: GetStaticPaths = async () => ({ paths: Object.keys(legalDocuments).map(document => ({ params: { document } })), fallback: false });
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const document = params?.document;
  if (typeof document !== 'string' || !Object.prototype.hasOwnProperty.call(legalDocuments, document)) return { notFound: true };
  return { props: { document: document as Props['document'] } };
};

export default function LegalDocument({ document }: Props) {
  const content = legalDocuments[document];
  return <main className="mx-auto max-w-3xl space-y-7 px-5 py-10 text-slate-100">
    <Head><title>{content.title} · KAI</title></Head>
    <Link href="/legal" className="text-sm text-emerald-200">← Centro legal</Link>
    <h1 className="text-3xl font-semibold">{content.title}</h1>
    <p className="text-sm text-slate-400">Versión {content.version} · Texto provisional de la demo · 16 de septiembre de 2026</p>
    {content.sections.map(([title, text]) => <section key={title} className="rounded-2xl border border-white/10 bg-slate-900 p-5"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-300">{text}</p></section>)}
    <button type="button" onClick={() => window.print()} className="rounded-xl border border-white/20 px-4 py-3 text-sm">Imprimir o guardar como PDF</button>
  </main>;
}
