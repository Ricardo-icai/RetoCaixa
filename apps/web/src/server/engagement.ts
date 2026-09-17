import { randomUUID } from 'node:crypto';
import { MultiAgentOrchestrator } from '../../../../services/orchestration/src/index.ts';
import { contentTags, type EngagementEvent } from '../../../../packages/types/src/social.ts';
import { CommunityError, catalogueReel, type Viewer } from './community.ts';
import { currentLegalAcceptance, legalVersions } from '../legal/policy.ts';
import { activeBehaviour, personalizationStatus } from './personalization.ts';
import { findSession } from './sessions.ts';

const orchestrator = new MultiAgentOrchestrator();
const processing = new WeakSet<Viewer>();

export async function processEngagement(viewer: Viewer, body: Record<string, unknown>, sessionId?: string, now = Date.now()) {
  if (body.operation === 'consent') {
    if (typeof body.enabled !== 'boolean') throw new CommunityError(400, 'Elige activar o desactivar la personalización.');
    if (!body.enabled) { delete viewer.behaviour; return personalizationStatus(viewer, sessionId); }
    if (!currentLegalAcceptance(viewer.legalAcceptance) || body.privacyVersion !== legalVersions.privacy) throw new CommunityError(409, 'Revisa primero la información de privacidad vigente.');
    if (!activeBehaviour(viewer, now)) {
      const memory = { enabled: true, consentVersion: legalVersions.privacy, consentedAt: now, expiresAt: now + 86400000, affinities: {}, seen: [], lastEvents: [], postCounts: {} };
      viewer.behaviour = memory;
      setTimeout(() => { if (viewer.behaviour === memory) delete viewer.behaviour; }, Math.max(0, memory.expiresAt - Date.now())).unref();
    }
    return personalizationStatus(viewer, sessionId);
  }
  if (body.operation === 'restorePreferences') {
    const entry = findSession(sessionId);
    if (entry?.busy) throw new CommunityError(409, 'Espera a que KAI termine su respuesta.');
    if (entry) { entry.session.feedPreferences = {}; entry.session.revision += 1; }
    return personalizationStatus(viewer, sessionId);
  }
  if (body.operation !== 'engagement') throw new CommunityError(400, 'Operación no válida.');
  const memory = activeBehaviour(viewer, now);
  if (!memory) throw new CommunityError(403, 'La personalización por visualizaciones está desactivada.');
  if (typeof body.eventId !== 'string' || !/^[\da-f-]{36}$/i.test(body.eventId) || typeof body.postId !== 'string'
    || typeof body.watchTimeMs !== 'number' || !Number.isFinite(body.watchTimeMs) || body.watchTimeMs < 4000 || body.watchTimeMs > 120000
    || typeof body.completionRate !== 'number' || !Number.isFinite(body.completionRate) || body.completionRate < 0 || body.completionRate > 1) throw new CommunityError(400, 'Evento no válido.');
  const reel = catalogueReel(body.postId);
  if (!reel) throw new CommunityError(404, 'El reel no está disponible.');
  if (memory.seen.includes(body.eventId)) return { accepted: false, duplicate: true };
  memory.lastEvents = memory.lastEvents.filter(time => now - time < 60000);
  if (processing.has(viewer) || memory.lastEvents.length >= 15) throw new CommunityError(429, 'Demasiados eventos.');
  // Limit the influence of loops, reloads and repeated views of the same sample.
  if ((memory.postCounts[reel.id] ?? 0) >= 3) return { accepted: false, limited: true };
  processing.add(viewer);
  try {
    const event: EngagementEvent = { type: 'USER_ENGAGEMENT_EVENT', eventId: body.eventId, postId: reel.id, watchTimeMs: body.watchTimeMs, completionRate: body.completionRate };
    const output = await orchestrator.processUserInteraction(findSession(sessionId)?.session, event, {
      memory, content: { id: reel.id, title: reel.title, text: reel.text, tags: contentTags(reel), demo: true },
      excluded: personalizationStatus(viewer, sessionId).excludedTags,
    });
    if (activeBehaviour(viewer, now) !== memory) throw new CommunityError(403, 'La personalización se ha desactivado.');
    memory.affinities = output.affinities;
    memory.seen = [...memory.seen, event.eventId].slice(-200);
    memory.lastEvents.push(now);
    memory.postCounts[reel.id] = (memory.postCounts[reel.id] ?? 0) + 1;
    return { accepted: true, id: randomUUID() };
  } finally { processing.delete(viewer); }
}
