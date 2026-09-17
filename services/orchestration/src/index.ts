import { acknowledgement, contextualQuestion, purchaseReply } from './dialogue.ts';
import { randomUUID } from 'node:crypto';
import type { AgentRun, Extraction, Language, Profile, Session, Turn } from './contracts.ts';
import { interpret, type LanguageProvider } from './provider.ts';
import { agentContracts, updateProfile, evaluateAgents } from './agents.ts';
import { decide } from '../../../packages/decision-engine/src/profile.ts';
import { explain } from './responses.ts';
import { greeting, question } from './questions.ts';
import { updateLearningContext } from './learning.ts';
import { preferenceUpdates, CatalogueContentAgent, UnverifiedCreatorAgent, BehaviouralPsychologyAgent } from './social.ts';
import { tagLabels, type BehaviourMemory, type ContentContext, type EngagementEvent, type InterestTag } from '../../../packages/types/src/social.ts';
import { financialCapacity } from '../../../packages/decision-engine/src/profile.ts';

export function createSession(language: Language = 'es', now = Date.now()): Session {
  return { id: randomUUID(), profile: {}, provenance: {}, language, pending: 'goal', updatedAt: now, revision: 0, simulatedBalance: 0, executedRecommendations: [], messages: [{ id: randomUUID(), role: 'assistant', text: greeting(language), timestamp: new Date(now).toISOString() }] };
}

export async function runTurn(previous: Session, text: string, options: { provider?: LanguageProvider; now?: number; language?: Language; declaredFacts?: Profile } = {}): Promise<Turn> {
  const session = structuredClone(previous);
  const now = options.now ?? Date.now();
  const timestamp = new Date(now).toISOString();
  session.language = options.language ?? session.language;
  const runs: AgentRun[] = [];
  const start = performance.now();
  const preferences = options.declaredFacts ? {} : preferenceUpdates(text);
  // Structured onboarding facts are validated by the server before entering this path.
  const { extraction, mode }: { extraction: Extraction; mode: Turn['provider'] } = options.declaredFacts
    ? { extraction: { facts: options.declaredFacts, intent: 'profile' as const }, mode: 'demo' as const }
    : await interpret(text, session, options.provider);
  runs.push({ id: 'voice-language', status: extraction.uncertain ? 'blocked' : 'ok', output: extraction, durationMs: performance.now() - start });
  updateProfile(session, extraction, timestamp);
  if (Object.keys(preferences).length) session.feedPreferences = { ...session.feedPreferences, ...preferences };
  runs.push({ id: 'profile', status: 'ok', output: { profile: session.profile, provenance: session.provenance, revision: session.revision + 1,
    ...(Object.keys(preferences).length ? { event: { type: 'USER_PREFERENCE_UPDATE', preferences } } : {}) }, durationMs: 0 });
  const evaluation = await evaluateAgents(session, extraction, runs, now);
  session.learning = updateLearningContext(session.learning, extraction, session.profile, evaluation.capacity);
  const decision = decide(session.profile, { missing: evaluation.quality.missing, stale: evaluation.quality.stale.length > 0, uncertain: !!extraction.uncertain, intent: Object.keys(preferences).length ? 'education' : extraction.intent, compliancePassed: evaluation.compliance.demoPassed }, evaluation.capacity, evaluation.risk);
  runs.push({ id: 'decision-engine', status: decision.action === 'INVEST' ? 'ok' : 'blocked', output: decision, durationMs: 0 });
  session.pending = evaluation.quality.stale[0] ?? evaluation.quality.missing[0];
  let reply: ReturnType<typeof explain> | { text: string; advice?: undefined };
  if (decision.action === 'ASK_CLARIFICATION') {
    const field = session.pending ?? previous.pending;
    const prefix = session.language === 'es'
      ? extraction.uncertain ? 'No he podido interpretar ese dato con seguridad. ' : evaluation.quality.stale.length ? 'Vamos a actualizar ese dato. ' : acknowledgement(extraction, session, previous)
      : extraction.uncertain ? 'I could not interpret that reliably. ' : evaluation.quality.stale.length ? 'Let’s update that information. ' : acknowledgement(extraction, session, previous);
    reply = { text: prefix + (field ? contextualQuestion(field, session) : session.language === 'es' ? '¿Qué dato quieres revisar?' : 'Which detail would you like to review?') };
  } else if (decision.reason === 'purchase_plan') {
    reply = { text: purchaseReply(session) };
  } else {
    reply = explain(decision, session.language, extraction.topic ?? text);
    // Education and caution do not lose the onboarding context. Never ask multiple questions.
    if (session.pending && !['human', 'market_unavailable'].includes(decision.reason)) reply.text += '\n\n' + contextualQuestion(session.pending, session);
  }
  if (Object.keys(preferences).length) {
    const acknowledgement = Object.entries(preferences).map(([tag, value]) => session.language === 'es'
      ? `${value === 'hide' ? 'Ocultaré' : 'Volveré a incluir'} el contenido etiquetado como ${tagLabels[tag as InterestTag]} en tu feed.`
      : `I will ${value === 'hide' ? 'hide' : 'include again'} content tagged ${tag} in your feed.`).join(' ');
    reply = { ...reply, text: acknowledgement + (decision.action === 'PROTECT' || decision.action === 'WAIT' ? '\n\n' + reply.text : '') };
  }
  runs.push({ id: 'experience-education', status: 'ok', output: reply, durationMs: 0 });
  const missingAgents = (Object.keys(agentContracts) as AgentRun['id'][]).filter(id => !runs.some(run => run.id === id));
  if (missingAgents.length) throw new Error(`Incomplete agent orchestration: ${missingAgents.join(', ')}`);
  session.messages.push({ id: randomUUID(), role: 'user', text, timestamp }, { id: randomUUID(), role: 'assistant', timestamp, ...reply });
  session.messages = session.messages.slice(-80);
  session.updatedAt = now;
  session.revision += 1;
  return { session, provider: mode, trace: { id: randomUUID(), timestamp, runs, action: decision.action, provider: mode } };
}

