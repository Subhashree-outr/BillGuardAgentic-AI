import { AgentEvent, AgentRunState } from '../types';

export interface WorkflowOptions {
  eventEmitter?: (event: AgentEvent) => void;
  userId?: string;
  forceToolFailure?: boolean;
  userConstraintOverride?: string;
  aiInstance?: any;
}

export type AgentTask = (runId: string, state: AgentRunState, options: WorkflowOptions) => Promise<unknown>;
