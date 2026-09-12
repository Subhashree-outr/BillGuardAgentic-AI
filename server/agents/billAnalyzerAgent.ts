import { dbHelpers } from '../db';
import { AgentRunState } from '../types';
import { WorkflowOptions } from './contracts';
import { logAgentEvent } from './events';

export async function runBillAnalyzerAgent(runId: string, state: AgentRunState, options: WorkflowOptions) {
  const bills = dbHelpers.getBills(state.user_id);
  const parsedBills = bills.map(bill => ({
    merchant: bill.merchant,
    total_amount: bill.total_amount,
    currency: bill.currency,
    category: bill.category,
    is_recurring: bill.is_recurring,
    item_count: bill.items?.length || 0,
    due_date: bill.due_date,
  }));
  state.observations.push({
    category: 'bills',
    summary: `Extracted ${bills.length} uploaded bills totalling ${bills.reduce((sum, bill) => sum + bill.total_amount, 0).toFixed(2)}`,
    data: parsedBills,
    timestamp: new Date().toISOString(),
  });
  logAgentEvent(options, { run_id: runId, event_type: 'tool_call', agent_name: 'Bill Analyzer Agent', tool_name: 'bill_parser_tool', status: 'info', summary: `Analyzing ${bills.length} uploaded bills and invoices` });
  return parsedBills;
}
