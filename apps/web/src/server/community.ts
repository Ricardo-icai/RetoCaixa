import { randomUUID } from 'node:crypto';
import { communityTopics, investorGoals, type CommunitySnapshot, type CommunityTopic, type CreatorChannel, type InvestorGoal, type KycStatus, type PostKind } from '../community/types.ts';

type ReplyRecord = { id: string; owner: string; author: string; text: string; createdAt: string };
type PostRecord = {
  id: string; owner: string | null; author: string; kind: PostKind; topic: CommunityTopic;
  title: string; text: string; createdAt: string; demo: boolean; channelId?: string;
  helpfulBy: Set<string>; replies: ReplyRecord[];
};
type Viewer = {
  id: string; label: string; csrfToken: string; actions: number[]; subscriptions: Set<string>;
  kycStatus: KycStatus; identityVerified: boolean; visibility: 'PUBLIC' | 'PRIVATE';
  countryCode?: string; goals: InvestorGoal[]; consentedAt?: string; consentIp?: string; consentUserAgent?: string;
};
type Store = { viewers: Map<string, Viewer>; posts: PostRecord[] };

const channels: Omit<CreatorChannel, 'subscribed' | 'subscriberCount'>[] = [
  { id: 'nora-vega', name: 'Nora Vega', focus: 'Inversión a largo plazo', bio: 'Perfil ficticio de ejemplo. Comparte cómo piensa sobre diversificación, costes y horizonte temporal.', demo: true, identityVerified: false },
  { id: 'leo-solis', name: 'Leo Solís', focus: 'Gestión del dinero', bio: 'Perfil ficticio de ejemplo. Habla de presupuesto, colchón de emergencia y hábitos financieros.', demo: true, identityVerified: false },
  { id: 'alma-rios', name: 'Alma Ríos', focus: 'Riesgo y comportamiento', bio: 'Perfil ficticio de ejemplo. Explora cómo tomar decisiones sin seguir el ruido del mercado.', demo: true, identityVerified: false },
];

const globalCommunity = globalThis as typeof globalThis & { kaiCommunity?: Store };
const store = globalCommunity.kaiCommunity ??= { viewers: new Map(), posts: seedPosts() };
if (!store.posts.some(post => post.id === 'demo-channel-1')) store.posts.unshift(...seedPosts().filter(post => post.channelId));

export class CommunityError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function seedPosts(): PostRecord[] {
  const channelExamples: { channelId: string; kind: PostKind; topic: CommunityTopic; title: string; text: string }[] = [
    { channelId: 'nora-vega', kind: 'movimiento', topic: 'Fondos', title: 'Movimiento simulado · Reequilibrar una cartera', text: 'En este ejemplo ficticio reduje el peso de la renta variable del 75 % al 65 % para volver a mi objetivo inicial. No es una operación real ni una invitación a copiarla: la decisión depende del plazo y de la situación de cada persona.' },
    { channelId: 'leo-solis', kind: 'consejo', topic: 'Gestionar dinero', title: 'Consejo gratis · Separa el dinero que necesitas pronto', text: 'Antes de elegir una inversión, distingue gastos próximos, colchón de emergencia y dinero que podrías dejar invertido. Es un marco educativo, no una cantidad recomendada para tu caso.' },
    { channelId: 'alma-rios', kind: 'consejo', topic: 'Riesgo', title: 'Consejo gratis · Una caída no cambia tu plan por sí sola', text: 'Si una noticia te empuja a actuar hoy, vuelve a preguntar para qué necesitas ese dinero y cuándo. El comportamiento importa tanto como la elección del producto.' },
  ];
  const examples: { kind: PostKind; topic: CommunityTopic; title: string; text: string }[] = [
    { kind: 'debate', topic: 'Primeros pasos', title: '¿Qué me habría gustado saber antes de empezar?', text: 'Antes de pensar en un producto, separa el dinero para gastos próximos y emergencias. ¿Qué pregunta te gustaría resolver antes de dar tu primer paso?' },
    { kind: 'leccion', topic: 'Fondos', title: 'Microlección · Diversificar en un minuto', text: 'Diversificar significa repartir el dinero entre distintas inversiones. Reduce la dependencia de una sola empresa, pero no elimina las pérdidas. ¿Qué diferencia ves entre diversificar y comprar muchas acciones del mismo sector?' },
    { kind: 'leccion', topic: 'Riesgo', title: 'Microlección · Riesgo que toleras y riesgo que puedes asumir', text: 'Que una caída no te asuste no significa que puedas permitirte perder ese dinero. Tu horizonte, tus gastos y tu colchón importan tanto como tu actitud ante la volatilidad.' },
    { kind: 'debate', topic: 'Mercados', title: '¿Cómo leer una noticia de mercado sin actuar por impulso?', text: 'Una noticia llamativa no demuestra que hoy sea un buen momento para comprar o vender. Comparte qué datos comprobarías y qué dudas te deja antes de tomar una decisión.' },
  ];
  return [
    ...channelExamples.map((post, index) => ({ ...post, id: `demo-channel-${index + 1}`, owner: null, author: channels.find(channel => channel.id === post.channelId)!.name, createdAt: new Date(Date.now() - (index + 1) * 3600000).toISOString(), demo: true, helpfulBy: new Set<string>(), replies: [] })),
    ...examples.map((post, index) => ({ ...post, id: `demo-${index + 1}`, owner: null, author: 'Equipo KAI · ejemplo', createdAt: new Date(Date.now() - (index + 4) * 3600000).toISOString(), demo: true, helpfulBy: new Set<string>(), replies: [] })),
  ];
}

