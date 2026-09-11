export type FindingType =
  | 'duplicate_charge'
  | 'price_increase'
  | 'forgotten_subscription'
  | 'unusual_spending'
  | 'upcoming_renewal';

export type AgentRole =
  | 'bill_analyzer'
  | 'fraud_anomaly'
  | 'subscription_agent'
  | 'investigation_agent'
  | 'action_agent'
  | 'evaluation_agent';

export interface DecisionTrace {
  decision: string;
  evidence: string;
  confidence: number;
  agent: AgentRole;
  agent_name: string;
  next_action: string;
  requires_approval: boolean;
  tool_used?: string;
  tool_failure?: boolean;
  recovery_strategy?: string;
}

export interface Finding {
  id?: string;
  type: FindingType;
  title: string;
  merchant: string;
  amount: number | string;
  currency?: string;
  date?: string;
  previous_amount?: number | string;
  increase_percentage?: number | string;
  confidence_score: number; // e.g. 0.95 or 95
  explanation: string;
  evidence: string;
  renewal_date?: string;
  category?: string;
  decision_trace?: DecisionTrace;
  is_essential?: boolean;
}

export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ActionPlanItem {
  id?: string;
  priority: ActionPriority;
  action: string;
  target_merchant?: string;
  estimated_savings?: string;
  estimated_monthly_value?: number;
  deadline?: string;
  recommended_steps: string[];
  requires_approval?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected' | 'simulated';
  simulation_result?: string;
  generated_draft?: string;
}

export interface BillingSummary {
  total_transactions_analyzed?: number;
  total_spent_analyzed?: number | string;
  potential_monthly_savings?: number | string;
  potential_annual_savings?: number | string;
  duplicates_detected_count?: number;
  price_increases_detected_count?: number;
  forgotten_subscriptions_count?: number;
  unusual_charges_count?: number;
  upcoming_renewals_count?: number;
  analysis_date?: string;
  currency_symbol?: string;
  [key: string]: any;
}

export type AgentLoopPhase =
  | 'goal'
  | 'observe'
  | 'plan'
  | 'decide'
  | 'act'
  | 'evaluate'
  | 'adapt'
  | 'outcome';

export interface AgentStepLog {
  id: string;
  phase: AgentLoopPhase;
  phase_label: string;
  agent: AgentRole;
  agent_name: string;
  agent_avatar: string;
  description: string;
  detail: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'failed' | 'adapted';
  tool_interaction?: {
    tool_name: string;
    status: 'success' | 'failed';
    error_message?: string;
    fallback_applied?: string;
  };
}

export interface AutopilotGoal {
  target_monthly_savings: number;
  currency: string;
  user_prompt: string;
  constraints: string[]; // e.g., ["Cannot cancel Chegg Study (needed for work)", "Keep Telecom plan"]
  achieved_savings: number;
  status: 'in_progress' | 'target_met' | 'replan_needed' | 'exceeded';
  replanning_active?: boolean;
  replan_count?: number;
}

export interface BillGuardReport {
  summary: BillingSummary;
  findings: Finding[];
  action_plan: ActionPlanItem[];
  user_message: string;
  agent_loop_logs?: AgentStepLog[];
  autopilot_goal?: AutopilotGoal;
}

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  format: 'csv' | 'json' | 'text';
  content: string;
  suggested_goal?: number;
  currency?: string;
}

