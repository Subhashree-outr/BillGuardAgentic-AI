import { merchant_verification_tool } from '../tools';
import { AgentRunState } from '../types';
import { WorkflowOptions } from './contracts';
import { logAgentEvent } from './events';

export async function runInvestigationAgent(runId: string, state: AgentRunState, options: WorkflowOptions) {
  const verified: Record<string, any> = {};
  for (const issue of state.detected_issues) {
    try {
      verified[issue.merchant] = merchant_verification_tool(issue.merchant, { forceFail: Boolean(options.forceToolFailure && issue.merchant.toLowerCase().includes('cult.fit')) });
    } catch (error: any) {
      verified[issue.merchant] = { merchant: issue.merchant, status: 'verified_via_fallback', fallback_used: true, cancellation_method: 'Fallback: direct bank mandate stop and email notice' };
      state.errors.push({ timestamp: new Date().toISOString(), tool_or_agent: 'merchant_verification_tool', error_message: error.message || 'Verification failed', fallback_action_taken: 'Used local history and public dispute guidance.' });
      logAgentEvent(options, { run_id: runId, event_type: 'error', agent_name: 'Investigation Agent', tool_name: 'merchant_verification_tool', status: 'error', summary: `Verification failed for ${issue.merchant}; fallback evidence used.` });
    }
  }
  return verified;
}
