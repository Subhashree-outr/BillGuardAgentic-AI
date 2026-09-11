import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, CheckCircle, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';
import { AgentEvent, AgentRunState } from '../types';

interface LiveAgentStreamProps {
  goalId: string;
  forceToolFailure?: boolean;
  userConstraintOverride?: string;
  onComplete?: (state: AgentRunState) => void;
  onError?: (error: string) => void;
}

export function LiveAgentStream({ goalId, forceToolFailure, userConstraintOverride, onComplete, onError }: LiveAgentStreamProps) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<'running' | 'completed' | 'error'>('running');

  useEffect(() => {
    setEvents([]);
    setStatus('running');

    let url = `/api/agent/stream/${goalId}?`;
    if (forceToolFailure) url += `forceToolFailure=true&`;
    if (userConstraintOverride) url += `userConstraintOverride=${userConstraintOverride}&`;

    const evtSource = new EventSource(url);

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'agent_event') {
          setEvents((prev) => [...prev, data.event]);
        } else if (data.type === 'workflow_complete') {
          setStatus('completed');
          evtSource.close();
          if (onComplete) onComplete(data.state);
        } else if (data.type === 'workflow_error') {
          setStatus('error');
          evtSource.close();
          if (onError) onError(data.error);
        }
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    evtSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setStatus('error');
      evtSource.close();
      if (onError) onError('Connection lost to agent stream.');
    };

    return () => {
      evtSource.close();
    };
  }, [goalId, forceToolFailure, userConstraintOverride, onComplete, onError]);

  const getEventIcon = (evtStatus: string) => {
    switch (evtStatus) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-[#121214] rounded-xl border border-[#27272A] overflow-hidden flex flex-col font-mono text-sm max-h-[500px]">
      <div className="bg-[#18181B] px-4 py-3 border-b border-[#27272A] flex items-center gap-3">
        <Terminal className="w-5 h-5 text-[#A1A1AA]" />
        <h3 className="font-semibold text-[#FAFAFA] flex-1">Live Agent Stream</h3>
        {status === 'running' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
        {status === 'completed' && <span className="text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">COMPLETED</span>}
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 space-y-3 flex flex-col-reverse">
        <AnimatePresence initial={false}>
          {events.slice().reverse().map((evt, idx) => (
            <motion.div
              key={evt.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 bg-[#18181B]/50 p-3 rounded-lg border border-[#27272A]/50"
            >
              <div className="mt-0.5">{getEventIcon(evt.status)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-blue-300">{evt.agent_name}</span>
                  <span className="text-xs text-[#71717A] bg-[#27272A] px-1.5 py-0.5 rounded">{evt.event_type.toUpperCase()}</span>
                  <span className="text-[#52525B] text-xs flex-1 text-right">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[#D4D4D8] text-sm leading-relaxed">{evt.summary}</p>
                {evt.tool_name && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    <span className="font-semibold">Tool used:</span> {evt.tool_name}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
