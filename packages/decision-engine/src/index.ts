import type { CopilotMessageResponse } from '@copilot/types';

export interface UserFinancialSnapshot {
  monthlyIncome: number;
  essentialExpenses: number;
  emergencyBufferMonths: number;
  riskToleranceScore: number;
  riskCapacityScore: number;
  goalHorizonMonths: number;
  availableInvestableCash: number;
  hasHighCostDebt: boolean;
}

export class InvestmentDecisionEngine {
  public static evaluateUserSnapshot(snapshot: UserFinancialSnapshot): CopilotMessageResponse {
    
    const invalid = Object.entries(snapshot).some(([key, value]) =>
      key !== 'hasHighCostDebt' && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    ) || typeof snapshot.hasHighCostDebt !== 'boolean'
      || snapshot.riskToleranceScore > 100 || snapshot.riskCapacityScore > 100
      || ['monthlyIncome', 'essentialExpenses', 'emergencyBufferMonths', 'riskToleranceScore', 'riskCapacityScore', 'goalHorizonMonths', 'availableInvestableCash'].some(key => !(key in snapshot));
    if (invalid) {
      return {
        messageId: `REC-${Date.now()}`, timestamp: new Date().toISOString(),
        kaiState: 'SPEAKING_EDUCATIONAL', directAnswer: 'Necesito revisar los datos antes de proponerte una inversión.',
        whyReasons: ['El perfil contiene información incompleta o inválida.'],
        riskStatement: 'No se puede evaluar el riesgo con estos datos.', recommendedAction: 'ASK_CLARIFICATION',
        primaryCTA: { label: 'Revisar perfil', actionType: 'REVIEW_PROFILE' }, hasLearnMore: false
      };
    }
    const investableAmount = Math.min(snapshot.availableInvestableCash, Math.max(0, snapshot.monthlyIncome - snapshot.essentialExpenses));
    // LAYER 1: HARD SAFETY CONSTRAINTS (PROTECT MODE)
    if (snapshot.hasHighCostDebt || snapshot.emergencyBufferMonths < 3) {
      return {
        messageId: `REC-${Date.now()}`,
        timestamp: new Date().toISOString(),
        kaiState: 'BUFFER_REST_PROTECT',
        directAnswer: "I wouldn't invest this money right now. Let's build your financial safety buffer first.",
        whyReasons: [
          "An emergency cushion protects you against unexpected life expenses.",
          "High-cost obligations take financial priority over volatile market assets.",
          "Investing without liquidity forces you to sell investments at bad moments."
        ],
        riskStatement: "Investing right now could compromise your daily financial liquidity.",
        recommendedAction: 'PROTECT',
        primaryCTA: {
          label: "Strengthen Safety Buffer",
          actionType: "NAVIGATE_SAVINGS"
        },
        hasLearnMore: true,
        learnMoreSnippet: "Keeping 3 to 6 months of essential living expenses safe builds true financial freedom."
      };
    }

    const effectiveRisk = Math.min(snapshot.riskToleranceScore, snapshot.riskCapacityScore);

    // LAYER 2: SUITABLE INVESTMENT ACTION
    if (snapshot.goalHorizonMonths >= 60 && effectiveRisk >= 40 && investableAmount >= 10) {
      return {
        messageId: `REC-${Date.now()}`,
        timestamp: new Date().toISOString(),
        kaiState: 'SPEAKING_SERENE',
        directAnswer: `I'd put €${investableAmount} into your long-term diversified global plan.`,
        whyReasons: [
          "Your target timeline gives your money enough time to compound.",
          "Your current capacity allows this contribution without squeezing daily expenses.",
          "Your emergency cushion is intact and fully protected."
        ],
        riskStatement: "The short-term value of your investment may fluctuate.",
        recommendedAction: 'INVEST',
        primaryCTA: {
          label: `Invest €${investableAmount}`,
          actionType: "EXECUTE_INVESTMENT",
          payload: { amount: investableAmount }
        },
        hasLearnMore: true,
        learnMoreSnippet: "Global index allocations spread your risk across thousands of companies worldwide."
      };
    }

    // DEFAULT ACTION: KEEP / HOLD
    return {
      messageId: `REC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      kaiState: 'SPEAKING_SERENE',
      directAnswer: "I'd keep things exactly as they are today.",
      whyReasons: [
        "This demo has not established a suitable new investment for these inputs.",
        "Your goal, available cash and risk limits need to support any new contribution."
      ],
      riskStatement: "Existing investments can still lose value; this demo has not assessed your portfolio.",
      recommendedAction: 'KEEP',
      primaryCTA: {
        label: "Keep Current Strategy",
        actionType: "DISMISS"
      },
      hasLearnMore: false
    };
  }
}