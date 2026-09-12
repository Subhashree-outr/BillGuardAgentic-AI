import { AgentRunState } from '../types';
import { defaultToolContext, describeAgentTools, getAgentTool } from './registry';
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