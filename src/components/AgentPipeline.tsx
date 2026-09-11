import React, { useState } from 'react';
import { AgentStepLog } from '../types';
import {
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot,
  Search,
  Zap,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

interface AgentPipelineProps {
  logs?: AgentStepLog[];
  isLoading?: boolean;
}

export const AgentPipeline: React.FC<AgentPipelineProps> = ({ logs = [], isLoading = false }) => {
  const [showLogs, setShowLogs] = useState(false);

  const steps = [
    {
      id: 'ingest',
      label: 'Ingest & Normalize',
      desc: 'Parse transactions & merchant baseline',
      icon: Search,
      agent: 'Bill Analyzer Agent',
    },
    {
      id: 'detect',
      label: 'Anomaly Detection',
      desc: 'Detect duplicates, price hikes & spikes',
      icon: Cpu,
      agent: 'Anomaly Agent',
    },
    {
      id: 'reason',
      label: 'Autonomous Reasoning',
      desc: 'Evaluate dormancy, risk & tool evidence',
      icon: Bot,
      agent: 'Investigation Agent',
    },
    {
      id: 'remediate',
      label: 'Action & Dispute Plan',
      desc: 'Generate dispute letters & savings plan',
      icon: Zap,
      agent: 'Action Agent',
    },
  ];

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              Agentic AI Autonomous Pipeline
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isLoading ? 'Executing...' : 'Ready'}
              </span>
            </h3>
            <p className="text-xs text-[#A1A1AA]">
              Autonomous multi-agent lifecycle: Observe &bull; Reason &bull; Verify &bull; Act
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A1A1AA] hover:text-white bg-[#09090B] border border-[#27272A] hover:border-zinc-700 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Agent Logs ({logs.length})</span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 4-Step Pipeline Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isComplete = !isLoading && logs.length > 0;
          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition-all ${
                isLoading
                  ? 'border-blue-500/30 bg-blue-500/5 animate-pulse'
                  : isComplete
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-[#27272A] bg-[#09090B]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#71717A]">
                    0{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#FAFAFA]">{step.label}</span>
                </div>
                {isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-[#71717A]" />
                )}
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Expandable Agent Execution Logs */}
      {showLogs && logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#27272A] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-mono">
            <span>Execution Trace & Tool Calls</span>
            <span className="text-emerald-400">All Agents Verified</span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-[#09090B] border border-[#27272A] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                    <span>{log.agent_avatar || '🤖'}</span>
                    <span>{log.agent_name}</span>
                  </span>
                  <span className="text-[10px] text-[#71717A]">{log.timestamp}</span>
                </div>
                <div className="text-[#FAFAFA] text-[11px]">{log.description}</div>
                {log.detail && (
                  <div className="text-[10px] text-[#A1A1AA] bg-[#18181B] p-1.5 rounded border border-[#27272A]/50">
                    {log.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
