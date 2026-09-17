import type { AgentId, AgentRun, Extraction, Field, Session } from './contracts.ts';
import { financialCapacity, riskAssessment, demoProduct } from '../../../packages/decision-engine/src/profile.ts';
import { fields, missing } from './questions.ts';

// All fourteen roles from the master's numbered list. Deterministic roles are code, not LLM calls.
export const agentContracts: Record<AgentId, { input: string; output: string; permission: string; failure: string }> = {
  'voice-language': { input: 'message + pending question', output: 'validated facts + intent', permission: 'interpret only', failure: 'clarify' },
  profile: { input: 'validated user facts', output: 'versioned profile + provenance', permission: 'merge user facts', failure: 'clarify' },
  goals: { input: 'profile', output: 'horizon eligibility', permission: 'read profile', failure: 'block' },
  behavioural: { input: 'intent', output: 'cooling-off signal', permission: 'read message', failure: 'wait' },
  'financial-capacity': { input: 'cash flow + reserves', output: 'capacity in euros', permission: 'deterministic arithmetic', failure: 'block' },
  risk: { input: 'tolerance + capacity', output: 'effective ceiling', permission: 'deterministic minimum', failure: 'block' },
  compliance: { input: 'profile + data quality', output: 'demo gate; real execution forbidden', permission: 'veto', failure: 'block' },
  'data-quality': { input: 'profile + timestamps', output: 'missing/stale fields', permission: 'validate', failure: 'clarify' },
  'market-intelligence': { input: 'authorised feed (not configured)', output: 'unavailable + timestamp', permission: 'read only', failure: 'no timing claims' },
  'news-events': { input: 'authorised sources (not configured)', output: 'unavailable + timestamp', permission: 'read only', failure: 'no invented news' },
  quantitative: { input: 'demo cost + proposed amount', output: 'illustrative annual fee', permission: 'deterministic arithmetic', failure: 'block' },
  'portfolio-product': { input: 'declared portfolio + demo catalogue', output: 'demo eligibility; holdings not verified', permission: 'read only', failure: 'no portfolio claims' },
  'decision-engine': { input: 'all gates and evaluations', output: 'action + amount', permission: 'sole proposal authority', failure: 'wait' },
  'experience-education': { input: 'decision + intent + language', output: 'direct answer, reasons, risk, one CTA', permission: 'explain only', failure: 'safe template' },
};

export function updateProfile(session: Session, extraction: Extraction, timestamp: string) {
  if (extraction.uncertain) return;
  if (extraction.facts.goal && session.profile.goal && extraction.facts.goal !== session.profile.goal) {
    for (const field of ['goalAmount', 'goalSavings', 'horizonMonths', 'monthlyContribution'] as const) {
      delete session.profile[field]; delete session.provenance[field];
    }
  }
  Object.assign(session.profile, extraction.facts);
  for (const field of Object.keys(extraction.facts) as Field[]) session.provenance[field] = { source: 'user', updatedAt: timestamp };
}

export function dataQuality(session: Session, now: number) {
  const tracked = [...fields, 'goalAmount', 'goalSavings'] as Field[];
  const stale = tracked.filter(field => session.profile[field] !== undefined && (!session.provenance[field] || now - Date.parse(session.provenance[field]!.updatedAt) > 86400000 || !Number.isFinite(Date.parse(session.provenance[field]!.updatedAt))));
  return { missing: missing(session.profile), stale };
}

export async function evaluateAgents(session: Session, extraction: Extraction, runs: AgentRun[], now: number) {
  const run = async <T>(id: AgentId, fn: () => T, status: AgentRun['status'] = 'ok'): Promise<T> => {
    const start = performance.now();
    const output = fn();
    runs.push({ id, output, status, durationMs: Math.round((performance.now() - start) * 100) / 100 });
    return output;
  };
  const [goals, behaviour, quality, capacity, market, news, portfolio] = await Promise.all([
    run('goals', () => ({ horizonMonths: session.profile.horizonMonths, eligible: session.profile.horizonMonths !== undefined && session.profile.horizonMonths >= demoProduct.horizonMonths })),
    run('behavioural', () => ({ coolingOff: extraction.intent === 'panic' || extraction.intent === 'fomo', intent: extraction.intent })),
    run('data-quality', () => dataQuality(session, now)),
    run('financial-capacity', () => {
      const result = financialCapacity(session.profile);
      // One simulated monthly budget per session. Repeated chat turns cannot spend it twice.
      return { ...result, available: Math.max(0, Math.round((result.available - session.simulatedBalance) * 100) / 100) };
    }),
    run('market-intelligence', () => ({ available: false, source: null, asOf: null, checkedAt: new Date(now).toISOString(), confidence: 0 }), 'unavailable'),
    run('news-events', () => ({ available: false, sources: [], asOf: null, checkedAt: new Date(now).toISOString(), confidence: 0 }), 'unavailable'),
    run('portfolio-product', () => ({ declaredPortfolio: session.profile.portfolio, holdingsVerified: false, product: demoProduct, eligibleForDemo: session.profile.portfolio === 'none' })),
  ]);
  const risk = await run('risk', () => riskAssessment(session.profile, capacity));
  const compliance = await run('compliance', () => ({ demoPassed: quality.missing.length === 0 && quality.stale.length === 0 && !extraction.uncertain, realExecutionAllowed: false, service: 'simulation' }), quality.missing.length || quality.stale.length || extraction.uncertain ? 'blocked' : 'ok');
  const quant = await run('quantitative', () => ({ annualCostPercent: demoProduct.annualCostPercent, illustrativeAnnualCost: Math.round(capacity.available * demoProduct.annualCostPercent) / 100, performanceForecast: null }));
  return { goals, behaviour, quality, capacity, market, news, portfolio, risk, compliance, quant };
}
