/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Finding } from '../types';
import {
  Brain,
  X,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  FileText,
  UserCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface DecisionTraceModalProps {
  finding: Finding | null;
  onClose: () => void;
  onOpenApproval?: (finding: Finding) => void;
}

export const DecisionTraceModal: React.FC<DecisionTraceModalProps> = ({
  finding,
  onClose,
  onOpenApproval,
}) => {
  if (!finding) return null;

  const trace = finding.decision_trace || {
    decision: `Flagged ${finding.title} for audit and remediation.`,
    evidence: finding.evidence,
    confidence: finding.confidence_score,
    agent: 'bill_analyzer',
    agent_name: 'Bill Analyzer Agent',
    next_action: 'Review transaction record and approve proposed action',
    requires_approval: true,
  };

  const confidencePct = Math.round(
    trace.confidence > 1 ? trace.confidence : trace.confidence * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#18181B] border border-[#27272A] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-[#FAFAFA] relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#27272A] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#FAFAFA]">
                  Autonomous &quot;Why?&quot; Decision Trace
                </h3>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Audit Verified
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Explainable AI Trail for {finding.merchant} ({finding.title})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-xl hover:bg-[#27272A] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Decision Trace Box */}
        <div className="space-y-4">
          {/* Decision */}
          <div className="p-4 rounded-2xl bg-[#09090B] border border-[#27272A] space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center justify-between">
              <span>Decision</span>
              <span className="text-[#A1A1AA] font-normal lowercase">
                Evaluated by: {trace.agent_name}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#FAFAFA] leading-snug">
              {trace.decision}
            </p>
          </div>

          {/* Evidence */}
          <div className="p-4 rounded-2xl bg-[#09090B] border border-[#27272A] space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Verified Evidence (Ledger Match)
            </div>
            <p className="text-xs font-mono text-[#D4D4D8] bg-[#18181B] p-3 rounded-xl border border-[#27272A]">
              &quot;{trace.evidence}&quot;
            </p>
          </div>

          {/* Confidence & Agent Attribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#09090B] border border-[#27272A] space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                Inference Confidence
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#FAFAFA] font-mono">
                  {confidencePct}%
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  High Certainty
                </span>
              </div>
              <div className="w-full bg-[#18181B] h-1.5 rounded-full overflow-hidden mt-2 border border-[#27272A]">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#09090B] border border-[#27272A] space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                Human Safety Requirement
              </span>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-amber-200">
                  {trace.requires_approval ? 'Approval Required' : 'Informational Only'}
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] pt-1">
                Consequential financial action must be human-confirmed.
              </p>
            </div>
          </div>

          {/* Tool Interaction & Fallback Trace (if applicable) */}
          {trace.tool_failure && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <RotateCw className="w-4 h-4 text-amber-400" />
                Tool Failure &amp; Autonomous Fallback Demonstration
              </div>
              <p className="text-xs leading-relaxed text-amber-100">
                <strong>Tool Invocation:</strong> <code>{trace.tool_used}</code>
              </p>
              <p className="text-xs leading-relaxed text-amber-200/90">
                <strong>Outcome:</strong> ❌ External vendor lookup failed due to network timeout / unindexed merchant code.
              </p>
              <p className="text-xs leading-relaxed text-emerald-300">
                <strong>Autonomous Recovery:</strong> {trace.recovery_strategy}
              </p>
            </div>
          )}

          {/* Next Action */}
          <div className="p-4 rounded-2xl bg-[#09090B] border border-[#27272A] space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              Autonomous Action Proposed
            </div>
            <p className="text-xs text-[#FAFAFA] leading-relaxed">
              {trace.next_action}
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#27272A] pt-4">
          <span className="text-xs text-[#71717A] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Grounded strictly on provided statements
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#09090B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-all cursor-pointer border border-[#27272A]"
            >
              Close
            </button>
            {onOpenApproval && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApproval(finding);
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                Review &amp; Approve Action
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
