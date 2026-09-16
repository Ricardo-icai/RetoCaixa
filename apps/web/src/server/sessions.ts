import { randomUUID } from 'node:crypto';
import { createSession, runTurn } from '../../../../services/orchestration/src/index.ts';
import { evaluateAgents } from '../../../../services/orchestration/src/agents.ts';
import { decide } from '../../../../packages/decision-engine/src/profile.ts';
import type { Language, PublicSession, SavedConversation, Session, Trace } from '../../../../packages/types/src/conversation.ts';

export type Entry = { session: Session; csrfToken: string; traces: Trace[]; provider: Trace['provider']; busy: boolean; requests: number[]; savedConversations: SavedConversation[] };
const globalSessions = globalThis as typeof globalThis & { kaiSessions?: Map<string, Entry> };
const sessions = globalSessions.kaiSessions ??= new Map<string, Entry>();
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getSession(id?: string, language: Language = 'es'): Entry {
  const now = Date.now();
  for (const [key, entry] of sessions) if (!entry.busy && now - entry.session.updatedAt > 24 * 60 * 60 * 1000) sessions.delete(key);
  if (id && sessions.has(id)) return sessions.get(id)!;
  if (sessions.size >= 1000) throw new HttpError(503, 'La demo está ocupada. Inténtalo más tarde.');
  const session = createSession(language);
  const entry: Entry = { session, csrfToken: randomUUID(), traces: [], provider: 'demo', busy: false, requests: [], savedConversations: [] };
  sessions.set(session.id, entry);
  return entry;
}

// Reading recommendations must not create a chat, refresh its lifetime or expose it.
export function findSession(id?: string, now = Date.now()): Entry | undefined {
  const entry = id ? sessions.get(id) : undefined;
  if (!entry || now - entry.session.updatedAt > 24 * 60 * 60 * 1000) return undefined;
  return entry;
}
export function publicSession(entry: Entry): PublicSession {
  const { messages, profile, pending, language, revision, simulatedBalance, executedRecommendations } = entry.session;
  entry.savedConversations ??= [];
  return { messages, profile, pending, language, revision, simulatedBalance, executedRecommendations, savedConversations: entry.savedConversations, provider: entry.provider, demo: true, csrfToken: entry.csrfToken };
}

export async function mutate(entry: Entry, body: Record<string, unknown>) {
  if (entry.busy) throw new HttpError(409, 'Espera a que termine la respuesta anterior.');
  if (body.revision !== entry.session.revision) throw new HttpError(409, 'La conversación ha cambiado. Actualízala antes de continuar.');
  const now = Date.now();
  entry.requests = entry.requests.filter(time => now - time < 60000);
  if (entry.requests.length >= 30) throw new HttpError(429, 'Has enviado muchos mensajes. Espera un minuto.');
  entry.requests.push(now);
  entry.busy = true;
  try {
    const language = body.language === 'en' ? 'en' : body.language === 'es' ? 'es' : entry.session.language;
    if (body.operation === 'reset') {
      const fresh = createSession(language);
      entry.session = { ...fresh, id: entry.session.id, revision: entry.session.revision + 1 };
      entry.traces = [];
      entry.provider = 'demo';
      return;
    }
    if (body.operation === 'save') {
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title || title.length > 60) throw new HttpError(400, 'Escribe un título de entre 1 y 60 caracteres.');
      if (!entry.session.messages.some(message => message.role === 'user')) throw new HttpError(400, 'Escribe al menos un mensaje antes de guardar la conversación.');
      entry.savedConversations ??= [];
      if (entry.savedConversations.length >= 10) throw new HttpError(409, 'Puedes guardar hasta 10 conversaciones. Elimina una para continuar.');
      const savedAt = new Date(now).toISOString();
      entry.savedConversations.unshift({
        id: randomUUID(), title, savedAt,
        createdAt: entry.session.messages[0]?.timestamp ?? savedAt,
        messages: structuredClone(entry.session.messages),
        profile: structuredClone(entry.session.profile),
        simulatedBalance: entry.session.simulatedBalance,
        learning: entry.session.learning ? structuredClone(entry.session.learning) : undefined,
      });
      const fresh = createSession(language, now);
      entry.session = { ...fresh, id: entry.session.id, revision: entry.session.revision + 1 };
      entry.traces = [];
      entry.provider = 'demo';
      return;
    }
    if (body.operation === 'deleteSaved') {
      if (typeof body.savedConversationId !== 'string') throw new HttpError(400, 'Conversación guardada no válida.');
      entry.savedConversations ??= [];
      const index = entry.savedConversations.findIndex(conversation => conversation.id === body.savedConversationId);
      if (index < 0) throw new HttpError(404, 'La conversación guardada no existe.');
      entry.savedConversations.splice(index, 1);
      entry.session.revision += 1;
      entry.session.updatedAt = now;
      return;
    }
    if (body.operation === 'message') {
      if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 2000) throw new HttpError(400, 'Escribe un mensaje de entre 1 y 2000 caracteres.');
      const turn = await runTurn(entry.session, body.text.trim(), { language });
      entry.session = turn.session;
      entry.provider = turn.provider;
      entry.traces = [...entry.traces, turn.trace].slice(-30);
      return;
    }
    if (body.operation === 'simulate') {
      const latest = entry.session.messages.at(-1);
      if (!latest || latest.id !== body.recommendationId || latest.advice?.action !== 'INVEST' || body.confirmed !== true || entry.session.executedRecommendations.includes(latest.id)) throw new HttpError(409, 'La propuesta ya no está disponible. Pide a KAI que revise tu situación.');
      const evaluation = await evaluateAgents(entry.session, { facts: {}, intent: 'advice' }, [], now);
      const decision = decide(entry.session.profile, { missing: evaluation.quality.missing, stale: evaluation.quality.stale.length > 0, uncertain: false, intent: 'advice', compliancePassed: evaluation.compliance.demoPassed }, evaluation.capacity, evaluation.risk);
      if (decision.action !== 'INVEST' || decision.amount !== latest.advice.amount) throw new HttpError(409, 'La propuesta necesita una nueva revisión.');
      const amount = decision.amount!;
      entry.session.simulatedBalance = (Math.round(entry.session.simulatedBalance * 100) + Math.round(amount * 100)) / 100;
      entry.session.executedRecommendations.push(latest.id);
      entry.session.messages.push({ id: randomUUID(), role: 'assistant', timestamp: new Date(now).toISOString(), text: language === 'es' ? `Has simulado una aportación de ${amount.toFixed(2)} €. No se ha movido dinero real. Hemos descontado este importe del presupuesto de esta sesión.` : `You simulated a €${amount.toFixed(2)} contribution. No real money moved. This amount has been deducted from this session’s budget.` });
      entry.session.revision += 1;
      entry.session.updatedAt = now;
      return;
    }
    throw new HttpError(400, 'Operación no válida.');
  } finally { entry.busy = false; }
}
