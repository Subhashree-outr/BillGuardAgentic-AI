import React, { useState } from 'react';
import { Sparkles, Play, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

export const HackathonDemosView: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const scenarios = [
    {
      id: 1,
      title: 'Scenario 1: Detect Unnecessary Subscriptions',
      subtitle: 'Dormancy & duplicate audit',
      description:
        'The agent scans subscriptions, discovers Cult.Fit gym (>90 days idle, ₹1,850/mo) and duplicate music plans (Apple Music + Spotify), and drafts cancellation safeguards.',
    },
    {
      id: 2,
      title: 'Scenario 2: Detect Suspicious Price Increase',
      subtitle: 'Historical baseline comparison',
      description:
        'Audits recurring charges against historical baselines, pinpointing Netflix price hike (+30% from ₹499 to ₹649) and AWS cloud spend surge (+306%).',
    },
    {
      id: 3,
      title: 'Scenario 3: Tool Failure -> Fallback Strategy',
      subtitle: 'Simulated 503 gateway failure resilience',
      description:
        'Forces a 503 error on external merchant verification API. The Investigation Agent catches the failure, logs the error, and pivots to consumer rights fallback protocol.',
    },
    {
      id: 4,
      title: 'Scenario 4: User Changes Constraint -> Agent Replans',
      subtitle: 'Dynamic preference adaptation',
      description:
        'User injects constraint "Keep Apple Music". The agent immediately adapts, removes the Apple Music cancellation, and searches for alternate relief.',
    },
    {
      id: 5,
      title: 'Scenario 5: Savings Target Not Met -> Autonomous Replan',
      subtitle: 'Automated target gap loop',
      description:
        'User targets ₹5,000 monthly savings. Initial plan yields ₹4,884 (gap of ₹116). Evaluation Agent triggers Replanning Agent, unlocking AWS orphan snapshot purge to hit ₹7,107/mo!',
    },
  ];

  const handleRunScenario = async (id: number) => {
    setActiveScenario(id);
    setRunning(true);
    setResult(null);
    setResetMessage(null);

    try {
      const res = await fetch('/api/demo/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: id }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch('/api/demo/reset-synthetic', { method: 'POST' });
      const data = await res.json();
      setResetMessage('Synthetic financial dataset reset to clean baseline.');
      setResult(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon Demonstration Suite
            </div>
            <h3 className="text-base font-bold text-[#FAFAFA]">
              Deterministic Agent Evaluation Scenarios
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Click any scenario to watch the multi-agent system reason, use specialized tools, recover from simulated errors, and adapt its execution plan.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Synthetic Ledger
          </button>
        </div>

        {resetMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{resetMessage}</span>
          </div>
        )}
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <div
              key={sc.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-[#18181B] border-[#27272A] hover:border-[#3F3F46]'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-bold">
                  {sc.subtitle}
                </span>
                <h4 className="text-sm font-bold text-[#FAFAFA] mt-1 mb-2">{sc.title}</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">{sc.description}</p>
              </div>

              <button
                type="button"
                onClick={() => handleRunScenario(sc.id)}
                disabled={running}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {running && isSelected ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Agent...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Scenario #{sc.id}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Execution Results View */}
      {result && result.state && (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Scenario Result Output
              </span>
              <h4 className="text-base font-bold text-[#FAFAFA] mt-0.5">{result.scenario}</h4>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Status: {result.state.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Key Findings from Scenario */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Identified Savings</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                ₹{result.state.evaluation.projected_savings.toLocaleString()}/mo
              </p>
              <span className="text-[10px] text-[#A1A1AA]">
                ₹{(result.state.evaluation.projected_savings * 12).toLocaleString()}/year annualized
              </span>
            </div>

            <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Replanning Engine</span>
              <p className="text-xl font-bold text-[#FAFAFA] mt-1">
                {result.state.replanning_status?.is_replanning ? 'Replan Triggered' : 'Direct Plan'}
              </p>
              <span className="text-[10px] text-purple-400">
                {result.state.replanning_status?.strategy_change || 'Initial target achieved cleanly'}
              </span>
            </div>

            <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Errors & Fallbacks</span>
              <p className="text-xl font-bold text-[#FAFAFA] mt-1">
                {result.state.errors.length > 0 ? `${result.state.errors.length} Handled` : 'Zero Errors'}
              </p>
              <span className="text-[10px] text-[#A1A1AA]">
                {result.state.errors.length > 0 ? 'Fallback strategy safely applied' : 'Tools healthy'}
              </span>
            </div>
          </div>

          {/* Formulated Actions */}
          <div>
            <h5 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-3">
              Generated Remediation Actions ({result.state.actions.length})
            </h5>
            <div className="space-y-2">
              {result.state.actions.map((a: any) => (
                <div
                  key={a.id}
                  className="bg-[#09090B] border border-[#27272A] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#FAFAFA]">{a.target_merchant}: </span>
                    <span className="text-[#D4D4D8]">{a.description}</span>
                  </div>
                  <span className="font-bold text-emerald-400 shrink-0">+₹{a.estimated_saving.toFixed(2)}/mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
