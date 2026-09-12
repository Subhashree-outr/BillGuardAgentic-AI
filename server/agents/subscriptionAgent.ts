import { subscription_detection_tool } from '../tools';
import { AgentRunState } from '../types';
import { WorkflowOptions } from './contracts';
import { logAgentEvent, newAgentId } from './events';

export async function runSubscriptionAgent(runId: string, state: AgentRunState, options: WorkflowOptions) {
  const analysis = subscription_detection_tool(state.user_id);
  for (const subscription of analysis.dormant_subscriptions) {
    state.detected_issues.push({ id: newAgentId('anom'), type: 'dormant_subscription', merchant: subscription.merchant, amount: subscription.current_price, currency: subscription.currency, severity: 'medium', evidence: `Active recurring payment with no recorded activity since ${subscription.last_active_date}.`, explanation_chain: ['Found active recurring payment.', `Last activity: ${subscription.last_active_date}.`], confidence: /linkedin|career/i.test(subscription.merchant) ? 0.63 : 0.92 });
  }
  for (const group of analysis.redundant_subscription_groups) {
    state.detected_issues.push({ id: newAgentId('anom'), type: 'duplicate_subscription', merchant: group.groupName.toUpperCase(), amount: group.potential_saving, currency: 'INR', severity: 'low', evidence: `Overlapping services: ${group.active_services.map(service => service.merchant).join(', ')}.`, explanation_chain: ['Grouped active services by category.', 'Identified overlapping recurring spend.'], confidence: 0.90 });
  }
  logAgentEvent(options, { run_id: runId, event_type: 'tool_result', agent_name: 'Subscription Agent', tool_name: 'subscription_detection_tool', status: 'warning', summary: `Found ${analysis.dormant_subscriptions.length} dormant and ${analysis.redundant_subscription_groups.length} overlapping subscription groups` });
  return analysis;
}