export class MultiAgentOrchestrator {
  private content = new CatalogueContentAgent();
  private trust = new UnverifiedCreatorAgent();
  private behaviour = new BehaviouralPsychologyAgent();

  async processUserInteraction(session: Session, event: { type: 'CHAT_MESSAGE'; text: string }, options?: Parameters<typeof runTurn>[2]): Promise<Turn>;
  async processUserInteraction(session: Session | undefined, event: EngagementEvent, options: { memory: BehaviourMemory; content: ContentContext; excluded: InterestTag[] }): Promise<{ affinities: BehaviourMemory['affinities']; content: Awaited<ReturnType<CatalogueContentAgent['analyse']>>; trust: Awaited<ReturnType<UnverifiedCreatorAgent['evaluate']>>; action: 'PROTECT' | 'LEARN'; realExecutionAllowed: false }>;
  async processUserInteraction(session: Session | undefined, event: EngagementEvent | { type: 'CHAT_MESSAGE'; text: string }, options: Parameters<typeof runTurn>[2] | { memory: BehaviourMemory; content: ContentContext; excluded: InterestTag[] } = {}) {
    if (event.type === 'CHAT_MESSAGE') {
      if (!session) throw new Error('Chat session required');
      return runTurn(session, event.text, options as Parameters<typeof runTurn>[2]);
    }
    if (!('memory' in options)) throw new Error('Validated engagement context required');
    const [content, trust, affinities] = await Promise.all([
      this.content.analyse(options.content), this.trust.evaluate(options.content),
      this.behaviour.observe(options.memory, event, options.content.tags, options.excluded),
    ]);
    const capacity = financialCapacity(session?.profile ?? {});
    return { affinities, content, trust, action: session?.profile.highCostDebt || capacity.protect ? 'PROTECT' as const : 'LEARN' as const, realExecutionAllowed: false as const };
  }
}
