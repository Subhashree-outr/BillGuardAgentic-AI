/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActionPlanItem } from '../types';
import {
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface HumanApprovalModalProps {
  actionItem: ActionPlanItem | null;
  onClose: () => void;
  onApprove: (actionId: string, simulatedSaving: number) => void;
  onRejectWithConstraint: (merchantName: string, reason: string) => void;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  actionItem,
  onClose,
  onApprove,
  onRejectWithConstraint,
}) => {
  if (!actionItem) return null;

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [rejectReason, setRejectReason] = useState('Keep subscription (essential for work/study)');

  const savingValue = actionItem.estimated_monthly_value || 19.99;

  const handleSimulateExecution = () => {
    setIsSimulating(true);
    setSimulationLog(['[1/3] Initializing sandboxed merchant communication channel...']);

    setTimeout(() => {
      setSimulationLog((prev) => [
        ...prev,
        `[2/3] Transmitting signed dispute/cancellation payload for ${actionItem.target_merchant}...`,
      ]);
    }, 600);

    setTimeout(() => {
      setSimulationLog((prev) => [
        ...prev,
        `[3/3] Sandbox response 200 OK: Reference #BG-AUDIT-${Math.floor(100000 + Math.random() * 900000)}. Remediation verified!`,
      ]);
      setIsSimulating(false);
      setIsDone(true);
      if (actionItem.id) {
        onApprove(actionItem.id, savingValue);
      }
    }, 1200);
  };

  const handleCopyDraft = () => {
    if (actionItem.generated_draft) {
      navigator.clipboard.writeText(actionItem.generated_draft);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  const handleReject = () => {
    const merchant = actionItem.target_merchant || 'Subscription';
    onRejectWithConstraint(merchant, rejectReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="min-w-0 bg-[#18181B] border border-[#27272A] rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-5 text-[#FAFAFA] relative max-h-[90vh] overflow-y-auto">
        {/* Safety Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#27272A] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-[#FAFAFA] break-words">
                  Human-in-the-Loop Approval Gate
                </h3>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Consequential Action
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Autonomous AI is paused. Explicit user confirmation is required before proceeding.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-xl hover:bg-[#27272A] transition-all cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Action Details */}
        <div className="p-4 rounded-2xl bg-[#09090B] border border-[#27272A] space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-mono uppercase text-blue-400 font-bold">
              Proposed Action Item
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              Est. Monthly Relief: ~${savingValue.toFixed(2)}/mo
            </span>
          </div>
          <p className="text-sm font-bold text-[#FAFAFA] break-words">{actionItem.action}</p>
          <div className="text-xs text-[#A1A1AA] flex flex-wrap items-center gap-2">
            <span>Target Merchant: <strong>{actionItem.target_merchant || 'Direct'}</strong></span>
            <span>&bull;</span>
            <span>Priority: <strong className="text-amber-300">{actionItem.priority}</strong></span>
          </div>
        </div>

        {/* Formal Draft Notice Generated by Action Agent */}
        {actionItem.generated_draft && (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-[#A1A1AA] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Action Agent Prepared Notice
              </span>
              <button
                type="button"
                onClick={handleCopyDraft}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedDraft ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied Notice
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Formal Text
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-[#09090B] border border-[#27272A] font-mono text-[11px] text-[#D4D4D8] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
              {actionItem.generated_draft}
            </pre>
          </div>
        )}

        {/* Sandbox Execution Simulation Log */}
        {simulationLog.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#09090B] border border-emerald-500/30 font-mono text-xs space-y-1 text-emerald-300">
            <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Simulated Execution Log
            </div>
            {simulationLog.map((log, i) => (
              <div key={i} className="text-[11px] text-emerald-200/90">
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Safety Disclaimer */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Safety Protocol:</strong> BillGuard operates exclusively in a demonstration sandbox.
            No real banking credentials or live funds are altered. Approval executes simulated API reconciliation.
          </p>
        </div>

        {/* Action Decision Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#27272A] pt-4">
          {/* Rejection / Constraint Path */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={isSimulating || isDone}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#09090B] hover:bg-red-500/10 border border-[#27272A] hover:border-red-500/30 text-xs font-semibold text-red-300 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reject &amp; Trigger Replan
            </button>
          </div>

          {/* Approve Path */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#09090B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-all cursor-pointer border border-[#27272A]"
            >
              {isDone ? 'Close' : 'Cancel'}
            </button>

            {!isDone ? (
              <button
                type="button"
                onClick={handleSimulateExecution}
                disabled={isSimulating}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Executing Sandbox...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    Approve &amp; Simulate Action
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed &amp; Saved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
