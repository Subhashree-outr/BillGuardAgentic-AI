import { AgentRunState } from '../types';
import { defaultToolContext, describeAgentTools, getAgentTool } from './registry';
import { dbHelpers } from '../db';
import { WorkflowOptions } from './contracts';
import { logAgentEvent } from './events';
import { getGeminiModel } from '../gemini';

interface SupervisorChoice {
  tool: string;
  rationale: string;
  confidence: number;
}

const evidenceTools: Array<{ tool: string; category: string; rationale: string }> = [
  { tool: 'inspect_bills', category: 'bills', rationale: 'Bills have not been inspected yet.' },
  { tool: 'find_duplicate_charges', category: 'transactions', rationale: 'The ledger has not been checked for duplicate charges yet.' },
  { tool: 'find_subscription_anomalies', category: 'subscriptions', rationale: 'Subscription dormancy and price history are still unknown.' },
  { tool: 'analyze_discretionary_budget', category: 'budget', rationale: 'The available discretionary savings have not been measured against the goal.' },
];

function deterministicChoice(state: AgentRunState): SupervisorChoice | undefined {
  const observedCategories = new Set(state.observations.map(observation => observation.category));
  const completedTools = new Set(state.tool_history.map(entry => entry.tool));
  const next = evidenceTools.find(candidate =>
    !observedCategories.has(candidate.category) && !completedTools.has(candidate.tool)
  );

  if (!next) return undefined;
  return {
    tool: next.tool,
    rationale: next.rationale,
    confidence: 0.99,
  };
}

async function modelChoice(state: AgentRunState, aiInstance: any): Promise<SupervisorChoice | undefined> {
  if (!aiInstance) return undefined;

  try {
    const response = await aiInstance.models.generateContent({
      model: getGeminiModel(),
      contents: `You are the BillGuard supervisor. Choose exactly one read-only tool to gather the most useful missing evidence for this goal.
Goal: ${state.user_goal.title}
Current observations: ${JSON.stringify(state.observations)}
Tool history: ${JSON.stringify(state.tool_history)}
Available tools:\n${describeAgentTools()}
Return JSON only: {"tool":"tool_name","rationale":"short reason","confidence":0.0}`,
      config: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 512 },
    });
    const parsed = JSON.parse(response.text || '{}') as SupervisorChoice;
    const tool = getAgentTool(parsed.tool);
    if (!tool || tool.risk !== 'read_only') return undefined;
    return {
      tool: tool.name,
      rationale: parsed.rationale || 'Selected by the supervisor model.',
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
    };
  } catch {
    return undefined;
  }
}

export async function chooseNextTool(
  state: AgentRunState,
  aiInstance?: any
): Promise<SupervisorChoice | undefined> {
  const modelSelected = await modelChoice(state, aiInstance);
  if (modelSelected && !state.tool_history.some(entry => entry.tool === modelSelected.tool)) {
    return modelSelected;
  }
  return deterministicChoice(state);
}

export async function executeSupervisedTool(
  state: AgentRunState,
  choice: SupervisorChoice
): Promise<{ result: unknown; summary: string }> {
  const tool = getAgentTool(choice.tool);
  if (!tool) throw new Error(`Unknown agent tool: ${choice.tool}`);
  const result = await tool.run(defaultToolContext(state));
  const summary = Array.isArray(result)
    ? `${tool.name} returned ${result.length} records.`
    : `${tool.name} completed with structured evidence.`;
  return { result, summary };
}

export async function runSupervisorLoop(runId: string, state: AgentRunState, options: WorkflowOptions) {
  const maxIterations = 6;
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const choice = await chooseNextTool(state, options.aiInstance);
    if (!choice) {
      state.next_action = undefined;
      logAgentEvent(options, { run_id: runId, event_type: 'decision', agent_name: 'Supervisor Agent', status: 'success', summary: 'Supervisor determined that available evidence is sufficient.', details_json: { iteration, tool_history: state.tool_history } });
      return;
    }
    state.next_action = choice;
    state.reasoning_trace.push({ iteration, observation: `Evidence available: ${state.observations.length} observations and ${state.tool_history.length} completed tools.`, decision: `Select ${choice.tool}`, selected_tool: choice.tool, rationale: choice.rationale, confidence: choice.confidence, timestamp: new Date().toISOString() });
    const selectedTool = { tool: choice.tool, input: { user_id: state.user_id }, status: 'planned' as const };
    state.selected_tools.push(selectedTool);
    logAgentEvent(options, { run_id: runId, event_type: 'decision', agent_name: 'Supervisor Agent', tool_name: choice.tool, status: 'info', summary: `Selected ${choice.tool}: ${choice.rationale}`, details_json: { iteration, confidence: choice.confidence } });
    (selectedTool as { status: 'planned' | 'called' | 'succeeded' | 'failed' }).status = 'called';
    try {
      const execution = await executeSupervisedTool(state, choice);
      (selectedTool as { status: 'planned' | 'called' | 'succeeded' | 'failed' }).status = 'succeeded';
      state.tool_history.push({ tool: choice.tool, status: 'succeeded', summary: execution.summary, timestamp: new Date().toISOString() });
      state.observations.push({ category: choice.tool.replace(/^find_|^inspect_|^analyze_/, '').replace(/_anomalies|_charges/, ''), summary: execution.summary, data: execution.result, timestamp: new Date().toISOString() });
      logAgentEvent(options, { run_id: runId, event_type: 'tool_result', agent_name: 'Supervisor Agent', tool_name: choice.tool, status: 'success', summary: execution.summary });
    } catch (error: any) {
      (selectedTool as { status: 'planned' | 'called' | 'succeeded' | 'failed'; fallback_used?: boolean }).status = 'failed';
      (selectedTool as { status: 'planned' | 'called' | 'succeeded' | 'failed'; fallback_used?: boolean }).fallback_used = true;
      state.tool_history.push({ tool: choice.tool, status: 'failed', summary: error.message || 'Tool execution failed.', timestamp: new Date().toISOString() });
      state.errors.push({ timestamp: new Date().toISOString(), tool_or_agent: choice.tool, error_message: error.message || 'Tool execution failed.', fallback_action_taken: 'Supervisor recorded the failure and continued with another capability.' });
      logAgentEvent(options, { run_id: runId, event_type: 'error', agent_name: 'Supervisor Agent', tool_name: choice.tool, status: 'error', summary: `${choice.tool} failed; supervisor continued with fallback selection.`, details_json: { error: error.message } });
    }
    dbHelpers.saveAgentRun(state);
  }
  state.next_action = undefined;
  logAgentEvent(options, { run_id: runId, event_type: 'decision', agent_name: 'Supervisor Agent', status: 'warning', summary: `Supervisor stopped after ${maxIterations} bounded iterations.` });
}