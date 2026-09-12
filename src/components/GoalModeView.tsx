import React, { useState, useEffect } from 'react';
import { Target, Play, RotateCcw, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { LiveAgentStream } from './LiveAgentStream';

interface GoalModeViewProps {
  onRunComplete?: (result: any) => void;
}

export const GoalModeView: React.FC<GoalModeViewProps> = ({ onRunComplete }) => {
  const [goalTitle, setGoalTitle] = useState(
    'Reduce my unnecessary monthly expenses by ₹5,000 without affecting essential services'
  );
  const [targetAmount, setTargetAmount] = useState<number>(5000);
  const [currency, setCurrency] = useState('INR');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [keepAppleMusic, setKeepAppleMusic] = useState(false);
  const [forceFailGateway, setForceFailGateway] = useState(false);
  const [questionAnswer, setQuestionAnswer] = useState('');

  const answerQuestion = async () => {
    if (!runResult?.pending_question || !questionAnswer.trim()) return;
    const response = await fetch(`/api/agent/${runResult.run_id}/questions/${runResult.pending_question.id}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: questionAnswer }),
    });
    const data = await response.json();
    if (data.state) {
      setRunResult(data.state);
      setQuestionAnswer('');
    }
  };

  const runGoal = async () => {
    setIsRunning(true);
    setRunResult(null);
  };

  const phases = ['OBSERVE', 'PLAN', 'DECIDE', 'USE_TOOLS', 'EXECUTE', 'EVALUATE', 'ADAPT_REPLAN', 'OUTCOME'];

  const currentPhaseIndex = runResult
    ? phases.indexOf(runResult.current_phase)
    : isRunning
    ? 2
    : -1;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Goal Configuration Box */}
      <div className="min-w-0 bg-[#18181B] border border-[#27272A] rounded-2xl p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Autonomous State-Based Agent Mode
            </div>
            <h3 className="text-base font-bold text-[#FAFAFA]">
              Financial Optimization Objective
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              The multi-agent system evaluates transactions, detects waste, formulates actions, and automatically replans if targets are unmet.
            </p>
          </div>

          <button
            type="button"
            onClick={runGoal}
            disabled={isRunning}
            className="inline-flex w-full items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 sm:w-auto"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Multi-Agent Loop...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Autonomous Agent</span>
              </>
            )}
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
              Goal Objective / Prompt
            </label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-xs text-[#FAFAFA] font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Target Monthly Savings: ₹{targetAmount.toLocaleString()}
              </label>
              <input
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-[#71717A] mt-1 font-mono">
                <span>₹1,000</span>
                <span>₹5,000 (Hackathon Target)</span>
                <span>₹10,000</span>
              </div>
            </div>

            {/* Live Constraints */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Constraints & Experimentation Flags
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepAppleMusic}
                    onChange={(e) => setKeepAppleMusic(e.target.checked)}
                    className="rounded bg-[#09090B] border-[#27272A] text-blue-600 focus:ring-0"
                  />
                  <span>User Constraint: Must keep Apple Music Family plan</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceFailGateway}
                    onChange={(e) => setForceFailGateway(e.target.checked)}
                    className="rounded bg-[#09090B] border-[#27272A] text-blue-600 focus:ring-0"
                  />
                  <span className="text-amber-400">Simulate 503 gateway failure (tests fallback agent)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous State Machine Progress Tracker */}
      <div className="min-w-0 bg-[#18181B] border border-[#27272A] rounded-2xl p-3 sm:p-6">
        <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-blue-400" />
          Autonomous Agentic Loop State Machine
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {phases.map((phase, idx) => {
            const isDone = currentPhaseIndex >= idx;
            const isCurrent = currentPhaseIndex === idx || (isRunning && idx === 2);
            return (
              <div
                key={phase}
                className={`min-w-0 p-2 sm:p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10 animate-pulse'
                    : isDone
                    ? 'bg-[#09090B] border-emerald-500/30 text-emerald-400'
                    : 'bg-[#09090B]/50 border-[#27272A] text-[#52525B]'
                }`}
              >
                <div className="text-[10px] font-mono mb-1">STEP 0{idx + 1}</div>
                <div className="text-[11px] sm:text-xs font-bold tracking-tight break-words">
                  {phase.replace('_', ' ')}
                </div>
                <div className="text-[10px] mt-1 text-[#71717A]">
                  {isDone ? '✓ Completed' : isCurrent ? 'Active...' : 'Queued'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Agent Stream (Only shows when running) */}
      {isRunning && !runResult && (
        <div className="mt-6">
          <LiveAgentStream
            goalId="goal_hackathon_demo"
            forceToolFailure={forceFailGateway}
            userConstraintOverride={keepAppleMusic ? 'keep_apple_music' : undefined}
            onComplete={(state) => {
              setRunResult(state);
              setIsRunning(false);
              if (onRunComplete) onRunComplete(state);
            }}
            onError={(err) => {
              console.error(err);
              setIsRunning(false);
            }}
          />
        </div>
      )}

      {/* Results View */}
      {runResult && (
        <div className="min-w-0 bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-[#FAFAFA]">Agentic Execution Report</h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {runResult.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#71717A] mt-0.5">Run ID: {runResult.run_id}</p>
            </div>

            {/* Replanning Badge */}
            {runResult.replanning_status?.is_replanning && (
              <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300 flex items-center gap-1.5 font-medium">
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  Auto-Replanned: Expanded to cloud waste & plan tier optimization
                </span>
              </div>
            )}
          </div>

          {/* Savings vs Target Gap Meter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="min-w-0 bg-[#09090B] border border-[#27272A] rounded-xl p-3 sm:p-4">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Target Objective</span>
              <p className="text-xl font-bold text-[#FAFAFA] mt-1">₹{runResult.evaluation.target_savings.toLocaleString()}</p>
              <span className="text-[10px] text-[#A1A1AA]">Monthly reduction goal</span>
            </div>

            <div className="min-w-0 bg-[#09090B] border border-emerald-500/30 rounded-xl p-3 sm:p-4">
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Project Savings Identified
              </span>
              <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 break-words">
                ₹{runResult.evaluation.projected_savings.toLocaleString()}/mo
              </p>
              <span className="text-[10px] text-emerald-400/80">
                ₹{(runResult.evaluation.projected_savings * 12).toLocaleString()}/year annualized
              </span>
            </div>

            <div className="min-w-0 bg-[#09090B] border border-[#27272A] rounded-xl p-3 sm:p-4">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Goal Achievement Status</span>
              <p className="text-lg sm:text-xl font-bold text-[#FAFAFA] mt-1">
                {runResult.evaluation.goal_achieved ? 'Target Met & Exceeded' : 'Gap Detected'}
              </p>
              <span className="text-[10px] text-[#A1A1AA]">{runResult.evaluation.reason}</span>
            </div>
          </div>

          {/* Formulated Actions with Approval Gates */}
          {runResult.pending_question && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-300">Agent needs your input</h5>
                  <p className="text-xs text-[#D4D4D8] mt-1">{runResult.pending_question.question}</p>
                  <p className="text-[11px] text-[#A1A1AA] mt-1">{runResult.pending_question.context}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(runResult.pending_question.options || ['Keep it', 'Continue']).map((option: string) => (
                  <button key={option} type="button" onClick={() => setQuestionAnswer(option)} className={`px-3 py-1.5 rounded-lg text-xs border ${questionAnswer === option ? 'border-amber-400 text-amber-300 bg-amber-500/20' : 'border-[#52525B] text-[#D4D4D8]'}`}>
                    {option}
                  </button>
                ))}
                <button type="button" onClick={answerQuestion} disabled={!questionAnswer} className="px-3 py-1.5 rounded-lg text-xs bg-amber-500 text-black font-semibold disabled:opacity-40">Submit answer</button>
              </div>
            </div>
          )}

          {runResult.candidate_plans?.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-3">Candidate plans</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {runResult.candidate_plans.map((plan: any) => (
                  <div key={plan.id} className={`min-w-0 bg-[#09090B] border rounded-xl p-3 sm:p-4 ${plan.recommended ? 'border-emerald-500/50' : 'border-[#27272A]'}`}>
                    <div className="flex justify-between gap-2"><span className="text-xs font-bold text-[#FAFAFA]">{plan.name}</span>{plan.recommended && <span className="text-[10px] text-emerald-400">Recommended</span>}</div>
                    <p className="text-[11px] text-[#A1A1AA] mt-1">{plan.description}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-3">₹{plan.projected_monthly_savings.toFixed(2)}/mo</p>
                    <p className="text-[10px] text-[#71717A]">Risk: {plan.risk} · {plan.action_ids.length} actions</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h5 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Generated Actions Pending Human Authorization ({runResult.actions.length})
            </h5>

            <div className="space-y-3">
              {runResult.actions.map((act: any) => (
                <div
                  key={act.id}
                  className="min-w-0 bg-[#09090B] border border-[#27272A] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#FAFAFA] break-words">{act.target_merchant}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {act.action_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-[#71717A]">Priority #{act.priority}</span>
                      {act.risk && <span className="text-[10px] text-amber-300 uppercase">{act.risk} risk</span>}
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-1">{act.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-[#71717A] block">Monthly Relief</span>
                      <span className="text-xs font-bold text-emerald-400">
                        +₹{act.estimated_saving.toFixed(2)}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      Approval Required
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
