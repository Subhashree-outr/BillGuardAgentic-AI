/**
 * Agent workflow coordinator.
 * Specialist behavior lives in the neighboring agent modules; this file only
 * creates state, sequences the phases, and persists the run outcome.
 */
import crypto from 'node:crypto';
import { dbHelpers, DEFAULT_USER_ID } from '../db';
import { AgentEvent, AgentRunState } from '../types';
import { WorkflowOptions } from './contracts';
import { logAgentEvent } from './events';
import { runBillAnalyzerAgent } from './billAnalyzerAgent';
import { runAnomalyDetectionAgent } from './anomalyAgent';
import { runSubscriptionAgent } from './subscriptionAgent';
import { runInvestigationAgent } from './investigationAgent';
import { runActionAgent } from './actionAgent';
import { runEvaluationAgent } from './evaluationAgent';
import { runReplanningAgent } from './replanningAgent';
import { runSupervisorLoop } from './supervisor';

export type { WorkflowOptions } from './contracts';
export { runBillAnalyzerAgent } from './billAnalyzerAgent';
export { runAnomalyDetectionAgent } from './anomalyAgent';
export { runSubscriptionAgent } from './subscriptionAgent';
export { runInvestigationAgent } from './investigationAgent';
export { runActionAgent } from './actionAgent';
export { runEvaluationAgent } from './evaluationAgent';
export { runReplanningAgent } from './replanningAgent';

function createInitialState(goalId: string, userId: string, goal: any): AgentRunState {
  return {
    run_id: `run_${crypto.randomUUID().slice(0, 8)}`,
    goal_id: goalId,
    user_id: userId,
    status: 'running',
    current_phase: 'OBSERVE',
    user_goal: { title: goal.title, target_amount: goal.target_saving_amount, currency: goal.currency, constraints: goal.constraints },
    observations: [],
    current_plan: [
      { step: 1, description: 'Ingest and observe billing transactions and active subscriptions', agent: 'Bill Analyzer Agent', status: 'pending' },
      { step: 2, description: 'Detect duplicate debits, price changes, and spending anomalies', agent: 'Anomaly Detection Agent', status: 'pending' },
      { step: 3, description: 'Audit dormancy and overlapping subscription services', agent: 'Subscription Agent', status: 'pending' },
      { step: 4, description: 'Verify merchant terms with fallback recovery', agent: 'Investigation Agent', status: 'pending' },
      { step: 5, description: 'Generate simulated actions with human approval gates', agent: 'Action Agent', status: 'pending' },
      { step: 6, description: 'Evaluate savings and search for additional opportunities', agent: 'Evaluation and Replanning Agents', status: 'pending' },
    ],
    detected_issues: [],
    selected_tools: [],
    reasoning_trace: [],
    tool_history: [],
    candidate_plans: [],
    agent_metrics: { iterations: 0, tools_used: 0, failed_tools: 0, replans: 0 },
    actions: [],
    action_results: [],
    evaluation: { goal_achieved: false, target_savings: goal.target_saving_amount, projected_savings: 0, currency: goal.currency, gap: goal.target_saving_amount, remaining_anomalies_count: 0, replanning_needed: false, reason: 'Workflow initialized.' },
    confidence: 0.95,
    errors: [],
    replanning_status: { is_replanning: false, replan_count: 0, previous_plan_savings: 0, new_plan_savings: 0, strategy_change: 'None' },
  };
}

export async function runAgenticWorkflow(goalId = 'goal_hackathon_demo', customGoalTitle?: string, options: WorkflowOptions = {}): Promise<AgentRunState> {
  const userId = options.userId || DEFAULT_USER_ID;
  let goal = dbHelpers.getGoalById(goalId);
  if (!goal) {
    goal = dbHelpers.createGoal({ id: goalId, user_id: userId, title: customGoalTitle || 'Reduce my unnecessary monthly expenses by ₹5,000 without affecting essential services', target_saving_amount: 5000, currency: 'INR', constraints: ['keep_essential_electricity', 'keep_primary_fiber_internet', 'retain_daily_music_spotify'] });
  }
  const state = createInitialState(goal.id, userId, goal);
  if (customGoalTitle) state.user_goal.title = customGoalTitle;
  dbHelpers.saveAgentRun(state);
  logAgentEvent(options, { run_id: state.run_id, event_type: 'goal_set', agent_name: 'BillGuard Orchestrator', status: 'info', summary: `Goal activated: "${state.user_goal.title}"`, details_json: state.user_goal });

  await runSupervisorLoop(state.run_id, state, options);
  state.agent_metrics.iterations = state.reasoning_trace.length;
  state.agent_metrics.tools_used = state.tool_history.length;
  state.agent_metrics.failed_tools = state.tool_history.filter(tool => tool.status === 'failed').length;
  state.current_phase = 'OBSERVE';
  await runBillAnalyzerAgent(state.run_id, state, options);
  state.current_plan[0].status = 'completed';
  state.current_phase = 'DECIDE';
  await runAnomalyDetectionAgent(state.run_id, state, options);
  state.current_plan[1].status = 'completed';
  await runSubscriptionAgent(state.run_id, state, options);
  state.current_plan[2].status = 'completed';
  state.current_phase = 'USE_TOOLS';
  await runInvestigationAgent(state.run_id, state, options);
  state.current_plan[3].status = 'completed';
  state.current_phase = 'EXECUTE';
  await runActionAgent(state.run_id, state, options);
  state.current_plan[4].status = 'completed';
  state.current_phase = 'EVALUATE';
  await runEvaluationAgent(state.run_id, state, options);
  if (state.evaluation.replanning_needed || options.userConstraintOverride) {
    state.current_phase = 'ADAPT_REPLAN';
    state.status = 'replanning';
    await runReplanningAgent(state.run_id, state, options);
    state.agent_metrics.replans = state.replanning_status.replan_count;
  }
  state.current_plan[5].status = 'completed';
  state.current_phase = 'OUTCOME';
  state.status = 'waiting_for_approval';
  state.final_outcome = {
    summary: `Audit completed with ${state.actions.length} approval-required simulated actions and projected ${state.user_goal.currency} ${state.evaluation.projected_savings.toFixed(2)} monthly savings.`,
    monthly_savings: state.evaluation.projected_savings,
    annual_savings: state.evaluation.projected_savings * 12,
    currency: state.user_goal.currency,
    actions_count: state.actions.length,
    achieved: state.evaluation.goal_achieved,
  };
  logAgentEvent(options, { run_id: state.run_id, event_type: 'outcome', agent_name: 'BillGuard Orchestrator', status: 'success', summary: state.final_outcome.summary, details_json: state.final_outcome });
  dbHelpers.saveAgentRun(state);
  return state;
}

export type { AgentEvent };