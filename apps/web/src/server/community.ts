import { randomUUID } from 'node:crypto';
import { birthDateError, demoToday } from '../legal/age.ts';
import { currentLegalAcceptance, validLegalSubmission, legalVersions, type LegalAcceptance } from '../legal/policy.ts';
import { communityTopics, investorGoals, type CommunitySnapshot, type CommunityTopic, type CreatorChannel, type InvestorGoal, type KycStatus, type PostKind } from '../community/types.ts';
import { learningPlan, recommendFeed } from './feedRecommendations.ts';
import { learningContent } from '../community/learningContent.ts';
import type { FollowersView, SocialProfile, SocialSnapshot } from '../community/socialTypes.ts';
import { reelFromPost, type Reel } from '../community/reels.ts';

type ReplyRecord = { id: string; owner: string; author: string; text: string; createdAt: string };
type PostRecord = {
  id: string; owner: string | null; author: string; kind: PostKind; topic: CommunityTopic;
  title: string; text: string; createdAt: string; demo: boolean; channelId?: string;
  helpfulBy: Set<string>; replies: ReplyRecord[];
};
export type Viewer = {
  id: string; label: string; csrfToken: string; actions: number[]; subscriptions: Set<string>;
  kycStatus: KycStatus; identityVerified: boolean; visibility: 'PUBLIC' | 'PRIVATE';
  countryCode?: string; nationality?: string; goals: InvestorGoal[]; consentedAt?: string; legalAcceptance?: LegalAcceptance;
};
type Store = { viewers: Map<string, Viewer>; posts: PostRecord[]; followers?: Map<string, Set<string>> };

const channels: Omit<CreatorChannel, 'subscribed' | 'subscriberCount'>[] = [
  { id: 'nora-vega', name: 'Nora Vega', focus: 'Inversión a largo plazo', bio: 'Perfil ficticio de ejemplo. Comparte cómo piensa sobre diversificación, costes y horizonte temporal.', demo: true, identityVerified: false },
  { id: 'leo-solis', name: 'Leo Solís', focus: 'Gestión del dinero', bio: 'Perfil ficticio de ejemplo. Habla de presupuesto, colchón de emergencia y hábitos financieros.', demo: true, identityVerified: false },
  { id: 'alma-rios', name: 'Alma Ríos', focus: 'Riesgo y comportamiento', bio: 'Perfil ficticio de ejemplo. Explora cómo tomar decisiones sin seguir el ruido del mercado.', demo: true, identityVerified: false },
];

const globalCommunity = globalThis as typeof globalThis & { kaiCommunity?: Store };
const store: Store = globalCommunity.kaiCommunity ??= { viewers: new Map(), posts: seedPosts() };
if (!store.posts.some(post => post.id === 'demo-channel-1')) store.posts.unshift(...seedPosts().filter(post => post.channelId));
if (!store.posts.some(post => post.id.startsWith('demo-learning-'))) store.posts.push(...seedPosts().filter(post => post.id.startsWith('demo-learning-')));
const followers = store.followers ??= new Map<string, Set<string>>();
for (const viewer of store.viewers.values()) for (const id of viewer.subscriptions ?? []) {
  if (!followers.has(id)) followers.set(id, new Set());
  followers.get(id)!.add(viewer.id);
}

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
    ...learningContent.map((post, index) => ({ ...post, kind: 'leccion' as const, id: `demo-learning-${index + 1}`, owner: null, author: 'Equipo KAI · ejemplo', createdAt: new Date(Date.now() - (index + 12) * 3600000).toISOString(), demo: true, helpfulBy: new Set<string>(), replies: [] })),
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
  return viewer.kycStatus === 'VERIFIED' && currentLegalAcceptance(viewer.legalAcceptance) && viewer.goals.length > 0;
}

