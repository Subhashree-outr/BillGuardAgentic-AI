import { dbHelpers } from '../db';
import { savings_calculator_tool } from '../tools';
import { AgentRunState } from '../types';
import { WorkflowOptions } from './contracts';
import { logAgentEvent } from './events';

export async function runEvaluationAgent(runId: string, state: AgentRunState, options: WorkflowOptions) {
  const result = savings_calculator_tool(state.actions);
  const target = state.user_goal.target_amount;
  const gap = Math.max(0, target - result.total_monthly_savings);
  state.evaluation = { goal_achieved: gap === 0, target_savings: target, projected_savings: result.total_monthly_savings, currency: state.user_goal.currency, gap, remaining_anomalies_count: state.detected_issues.length, replanning_needed: gap > 0, reason: gap > 0 ? `The plan needs ${state.user_goal.currency} ${gap.toFixed(2)} more monthly savings.` : 'Target achieved.' };
  logAgentEvent(options, { run_id: runId, event_type: 'evaluation', agent_name: 'Evaluation Agent', tool_name: 'savings_calculator_tool', status: gap ? 'warning' : 'success', summary: `Projected monthly savings: ${result.total_monthly_savings}; target: ${target}.` });
  dbHelpers.saveAgentRun(state);
  return state.evaluation;
}
