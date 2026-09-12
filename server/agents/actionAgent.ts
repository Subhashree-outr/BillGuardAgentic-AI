import { dbHelpers } from '../db';
import { AgentRunState } from '../types';
import { savings_calculator_tool } from '../tools';
import { WorkflowOptions } from './contracts';
import { logAgentEvent, newAgentId } from './events';
import { buildCandidatePlans, simulateAction } from './simulation';

function blockedByConstraint(merchant: string, constraints: string[]) {
  const normalized = constraints.join(' ').toLowerCase();
  return normalized.includes(`keep_${merchant.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`) || (normalized.includes('work') && /linkedin|career|office/i.test(merchant));
}

export async function runActionAgent(runId: string, state: AgentRunState, options: WorkflowOptions) {
  const constraints = state.user_goal.constraints || [];
  const actions: AgentRunState['actions'] = [];
  const add = (target: string, type: AgentRunState['actions'][number]['action_type'], saving: number, description: string, priority: number) => {
    if (blockedByConstraint(target, constraints)) return;
    const simulation = simulateAction({ id: 'simulation', target_merchant: target, action_type: type, description, priority, estimated_saving: saving, currency: state.user_goal.currency, requires_approval: true, approval_status: 'pending', execution_status: 'simulated' });
    const action: AgentRunState['actions'][number] = { id: newAgentId('act'), target_merchant: target, action_type: type, description, priority, estimated_saving: saving, currency: state.user_goal.currency, requires_approval: true, approval_status: 'pending', execution_status: 'simulated', risk: simulation.risk, service_impact: simulation.service_impact, reversible: simulation.reversible, confidence: 0.9, simulation_result: JSON.stringify(simulation) };
    actions.push(action);
  };
  const duplicate = state.detected_issues.find(issue => issue.type === 'duplicate_charge');
  if (duplicate) add(duplicate.merchant, 'dispute_charge', duplicate.amount, `Dispute duplicate charge of ${duplicate.currency} ${duplicate.amount}.`, 1);
  for (const issue of state.detected_issues.filter(item => item.type === 'dormant_subscription')) add(issue.merchant, 'cancel_subscription', issue.amount, `Cancel dormant subscription and stop future renewals.`, 2);
  const priceHike = state.detected_issues.find(issue => issue.type === 'price_hike');
  if (priceHike) add(priceHike.merchant, 'downgrade_plan', Math.max(0, priceHike.amount), `Review a lower plan after the detected price increase.`, 3);
  for (const issue of state.detected_issues.filter(item => item.type === 'unusual_spike')) add(issue.merchant, 'budget_cap', Math.round(issue.amount * 0.6 * 100) / 100, `Investigate the spending spike and set a protective budget cap.`, 4);
  state.actions = actions;
  state.candidate_plans = buildCandidatePlans(actions, state.user_goal.target_amount);
  state.pending_question = undefined;
  const uncertainWorkIssue = state.detected_issues.find(issue => /linkedin|career/i.test(issue.merchant) && issue.confidence < 0.8);
  if (uncertainWorkIssue && !constraints.some(constraint => constraint.includes('linkedin'))) {
    state.pending_question = { id: 'preserve_work_service', question: `Is ${uncertainWorkIssue.merchant} required for your work or job search?`, context: 'The subscription appears dormant, but its purpose is uncertain.', related_merchant: uncertainWorkIssue.merchant, options: ['Keep it', 'Allow a cancellation recommendation'] };
  }
  dbHelpers.saveActions(actions, runId, state.goal_id);
  logAgentEvent(options, { run_id: runId, event_type: 'plan', agent_name: 'Action Agent', tool_name: 'savings_calculator_tool', status: 'success', summary: `Created ${actions.length} simulated approval-required actions` });
  return actions;
}
