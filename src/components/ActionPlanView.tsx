import React, { useState } from 'react';
import { ActionPlanItem, ActionPriority } from '../types';
import { Check, Clock, DollarSign, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ActionPlanViewProps {
  actionPlan: ActionPlanItem[];
  onReviewApproval?: (item: ActionPlanItem) => void;
  approvedItemIds?: Record<string, boolean>;
}

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({
  actionPlan,
  onReviewApproval,
  approvedItemIds = {},
}) => {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});


  const toggleCompleted = (id: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getPriorityBadge = (priority: ActionPriority) => {
    switch (priority) {
      case 'HIGH':
        return {
          bg: 'bg-red-500/20 text-[#F87171] border border-red-500/30',
          label: 'High Priority',
          dot: 'bg-red-500',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-orange-500/20 text-[#FB923C] border border-orange-500/30',
          label: 'Med Priority',
          dot: 'bg-orange-500',
        };
      case 'LOW':
        return {
          bg: 'bg-blue-500/20 text-[#60A5FA] border border-blue-500/30',
          label: 'Low Priority',
          dot: 'bg-blue-500',
        };
      default:
        return {
          bg: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
          label: priority,
          dot: 'bg-zinc-400',
        };
    }
  };

  const completedCount = Object.values(completedItems).filter(Boolean).length;

  return (
    <div className="min-w-0 bg-[#18181B] border border-[#27272A] rounded-2xl p-3 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2 mb-0.5">
            <h2 className="text-[#A1A1AA] text-xs uppercase tracking-wider font-bold">
              Prioritized Action Plan
            </h2>
            <span className="text-[10px] bg-[#27272A] px-2 py-0.5 rounded-full text-[#FAFAFA] font-medium">
              {actionPlan.length} Steps
            </span>
          </div>
          <p className="text-xs text-[#71717A]">
            Ranked remediation steps to eliminate waste and claim refunds
          </p>
        </div>

        {actionPlan.length > 0 && (
          <div className="w-full text-xs text-[#A1A1AA] font-medium bg-[#09090B] px-3 py-2 rounded-xl border border-[#27272A] flex items-center gap-3 sm:w-auto">
            <span>Progress: <strong className="text-[#FAFAFA]">{completedCount} of {actionPlan.length}</strong> done</span>
            <div className="min-w-16 flex-1 sm:w-20 sm:flex-none h-1.5 bg-[#27272A] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${(completedCount / actionPlan.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {actionPlan.length === 0 ? (
          <div className="p-12 text-center text-[#A1A1AA] text-sm bg-[#09090B] border border-[#27272A] rounded-2xl">
            No action items generated yet.
          </div>
        ) : (
          actionPlan.map((item, idx) => {
            const itemId = item.id || `action-${idx}`;
            const isDone = !!completedItems[itemId];
            const pBadge = getPriorityBadge(item.priority);

            return (
              <div
                key={itemId}
                className={`min-w-0 p-3 sm:p-5 rounded-2xl border transition-all ${
                  isDone 
                    ? 'bg-[#09090B]/60 border-[#27272A] opacity-60' 
                    : 'bg-[#09090B] border-[#27272A] hover:border-zinc-700'
                }`}
              >
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => toggleCompleted(itemId)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                        : 'border-[#27272A] hover:border-blue-500 bg-[#18181B] text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pBadge.dot}`} />
                        {pBadge.label}
                      </span>

                      {item.target_merchant && (
                        <span className="max-w-full break-words text-xs font-semibold text-[#FAFAFA] bg-[#18181B] px-2.5 py-0.5 rounded-md border border-[#27272A]">
                          {item.target_merchant}
                        </span>
                      )}

                      {item.estimated_savings && (
                        <span className="inline-flex max-w-full items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-md border border-green-500/20">
                          <DollarSign className="w-3 h-3" />
                          Est. Savings: {item.estimated_savings}
                        </span>
                      )}

                      {item.deadline && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#A1A1AA] font-mono bg-[#18181B] px-2.5 py-0.5 rounded-md border border-[#27272A]">
                          <Clock className="w-3 h-3 text-[#71717A]" />
                          {item.deadline}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm sm:text-base font-semibold text-[#FAFAFA] break-words ${isDone ? 'line-through text-[#71717A]' : ''}`}>
                      {item.action}
                    </h3>

                    {item.recommended_steps && item.recommended_steps.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">
                          Execution Protocol:
                        </span>
                        <ul className="space-y-1">
                          {item.recommended_steps.map((step, sIdx) => (
                            <li key={sIdx} className="text-xs text-[#A1A1AA] flex items-start gap-2">
                              <span className="text-blue-400 font-bold shrink-0">&bull;</span>
                              <span className="min-w-0 break-words">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Human-in-the-Loop Safety Gate Controls */}
                    <div className="pt-3 border-t border-[#27272A] flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5 text-[11px]">
                        {approvedItemIds[itemId] ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Human Approved &bull; Sandboxed
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium flex items-center gap-1 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <ShieldAlert className="w-3 h-3" />
                            Requires Human Approval
                          </span>
                        )}
                      </div>

                      {onReviewApproval && (
                        <button
                          type="button"
                          onClick={() => onReviewApproval(item)}
                          className={`w-full justify-center text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 sm:w-auto ${
                            approvedItemIds[itemId]
                              ? 'bg-[#18181B] text-[#A1A1AA] hover:text-white border border-[#27272A]'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {approvedItemIds[itemId] ? 'Re-inspect Simulation' : 'Review & Authorize'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

