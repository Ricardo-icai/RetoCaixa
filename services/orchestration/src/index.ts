import { randomUUID } from 'node:crypto';
import type { AgentRun, Language, Session, Turn } from './contracts.ts';
import { interpret, type LanguageProvider } from './provider.ts';
import { agentContracts, updateProfile, evaluateAgents } from './agents.ts';
import { decide } from '../../../packages/decision-engine/src/profile.ts';
import { explain } from './responses.ts';
import { greeting, question } from './questions.ts';

export function createSession(language: Language = 'es', now = Date.now()): Session {
  return { id: randomUUID(), profile: {}, provenance: {}, language, pending: 'goal', updatedAt: now, revision: 0, simulatedBalance: 0, executedRecommendations: [], messages: [{ id: randomUUID(), role: 'assistant', text: greeting(language), timestamp: new Date(now).toISOString() }] };
}

export async function runTurn(previous: Session, text: string, options: { provider?: LanguageProvider; now?: number; language?: Language } = {}): Promise<Turn> {
  const session = structuredClone(previous);
  const now = options.now ?? Date.now();
  const timestamp = new Date(now).toISOString();
  session.language = options.language ?? session.language;
  const runs: AgentRun[] = [];
  const start = performance.now();
  const { extraction, mode } = await interpret(text, session, options.provider);
  runs.push({ id: 'voice-language', status: extraction.uncertain ? 'blocked' : 'ok', output: extraction, durationMs: performance.now() - start });
  updateProfile(session, extraction, timestamp);
  runs.push({ id: 'profile', status: 'ok', output: { profile: session.profile, provenance: session.provenance, revision: session.revision + 1 }, durationMs: 0 });
  const evaluation = await evaluateAgents(session, extraction, runs, now);
  const decision = decide(session.profile, { missing: evaluation.quality.missing, stale: evaluation.quality.stale.length > 0, uncertain: !!extraction.uncertain, intent: extraction.intent, compliancePassed: evaluation.compliance.demoPassed }, evaluation.capacity, evaluation.risk);
  runs.push({ id: 'decision-engine', status: decision.action === 'INVEST' ? 'ok' : 'blocked', output: decision, durationMs: 0 });
  session.pending = evaluation.quality.stale[0] ?? evaluation.quality.missing[0];
  let reply: ReturnType<typeof explain> | { text: string; advice?: undefined };
  if (decision.action === 'ASK_CLARIFICATION') {
    const field = session.pending ?? previous.pending;
    const prefix = session.language === 'es'
      ? extraction.uncertain ? 'No he podido interpretar ese dato con seguridad. ' : evaluation.quality.stale.length ? 'Vamos a actualizar ese dato. ' : Object.keys(extraction.facts).length ? 'Lo tengo. ' : 'Para orientarte necesito conocer un poco más tu situación. '
      : extraction.uncertain ? 'I could not interpret that reliably. ' : evaluation.quality.stale.length ? 'Let’s update that information. ' : Object.keys(extraction.facts).length ? 'Got it. ' : 'I need a little more information about your situation. ';
    reply = { text: prefix + (field ? question(field, session.language) : session.language === 'es' ? '¿Qué dato quieres revisar?' : 'Which detail would you like to review?') };
  } else {
    reply = explain(decision, session.language, extraction.topic ?? text);
    // Education and caution do not lose the onboarding context. Never ask multiple questions.
    if (session.pending && !['human', 'market_unavailable'].includes(decision.reason)) reply.text += '\n\n' + question(session.pending, session.language);
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