export function getViewer(id?: string): Viewer {
  if (id && store.viewers.has(id)) {
    const viewer = store.viewers.get(id)!;
    viewer.subscriptions ??= new Set();
    viewer.kycStatus ??= 'UNVERIFIED';
    viewer.identityVerified ??= false;
    viewer.visibility ??= 'PRIVATE';
    viewer.goals ??= [];
    return viewer;
  }
  if (store.viewers.size >= 5000) throw new CommunityError(503, 'La comunidad está ocupada. Vuelve a intentarlo más tarde.');
  const viewerId = randomUUID();
  const viewer: Viewer = { id: viewerId, label: `Participante #${viewerId.slice(0, 4).toUpperCase()}`, csrfToken: randomUUID(), actions: [], subscriptions: new Set<string>(), kycStatus: 'UNVERIFIED', identityVerified: false, visibility: 'PRIVATE', goals: [] };
  store.viewers.set(viewerId, viewer);
  return viewer;
}

export function hasCompletedOnboarding(id?: string): boolean {
  if (!id || !store.viewers.has(id)) return false;
  const viewer = store.viewers.get(id)!;
  return viewer.kycStatus === 'VERIFIED' && !!viewer.consentedAt && viewer.goals.length > 0;
}

export function communitySnapshot(viewer: Viewer): CommunitySnapshot {
  const preferredTopics = new Set<CommunityTopic>();
  for (const goal of viewer.goals) {
    if (goal === 'Gestionar mi dinero' || goal === 'Crear mi colchón') preferredTopics.add('Gestionar dinero');
    if (goal === 'Aprender a invertir') preferredTopics.add('Primeros pasos');
    if (goal === 'Invertir a largo plazo') preferredTopics.add('Fondos');
  }
  const personalizedPosts = [...store.posts].sort((a, b) => {
    const aScore = (a.channelId && viewer.subscriptions.has(a.channelId) ? 2 : 0) + (preferredTopics.has(a.topic) ? 1 : 0);
    const bScore = (b.channelId && viewer.subscriptions.has(b.channelId) ? 2 : 0) + (preferredTopics.has(b.topic) ? 1 : 0);
    return bScore - aScore || Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
  return {
    viewer: viewer.label,
    csrfToken: viewer.csrfToken,
    onboarding: { completed: viewer.kycStatus === 'VERIFIED' && !!viewer.consentedAt && viewer.goals.length > 0, kycStatus: viewer.kycStatus, identityVerified: viewer.identityVerified, visibility: viewer.visibility, countryCode: viewer.countryCode, goals: viewer.goals, consentedAt: viewer.consentedAt },
    channels: channels.map(channel => ({ ...channel, subscribed: viewer.subscriptions.has(channel.id), subscriberCount: [...store.viewers.values()].filter(item => item.subscriptions?.has(channel.id)).length })),
    posts: personalizedPosts.map(post => ({
      id: post.id, kind: post.kind, topic: post.topic, title: post.title, text: post.text,
      author: post.author, channelId: post.channelId, createdAt: post.createdAt, demo: post.demo,
      mine: post.owner === viewer.id, helpful: post.helpfulBy.has(viewer.id),
      helpfulCount: post.helpfulBy.size,
      replies: post.replies.map(reply => ({ id: reply.id, author: reply.author, text: reply.text, createdAt: reply.createdAt, mine: reply.owner === viewer.id })),
    })),
  };
}

function textField(value: unknown, min: number, max: number, label: string): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new CommunityError(400, `${label}: usa entre ${min} y ${max} caracteres.`);
  }
  return value.trim();
}

