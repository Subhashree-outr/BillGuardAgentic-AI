/**
 * Backend Data Models and Agent Interfaces for BillGuard
 */

export interface User {
  id: string;
  email: string;
  name: string;
  hashed_password?: string;
  currency_preference: string;
  created_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: string;
}

export interface Bill {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  merchant: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  tax: number;
  currency: string;
  category: string;
  is_recurring: boolean;
  raw_content?: string;
  status: 'processed' | 'flagged' | 'pending';
  created_at: string;
  items?: BillItem[];
}

export interface Transaction {
  id: string;
  user_id: string;
  bill_id?: string;
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  is_recurring: boolean;
  status: 'cleared' | 'flagged' | 'disputed';
  note?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  merchant: string;
  plan_name: string;
  category?: string;
  billing_cycle: 'monthly' | 'annual' | 'weekly';
  current_price: number;
  previous_price?: number;
  currency: string;
  renewal_date: string;
  last_active_date: string;
  is_dormant: boolean | number;
  duplicate_group?: string;
  status: 'active' | 'cancelling' | 'cancelled' | 'paused';
  created_at: string;
}

export interface AgentGoal {
  id: string;
  user_id: string;
  title: string;
  target_saving_amount: number;
  currency: string;
  constraints: string[];
  status: 'active' | 'in_progress' | 'achieved' | 'partially_achieved' | 'failed';
  created_at: string;
  updated_at: string;
}

export type AgentPhase =
  | 'OBSERVE'
  | 'PLAN'
  | 'DECIDE'
  | 'USE_TOOLS'
  | 'EXECUTE'
  | 'EVALUATE'
  | 'ADAPT_REPLAN'
  | 'OUTCOME';

export interface AgentRunState {
  run_id: string;
  goal_id: string;
  user_id: string;
  status: 'running' | 'completed' | 'failed' | 'waiting_for_approval' | 'replanning';
  current_phase: AgentPhase;
  user_goal: {
    title: string;
    target_amount: number;
    currency: string;
    constraints: string[];
  };
  observations: Array<{
    category: string;
    summary: string;
    data: any;
    timestamp: string;
  }>;
  current_plan: Array<{
    step: number;
    description: string;
    agent: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }>;
  detected_issues: Array<{
    id: string;
    type: string;
    merchant: string;
    amount: number;
    currency: string;
    severity: 'low' | 'medium' | 'high';
    evidence: string;
    explanation_chain?: string[];
    confidence: number;
  }>;
  selected_tools: Array<{
    tool: string;
    input: any;
    status: 'planned' | 'called' | 'succeeded' | 'failed';
    fallback_used?: boolean;
  }>;
  reasoning_trace: Array<{
    iteration: number;
    observation: string;
    decision: string;
    selected_tool?: string;
    rationale: string;
    confidence: number;
    timestamp: string;
  }>;
  tool_history: Array<{
    tool: string;
    status: 'succeeded' | 'failed';
    summary: string;
    timestamp: string;
  }>;
  next_action?: {
    tool: string;
    rationale: string;
    confidence: number;
  };
  actions: Array<{
    id: string;
    target_merchant: string;
    action_type: 'cancel_subscription' | 'dispute_charge' | 'downgrade_plan' | 'verify_transaction' | 'budget_cap';
    description: string;
    priority: number;
    estimated_saving: number;
    currency: string;
    requires_approval: boolean;
    approval_status: 'pending' | 'approved' | 'rejected' | 'modified';
    execution_status: 'pending' | 'simulated' | 'executed' | 'skipped';
    simulation_result?: string;
    template_letter?: string;
  }>;
  action_results: Array<{
    action_id: string;
    status: string;
    saving_achieved: number;
    feedback?: string;
  }>;
  evaluation: {
    goal_achieved: boolean;
    target_savings: number;
    projected_savings: number;
    currency: string;
    gap: number;
    remaining_anomalies_count: number;
    replanning_needed: boolean;
    reason: string;
  };
  confidence: number;
  errors: Array<{
    timestamp: string;
    tool_or_agent: string;
    error_message: string;
    fallback_action_taken?: string;
  }>;
  replanning_status: {
    is_replanning: boolean;
    replan_count: number;
    previous_plan_savings: number;
    new_plan_savings: number;
    strategy_change: string;
  };
  final_outcome?: {
    summary: string;
    monthly_savings: number;
    annual_savings: number;
    currency: string;
    actions_count: number;
    achieved: boolean;
  };
}

export interface AgentEvent {
  id: string;
  run_id: string;
  timestamp: string;
  event_type: 'goal_set' | 'observe' | 'plan' | 'decision' | 'tool_call' | 'tool_result' | 'error' | 'evaluation' | 'replan' | 'approval_requested' | 'approval_received' | 'action_executed' | 'outcome';
  agent_name: string;
  tool_name?: string;
  status: 'success' | 'warning' | 'error' | 'info';
  summary: string;
  details_json?: any;
}
