import type { Viewer } from './community.ts';
import { currentLegalAcceptance, legalVersions } from '../legal/policy.ts';
import { findSession } from './sessions.ts';
import type { BehaviourMemory, InterestTag } from '../../../../packages/types/src/social.ts';

export function activeBehaviour(viewer: Viewer, now = Date.now()): BehaviourMemory | undefined {
  const memory = viewer.behaviour;
  if (!memory) return;
  if (!memory.enabled || memory.expiresAt <= now || memory.consentVersion !== legalVersions.privacy || !currentLegalAcceptance(viewer.legalAcceptance)) {
    delete viewer.behaviour;
    return;
  }
  return memory;
}

export function personalizationStatus(viewer: Viewer, sessionId?: string) {
  const memory = activeBehaviour(viewer);
  return { enabled: !!memory, consentedAt: memory?.consentedAt ?? null, expiresAt: memory?.expiresAt ?? null,
    excludedTags: Object.entries(findSession(sessionId)?.session.feedPreferences ?? {}).filter(([, value]) => value === 'hide').map(([tag]) => tag as InterestTag) };
}
