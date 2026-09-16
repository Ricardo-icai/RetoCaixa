import type { LearningContext, LearningFocus, LearningReason } from '../../../../packages/types/src/conversation.ts';
import type { CommunityPost, CommunitySnapshot, CommunityTopic, InvestorGoal } from '../community/types.ts';
import { findSession } from './sessions.ts';

type Plan = { focus: LearningFocus[]; source: CommunitySnapshot['feed']['source'] };
const goalTopics: Partial<Record<InvestorGoal, CommunityTopic>> = {
  'Gestionar mi dinero': 'Gestionar dinero', 'Crear mi colchón': 'Gestionar dinero',
  'Aprender a invertir': 'Primeros pasos', 'Invertir a largo plazo': 'Fondos', 'Seguir inversores': 'Mercados',
};
const reasons: Record<LearningReason, string> = {
  interest: 'Relacionado con tus preguntas a KAI',
  goal: 'Para avanzar hacia tus objetivos',
  foundation: 'Para reforzar tus bases de inversión',
  protection: 'Para reforzar tu planificación financiera',
  risk: 'Para comprender el riesgo y tomar decisiones con calma',
};

export function learningPlan(goals: InvestorGoal[], sessionId?: string): Plan {
  const ranked = new Map<CommunityTopic, LearningFocus>();
  const add = (focus: LearningFocus) => {
    if (focus.weight > (ranked.get(focus.topic)?.weight ?? 0)) ranked.set(focus.topic, { ...focus });
  };
  for (const goal of goals) if (goalTopics[goal]) add({ topic: goalTopics[goal]!, weight: 4, reason: 'goal' });
  let source: Plan['source'] = ranked.size ? 'onboarding' : 'none';
  function include(context: LearningContext | undefined, weight: number) {
    if (!context) return false;
    const focuses: LearningFocus[] = [
      ...Object.entries(context.interests).map(([topic, score]) => ({ topic: topic as CommunityTopic, weight: score, reason: 'interest' as const })),
      ...context.needs,
    ];
    for (const focus of focuses) add({ ...focus, weight: focus.weight * weight });
    return focuses.some(focus => focus.weight * weight >= 4);
  }
  const entry = findSession(sessionId);
  // A saved conversation is retained memory, but recent conversation takes precedence.
  for (const [index, saved] of (entry?.savedConversations ?? []).entries()) {
    if (include(saved.learning, 0.65 / (1 + index * 0.2))) source = 'saved';
  }
  if (include(entry?.session.learning, 1)) source = 'chat';
  const ordered = [...ranked.values()].sort((a, b) => b.weight - a.weight || a.topic.localeCompare(b.topic));
  // Leave other themes available for discovery even after discussing many topics.
  const threshold = Math.max(4, (ordered[0]?.weight ?? 0) * 0.55);
  const focus = ordered.filter(item => item.weight >= threshold).slice(0, 2);
  return { focus, source: focus.length ? source : 'none' };
}

// Seven goal slots and three discovery slots in each ten, with no repeated posts.
const personalizedSlots = [true, true, false, true, true, false, true, true, true, false];

export function recommendFeed<T extends Pick<CommunityPost, 'id' | 'topic' | 'createdAt' | 'channelId'>>(
  posts: T[], plan: Plan, following: ReadonlySet<string> = new Set(),
): { posts: Array<T & { recommendation: NonNullable<CommunityPost['recommendation']> }>; feed: CommunitySnapshot['feed'] } {
  const focuses = new Map(plan.focus.map(item => [item.topic, item]));
  const unique = [...new Map(posts.map(post => [post.id, post])).values()];
  const personal = unique.filter(post => focuses.has(post.topic));
  const discovery = unique.filter(post => !focuses.has(post.topic));
  const topicUses = new Map<CommunityTopic, number>();
  const creatorUses = new Map<string, number>();
  const selected: Array<T & { recommendation: NonNullable<CommunityPost['recommendation']> }> = [];
  const score = (post: T, personalized: boolean) =>
    (personalized ? focuses.get(post.topic)!.weight : 0) - (topicUses.get(post.topic) ?? 0) * 2
    - (post.channelId ? (creatorUses.get(post.channelId) ?? 0) * 0.5 : 0)
    + (post.channelId && following.has(post.channelId) ? 0.5 : 0);

  while (personal.length || discovery.length) {
    const preferPersonal = personalizedSlots[selected.length % 10] && focuses.size > 0;
    const pool = preferPersonal ? (personal.length ? personal : discovery) : (discovery.length ? discovery : personal);
    const isPersonal = pool === personal;
    pool.sort((a, b) => score(b, isPersonal) - score(a, isPersonal) || Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
    const post = pool.shift()!;
    topicUses.set(post.topic, (topicUses.get(post.topic) ?? 0) + 1);
    if (post.channelId) creatorUses.set(post.channelId, (creatorUses.get(post.channelId) ?? 0) + 1);
    selected.push({ ...post, recommendation: {
      kind: isPersonal ? 'personalized' : 'discovery',
      reason: isPersonal ? reasons[focuses.get(post.topic)!.reason] : 'Un tema distinto para ampliar lo que aprendes',
    } });
  }
  const preview = selected.slice(0, 10);
  const personalized = preview.filter(post => post.recommendation.kind === 'personalized').length;
  return { posts: selected, feed: {
    mode: focuses.size ? 'personalized' : 'discovery', source: plan.source,
    priorityTopics: plan.focus.map(item => item.topic), targetPersonalizedPercent: 70, targetDiscoveryPercent: 30,
    preview: { total: preview.length, personalized, discovery: preview.length - personalized },
    limited: focuses.size > 0 && (preview.length < 10 || personalized !== 7),
  } };
}
