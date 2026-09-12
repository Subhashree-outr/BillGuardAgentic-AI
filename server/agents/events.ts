import crypto from 'node:crypto';
import { dbHelpers } from '../db';
import { AgentEvent } from '../types';
import { WorkflowOptions } from './contracts';

export function logAgentEvent(options: WorkflowOptions, event: Omit<AgentEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
  const fullEvent = {
    ...event,
    id: event.id || `evt_${crypto.randomUUID().slice(0, 8)}`,
    timestamp: event.timestamp || new Date().toISOString(),
  } as AgentEvent;
  dbHelpers.logAgentEvent(fullEvent);
  options.eventEmitter?.(fullEvent);
}

export function newAgentId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
