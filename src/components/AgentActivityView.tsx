import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Wrench } from 'lucide-react';

interface AgentEvent {
  id: string;
  run_id: string;
  timestamp: string;
  event_type: string;
  agent_name: string;
  tool_name?: string;
  status: string;
  summary: string;
  details_json?: string;
}

export const AgentActivityView: React.FC = () => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const fetchRecentEvents = async () => {
    setLoading(true);
    try {
      // First get goals to find the latest run
      const goalsRes = await fetch('/api/agent/goals');
      const goalsData = await goalsRes.json();
      if (goalsData.goals && goalsData.goals.length > 0) {
        // Fetch events for goal_hackathon_demo or active run
        const runRes = await fetch('/api/agent/goal_hackathon_demo/events').catch(() => null);
        if (runRes && runRes.ok) {
          const runData = await runRes.json();
          if (runData.events) setEvents(runData.events);
        } else {
          // Trigger or get status
          const statusRes = await fetch('/api/agent/goals');
        }
      }
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  };

  // Poll or fetch initially
  useEffect(() => {
    // Check if there's any active run in local storage or fetch from default run
    fetch('/api/agent/goals/goal_hackathon_demo/run', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.run_id) {
          fetch(`/api/agent/${data.run_id}/events`)
            .then((r) => r.json())
            .then((evData) => {
              if (evData.events) setEvents(evData.events);
            });
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const eventTypes = ['all', 'goal_set', 'plan', 'decision', 'tool_call', 'tool_result', 'evaluation', 'replan', 'outcome'];

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.event_type === filterType;
  });

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'goal_set':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">GOAL</span>;
      case 'plan':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PLAN</span>;
      case 'decision':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">DECIDE</span>;
      case 'tool_call':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">TOOL CALL</span>;
      case 'tool_result':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">TOOL RESULT</span>;
      case 'evaluation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">EVALUATE</span>;
      case 'replan':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">REPLAN</span>;
      case 'outcome':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OUTCOME</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#27272A] text-[#A1A1AA]">{type.toUpperCase()}</span>;
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="min-w-0 bg-[#18181B] border border-[#27272A] rounded-2xl p-3 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 mb-5">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex min-w-0 items-start gap-2 leading-snug">
              <Activity className="mt-0.5 w-4 h-4 shrink-0 text-blue-400" />
              <span className="min-w-0 break-words">Autonomous Multi-Agent Activity & Tool Execution Timeline</span>
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Live audit trail showing goal formulation, tool invocations, anomaly verdicts, and replanning iterations.
            </p>
          </div>

          {/* Filters */}
          <div className="-mx-3 flex min-w-0 max-w-[calc(100vw-1.5rem)] items-center gap-1.5 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:max-w-full sm:px-0">
            {eventTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold leading-none whitespace-nowrap transition-all ${
                  filterType === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#09090B] text-[#71717A] hover:text-[#FAFAFA] border border-[#27272A]'
                }`}
              >
                {t.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative border-l border-[#27272A] ml-3 sm:ml-4 space-y-5 sm:space-y-6 pl-5 sm:pl-6 py-2">
          {filteredEvents.map((evt, idx) => (
            <div key={evt.id || idx} className="relative group">
              {/* Dot marker */}
              <div className="absolute -left-[27px] sm:-left-[31px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#18181B] ring-2 ring-blue-500/30 group-hover:scale-125 transition-transform" />

              <div className="min-w-0 bg-[#09090B] border border-[#27272A] rounded-xl p-3 sm:p-3.5 hover:border-[#3F3F46] transition-colors">
                <div className="flex min-w-0 flex-col gap-2 mb-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                    {getEventBadge(evt.event_type)}
                    <span className="min-w-0 text-xs font-bold text-[#FAFAFA] inline-flex items-center gap-1">
                      <Cpu className="w-3 h-3 shrink-0 text-blue-400" />
                      <span className="break-words">{evt.agent_name}</span>
                    </span>
                    {evt.tool_name && (
                      <span className="min-w-0 max-w-full text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1">
                        <Wrench className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{evt.tool_name}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-[#71717A]">
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>

                <p className="text-xs text-[#D4D4D8] leading-relaxed break-words">{evt.summary}</p>
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="py-8 text-center text-xs text-[#71717A]">
              No events found matching current filter. Run a goal to observe live execution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
