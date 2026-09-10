export type KaiVisualState = 
  | 'IDLE_LISTENING'
  | 'THINKING_AGENT_PROCESSING'
  | 'SPEAKING_SERENE'
  | 'SPEAKING_EDUCATIONAL'
  | 'PROTECTIVE_SHIELD'
  | 'CELEBRATION_MILESTONE'
  | 'BUFFER_REST_PROTECT';

export type CopilotActionType = 
  | 'INVEST' 
  | 'KEEP' 
  | 'WAIT' 
  | 'REDUCE' 
  | 'REBALANCE' 
  | 'LEARN' 
  | 'ASK_CLARIFICATION' 
  | 'PROTECT';

export interface CopilotMessageResponse {
  messageId: string;
  timestamp: string;
  kaiState: KaiVisualState;
  directAnswer: string;
  whyReasons: string[];
  riskStatement: string;
  recommendedAction: CopilotActionType;
  primaryCTA: {
    label: string;
    actionType: string;
    payload?: Record<string, unknown>;
  };
  marketPulseContext?: {
    headline: string;
    impactLevel: 'low' | 'medium' | 'high';
    userImpactExplanation: string;
  };
  hasLearnMore: boolean;
  learnMoreSnippet?: string;
}