export function mutateCommunity(viewer: Viewer, body: Record<string, unknown>): CommunitySnapshot {
  const now = Date.now();
  viewer.actions = viewer.actions.filter(time => now - time < 60000);
  if (viewer.actions.length >= 20) throw new CommunityError(429, 'Has participado muchas veces en un minuto. Espera un poco.');
  viewer.actions.push(now);

  if (body.operation === 'publish') {
    if (viewer.kycStatus !== 'VERIFIED') throw new CommunityError(403, 'Completa la verificación de identidad antes de publicar.');
    if (body.kind !== 'debate' && body.kind !== 'leccion') throw new CommunityError(400, 'Elige debate o microlección.');
    if (!communityTopics.includes(body.topic as CommunityTopic)) throw new CommunityError(400, 'Elige un tema válido.');
    const title = textField(body.title, 6, 100, 'Título');
    const text = textField(body.text, 20, 800, 'Contenido');
    store.posts.unshift({ id: randomUUID(), owner: viewer.id, author: viewer.label, kind: body.kind, topic: body.topic as CommunityTopic, title, text, createdAt: new Date(now).toISOString(), demo: false, helpfulBy: new Set(), replies: [] });
    store.posts.splice(200);
  } else if (body.operation === 'reply') {
    if (viewer.kycStatus !== 'VERIFIED') throw new CommunityError(403, 'Completa la verificación de identidad antes de responder.');
    const post = store.posts.find(item => item.id === body.postId);
    if (!post) throw new CommunityError(404, 'La publicación ya no está disponible.');
    if (post.replies.length >= 50) throw new CommunityError(409, 'Este debate ha llegado al límite de respuestas de la demo.');
    const text = textField(body.text, 2, 300, 'Respuesta');
    post.replies.push({ id: randomUUID(), owner: viewer.id, author: viewer.label, text, createdAt: new Date(now).toISOString() });
  } else if (body.operation === 'helpful') {
    const post = store.posts.find(item => item.id === body.postId);
    if (!post) throw new CommunityError(404, 'La publicación ya no está disponible.');
    if (post.helpfulBy.has(viewer.id)) post.helpfulBy.delete(viewer.id);
    else post.helpfulBy.add(viewer.id);
  } else if (body.operation === 'delete') {
    const index = store.posts.findIndex(item => item.id === body.postId);
    if (index < 0) throw new CommunityError(404, 'La publicación ya no está disponible.');
    if (store.posts[index].owner !== viewer.id) throw new CommunityError(403, 'Solo puedes borrar tus publicaciones.');
    store.posts.splice(index, 1);
  } else if (body.operation === 'deleteReply') {
    const post = store.posts.find(item => item.id === body.postId);
    if (!post) throw new CommunityError(404, 'La publicación ya no está disponible.');
    const index = post.replies.findIndex(item => item.id === body.replyId);
    if (index < 0) throw new CommunityError(404, 'La respuesta ya no está disponible.');
    if (post.replies[index].owner !== viewer.id) throw new CommunityError(403, 'Solo puedes borrar tus respuestas.');
    post.replies.splice(index, 1);
  } else if (body.operation === 'subscribe') {
    if (typeof body.channelId !== 'string' || !channels.some(channel => channel.id === body.channelId)) throw new CommunityError(404, 'Ese canal no está disponible.');
    if (viewer.subscriptions.has(body.channelId)) viewer.subscriptions.delete(body.channelId);
    else viewer.subscriptions.add(body.channelId);
  } else if (body.operation === 'completeOnboarding') {
    if (body.acceptTerms !== true || body.acceptBiometric !== true || body.acceptRisk !== true) throw new CommunityError(400, 'Debes aceptar los tres consentimientos para continuar.');
    if (body.visibility !== 'PUBLIC' && body.visibility !== 'PRIVATE') throw new CommunityError(400, 'Elige la visibilidad de tu perfil.');
    if (typeof body.countryCode !== 'string' || !/^[A-Z]{2}$/.test(body.countryCode)) throw new CommunityError(400, 'Selecciona un país válido.');
    if (!Array.isArray(body.goals) || body.goals.length === 0 || body.goals.some(goal => !investorGoals.includes(goal as InvestorGoal))) throw new CommunityError(400, 'Elige al menos un objetivo válido.');
    viewer.visibility = body.visibility;
    viewer.countryCode = body.countryCode;
    viewer.goals = [...new Set(body.goals as InvestorGoal[])];
    viewer.consentedAt = new Date(now).toISOString();
    viewer.consentIp = typeof body.consentIp === 'string' ? body.consentIp : 'unknown';
    viewer.consentUserAgent = typeof body.consentUserAgent === 'string' ? body.consentUserAgent.slice(0, 300) : undefined;
    viewer.kycStatus = 'PENDING';
    viewer.identityVerified = false;
  } else if (body.operation === 'verifyIdentityDemo') {
    if (!viewer.consentedAt || viewer.goals.length === 0) throw new CommunityError(409, 'Completa primero los consentimientos y tus objetivos.');
    viewer.kycStatus = 'VERIFIED';
    viewer.identityVerified = true;
  } else {
    throw new CommunityError(400, 'Operación no válida.');
  }
  return communitySnapshot(viewer);
}
