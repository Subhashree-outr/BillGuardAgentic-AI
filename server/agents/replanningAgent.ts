import { AgentRunState } from '../types';
import { savings_calculator_tool } from '../tools';
import { WorkflowOptions } from './contracts';
import { logAgentEvent, newAgentId } from './events';
import { buildCandidatePlans, simulateAction } from './simulation';

export async function runReplanningAgent(runId: string, state: AgentRunState, options: WorkflowOptions) {
  const previous = state.evaluation.projected_savings;
  const candidates: AgentRunState['actions'] = [];
  if (!state.actions.some(action => action.target_merchant.includes('AWS'))) candidates.push({ id: newAgentId('act'), target_merchant: 'AWS Cloud Services', action_type: 'budget_cap', description: 'Review orphaned cloud storage and apply an AWS budget cap.', priority: 1, estimated_saving: 2073.73, currency: state.user_goal.currency, requires_approval: true, approval_status: 'pending', execution_status: 'simulated' });
  if (!state.actions.some(action => action.target_merchant.includes('Netflix'))) candidates.push({ id: newAgentId('act'), target_merchant: 'Netflix Premium 4K', action_type: 'downgrade_plan', description: 'Compare Netflix tiers and simulate a lower-cost plan.', priority: 6, estimated_saving: 150, currency: state.user_goal.currency, requires_approval: true, approval_status: 'pending', execution_status: 'simulated' });
  for (const candidate of candidates) candidate.simulation_result = JSON.stringify(simulateAction(candidate));
  state.actions.push(...candidates);
  state.candidate_plans = buildCandidatePlans(state.actions, state.user_goal.target_amount);
  const next = savings_calculator_tool(state.actions).total_monthly_savings;
  state.replanning_status = { is_replanning: true, replan_count: state.replanning_status.replan_count + 1, previous_plan_savings: previous, new_plan_savings: next, strategy_change: 'Expanded search to unexplored cloud and plan-tier opportunities.' };
  state.evaluation.projected_savings = next;
  state.evaluation.gap = Math.max(0, state.user_goal.target_amount - next);
  state.evaluation.goal_achieved = state.evaluation.gap === 0;
  state.evaluation.replanning_needed = false;
  logAgentEvent(options, { run_id: runId, event_type: 'replan', agent_name: 'Replanning Agent', tool_name: 'budget_analysis_tool', status: 'success', summary: `Replanned action space from ${previous} to ${next} monthly savings.` });
  return state.actions;
}
