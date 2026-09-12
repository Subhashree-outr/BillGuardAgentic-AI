import { dbHelpers } from '../db';
import { historical_comparison_tool, subscription_detection_tool, transaction_analysis_tool } from '../tools';
import { AgentRunState } from '../types';
import { WorkflowOptions } from './contracts';
import { logAgentEvent, newAgentId } from './events';

export async function runAnomalyDetectionAgent(runId: string, state: AgentRunState, options: WorkflowOptions) {
  const txAnalysis = transaction_analysis_tool(state.user_id);
  for (const duplicate of txAnalysis.duplicates_detected) {
    const issue = { id: newAgentId('anom'), type: 'duplicate_charge', merchant: duplicate.merchant, amount: duplicate.amount, currency: 'INR', severity: 'high' as const, evidence: `Identical charge of ₹${duplicate.amount} billed twice within ${duplicate.timeGapMinutes} minutes.`, explanation_chain: ['Matched merchant and amount.', `Compared timestamps: ${duplicate.timeGapMinutes} minutes apart.`], confidence: 0.98 };
    state.detected_issues.push(issue);
  }
  const subscriptions = subscription_detection_tool(state.user_id);
  for (const subscription of subscriptions.price_increase_subscriptions) {
    const history = historical_comparison_tool(subscription.merchant, subscription.current_price, state.user_id);
    state.detected_issues.push({ id: newAgentId('anom'), type: 'price_hike', merchant: subscription.merchant, amount: history.difference ?? 0, currency: 'INR', severity: 'medium', evidence: history.evidence ?? 'Historical comparison completed.', explanation_chain: ['Compared current and previous price.', `Calculated ${history.percentage_change}% change.`], confidence: 0.94 });
  }
  const awsBill = dbHelpers.getBills(state.user_id).find(bill => bill.merchant.includes('AWS'));
  if (awsBill && awsBill.total_amount > 2000) {
    state.detected_issues.push({ id: newAgentId('anom'), type: 'unusual_spike', merchant: awsBill.merchant, amount: awsBill.total_amount, currency: awsBill.currency, severity: 'high', evidence: `Bill total ${awsBill.currency} ${awsBill.total_amount} exceeds the stored cloud-cost baseline.`, explanation_chain: ['Compared bill amount with the synthetic baseline.', 'Flagged a high-cost infrastructure spike.'], confidence: 0.96 });
  }
  logAgentEvent(options, { run_id: runId, event_type: 'tool_result', agent_name: 'Anomaly Detection Agent', tool_name: 'transaction_analysis_tool', status: state.detected_issues.length ? 'warning' : 'success', summary: `Detected ${state.detected_issues.length} billing anomalies` });
  return state.detected_issues;
}