export function communitySnapshot(viewer: Viewer, chatSessionId?: string): CommunitySnapshot {
  const { posts: personalizedPosts, feed } = recommendFeed(store.posts, learningPlan(viewer.goals, chatSessionId), viewer.subscriptions);
  const reels = recommendFeed(store.posts.map(reelFromPost).filter((reel): reel is Reel => !!reel), learningPlan(viewer.goals, chatSessionId), viewer.subscriptions);
  return {
    reels: reels.posts.slice(0, 10), reelFeed: reels.feed,
    feed,
    viewer: viewer.label,
    csrfToken: viewer.csrfToken,
    onboarding: { completed: viewer.kycStatus === 'VERIFIED' && currentLegalAcceptance(viewer.legalAcceptance) && viewer.goals.length > 0, kycStatus: viewer.kycStatus, identityVerified: viewer.identityVerified, visibility: viewer.visibility, countryCode: viewer.countryCode, nationality: viewer.nationality, goals: viewer.goals, consentedAt: viewer.consentedAt, legalAcceptance: viewer.legalAcceptance },
    channels: channels.map(channel => ({ ...channel, subscribed: viewer.subscriptions.has(channel.id), subscriberCount: followers.get(channel.id)?.size ?? 0 })),
    posts: personalizedPosts.map(post => ({
      id: post.id, kind: post.kind, topic: post.topic, title: post.title, text: post.text,
      author: post.author, channelId: post.channelId, createdAt: post.createdAt, demo: post.demo,
      recommendation: post.recommendation,
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

export function mutateCommunity(viewer: Viewer, body: Record<string, unknown>, chatSessionId?: string): CommunitySnapshot {
  const now = Date.now();
  viewer.actions = viewer.actions.filter(time => now - time < 60000);
  if (viewer.actions.length >= 20) throw new CommunityError(429, 'Has participado muchas veces en un minuto. Espera un poco.');
  viewer.actions.push(now);

  if (body.operation === 'publish') {
    if (viewer.kycStatus !== 'VERIFIED' || !currentLegalAcceptance(viewer.legalAcceptance)) throw new CommunityError(403, 'Completa la verificación de identidad antes de publicar.');
    if (body.kind !== 'debate' && body.kind !== 'leccion') throw new CommunityError(400, 'Elige debate o microlección.');
    if (!communityTopics.includes(body.topic as CommunityTopic)) throw new CommunityError(400, 'Elige un tema válido.');
    const title = textField(body.title, 6, 100, 'Título');
    const text = textField(body.text, 20, 800, 'Contenido');
    store.posts.unshift({ id: randomUUID(), owner: viewer.id, author: viewer.label, kind: body.kind, topic: body.topic as CommunityTopic, title, text, createdAt: new Date(now).toISOString(), demo: false, helpfulBy: new Set(), replies: [] });
    store.posts.splice(200);
  } else if (body.operation === 'reply') {
    if (viewer.kycStatus !== 'VERIFIED' || !currentLegalAcceptance(viewer.legalAcceptance)) throw new CommunityError(403, 'Completa la verificación de identidad antes de responder.');
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
    setFollowUser(viewer, body.channelId, typeof body.following === 'boolean' ? body.following : !viewer.subscriptions.has(body.channelId));
  } else if (body.operation === 'completeOnboarding') {
    const checkedOn = demoToday(new Date(now));
    const ageError = birthDateError(body.dateOfBirth, checkedOn);
    if (ageError) throw new CommunityError(400, ageError);
    if (!validLegalSubmission(body)) throw new CommunityError(400, 'Acepta los términos y riesgos vigentes, confirma la lectura de privacidad. Si el texto ha cambiado, actualiza la página.');
    if (body.visibility !== 'PUBLIC' && body.visibility !== 'PRIVATE') throw new CommunityError(400, 'Elige la visibilidad de tu perfil.');
    if (typeof body.countryCode !== 'string' || !/^[A-Z]{2}$/.test(body.countryCode)) throw new CommunityError(400, 'Selecciona un país válido.');
    if (!Array.isArray(body.goals) || body.goals.length === 0 || body.goals.some(goal => !investorGoals.includes(goal as InvestorGoal))) throw new CommunityError(400, 'Elige al menos un objetivo válido.');
    const nationality = textField(body.nationality, 2, 80, 'Nacionalidad');
    viewer.nationality = nationality;
    viewer.visibility = body.visibility;
    viewer.countryCode = body.countryCode;
    viewer.goals = [...new Set(body.goals as InvestorGoal[])];
    viewer.consentedAt = new Date(now).toISOString();
    viewer.legalAcceptance = { versions: { ...legalVersions }, acceptedAt: viewer.consentedAt, countryCode: viewer.countryCode, ageCheck: { minimumAge: 18, method: 'declared_birth_date', checkedOn } };
    viewer.kycStatus = 'PENDING';
    viewer.identityVerified = false;
  } else if (body.operation === 'verifyIdentityDemo') {
    if (!currentLegalAcceptance(viewer.legalAcceptance) || viewer.goals.length === 0) throw new CommunityError(409, 'Completa primero los consentimientos y tus objetivos.');
    viewer.kycStatus = 'VERIFIED';
    viewer.identityVerified = true;
  } else {
    throw new CommunityError(400, 'Operación no válida.');
  }
  return communitySnapshot(viewer, chatSessionId);
}

function profileFor(id: string, viewer: Viewer): SocialProfile {
  const channel = channels.find(item => item.id === id);
  const member = store.viewers.get(id);
  if (!channel && (!member || (member.id !== viewer.id && (member.visibility !== 'PUBLIC' || member.kycStatus !== 'VERIFIED')))) throw new CommunityError(404, 'Este perfil no está disponible.');
  return { id, name: channel?.name ?? member!.label, focus: channel?.focus ?? member!.goals.join(' · '), demo: true, following: viewer.subscriptions.has(id), followersCount: followers.get(id)?.size ?? 0, followingCount: member?.subscriptions.size ?? 0, friend: viewer.subscriptions.has(id) && !!member?.subscriptions.has(viewer.id) };
}

export function setFollowUser(viewer: Viewer, targetId: string, following: boolean) {
  if (viewer.id === targetId) throw new CommunityError(400, 'No puedes seguirte a ti mismo.');
  // Unfollowing remains possible when a previously public member goes private.
  if (following || !viewer.subscriptions.has(targetId)) profileFor(targetId, viewer);
  if (!followers.has(targetId)) followers.set(targetId, new Set());
  if (following) { viewer.subscriptions.add(targetId); followers.get(targetId)!.add(viewer.id); }
  else { viewer.subscriptions.delete(targetId); followers.get(targetId)!.delete(viewer.id); }
}

export function getFollowers(viewer: Viewer, targetId: string, offset = 0): FollowersView {
  profileFor(targetId, viewer);
  if (!Number.isSafeInteger(offset) || offset < 0) throw new CommunityError(400, 'Página no válida.');
  const all = [...(followers.get(targetId) ?? [])];
  const publicIds = all.filter(id => id === viewer.id || (store.viewers.get(id)?.visibility === 'PUBLIC' && store.viewers.get(id)?.kycStatus === 'VERIFIED'));
  const ids = publicIds.slice(offset, offset + 20);
  return { total: all.length, profiles: ids.map(id => profileFor(id, viewer)), nextOffset: offset + 20 < publicIds.length ? offset + 20 : null };
}

export function socialSnapshot(viewer: Viewer, chatSessionId?: string): SocialSnapshot {
  const priorities = learningPlan(viewer.goals, chatSessionId).focus.map(item => item.topic);
  const channelTopic: Record<string, string> = { 'nora-vega': 'Fondos', 'leo-solis': 'Gestionar dinero', 'alma-rios': 'Riesgo' };
  const creators = channels.map(item => profileFor(item.id, viewer)).sort((a, b) => Number(a.following) - Number(b.following) || Number(priorities.includes(channelTopic[b.id] as CommunityTopic)) - Number(priorities.includes(channelTopic[a.id] as CommunityTopic)));
  const members = [...store.viewers.values()].filter(item => item.id !== viewer.id && item.visibility === 'PUBLIC' && item.kycStatus === 'VERIFIED').slice(0, 40).map(item => profileFor(item.id, viewer));
  return { me: profileFor(viewer.id, viewer), creators, members, csrfToken: viewer.csrfToken };
}
