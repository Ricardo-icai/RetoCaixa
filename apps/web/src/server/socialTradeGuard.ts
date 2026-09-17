import { evaluateAgents } from '../../../../services/orchestration/src/agents.ts';
import { decide } from '../../../../packages/decision-engine/src/profile.ts';
import { currentLegalAcceptance } from '../legal/policy.ts';
import { findSession, HttpError } from './sessions.ts';
import type { Viewer } from './community.ts';
import type { PaperAccount } from './trading.ts';

export async function assertSocialTradeAllowed(viewer: Viewer, account: PaperAccount, sessionId: string | undefined, amount: unknown) {
  if (viewer.kycStatus !== 'VERIFIED' || !currentLegalAcceptance(viewer.legalAcceptance)) throw new HttpError(403, 'Completa tu perfil y revisa las condiciones antes de simular.');
  const entry = findSession(sessionId);
  if (!entry || entry.busy) throw new HttpError(409, 'Revisa primero tu situación financiera con KAI en el chat.');
  const revision = entry.session.revision;
  const evaluation = await evaluateAgents(entry.session, { facts: {}, intent: 'advice' }, [], Date.now());
  if (entry.busy || revision !== entry.session.revision) throw new HttpError(409, 'Tu situación está cambiando. Espera a que KAI termine.');
  const decision = decide(entry.session.profile, { missing: evaluation.quality.missing, stale: evaluation.quality.stale.length > 0, uncertain: false, intent: 'advice', compliancePassed: evaluation.compliance.demoPassed }, evaluation.capacity, evaluation.risk);
  if (decision.action !== 'INVEST') throw new HttpError(409, decision.action === 'PROTECT'
    ? 'KAI prioriza tu colchón y tus deudas. La simulación está bloqueada; revisa tu situación en el chat.'
    : 'KAI necesita revisar tus datos, plazo y riesgo antes de habilitar esta simulación.');
  const spentCents = 1000000 - account.cashCents;
  const availableCents = Math.max(0, Math.round(decision.amount! * 100) - spentCents);
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) > availableCents) throw new HttpError(409, `El importe supera el presupuesto disponible de KAI: ${(availableCents / 100).toFixed(2)} EUR.`);
}
