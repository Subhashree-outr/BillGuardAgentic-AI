import { dbHelpers, DEFAULT_USER_ID } from '../db';
import {
  budget_analysis_tool,
  subscription_detection_tool,
  transaction_analysis_tool,
} from '../tools';
import { AgentRunState } from '../types';

export interface AgentToolContext {
  userId: string;
  targetSavings: number;
  state: AgentRunState;
}

export interface AgentToolDefinition {
  name: string;
  description: string;
  risk: 'read_only' | 'consequential';
  run: (context: AgentToolContext) => Promise<unknown> | unknown;
}

export const agentToolRegistry: AgentToolDefinition[] = [
  {
    name: 'inspect_bills',
    description: 'Inspect uploaded bills and summarize merchants, totals, recurring status, and line items.',
    risk: 'read_only',
    run: ({ userId }) => dbHelpers.getBills(userId),
  },
  {
    name: 'find_duplicate_charges',
    description: 'Compare the transaction ledger for repeated merchant and amount combinations within 24 hours.',
    risk: 'read_only',
    run: ({ userId }) => transaction_analysis_tool(userId),
  },
  {
    name: 'find_subscription_anomalies',
    description: 'Inspect active subscriptions for dormancy, price increases, and overlapping services.',
    risk: 'read_only',
    run: ({ userId }) => subscription_detection_tool(userId),
  },
  {
    name: 'analyze_discretionary_budget',
    description: 'Estimate available savings from non-essential recurring services against the user goal.',
    risk: 'read_only',
    run: ({ userId, targetSavings }) => budget_analysis_tool(userId, targetSavings),
  },
];

export function getAgentTool(name: string): AgentToolDefinition | undefined {
  return agentToolRegistry.find(tool => tool.name === name);
}

export function describeAgentTools(): string {
  return agentToolRegistry
    .map(tool => `${tool.name}: ${tool.description}`)
    .join('\n');
}

export function defaultToolContext(state: AgentRunState): AgentToolContext {
  return {
    userId: state.user_id || DEFAULT_USER_ID,
    targetSavings: state.user_goal.target_amount,
    state,
  };
}