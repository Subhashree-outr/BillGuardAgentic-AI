import React from 'react';
import { BillingSummary } from '../types';
import { DollarSign, AlertTriangle, TrendingDown, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface SummaryMetricsProps {
  summary: BillingSummary;
  userMessage?: string;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ summary, userMessage }) => {
  const potentialMonthly = typeof summary.potential_monthly_savings === 'number'
    ? summary.potential_monthly_savings.toFixed(2)
    : String(summary.potential_monthly_savings || '0.00');

  const potentialAnnual = typeof summary.potential_annual_savings === 'number'
    ? summary.potential_annual_savings.toFixed(2)
    : String(summary.potential_annual_savings || '0.00');

  const totalSpent = typeof summary.total_spent_analyzed === 'number'
    ? summary.total_spent_analyzed.toFixed(2)
    : String(summary.total_spent_analyzed || '0.00');

  const totalIssues = (summary.duplicates_detected_count || 0) +
    (summary.price_increases_detected_count || 0) +
    (summary.forgotten_subscriptions_count || 0) +
    (summary.unusual_charges_count || 0);

  return (
    <div className="space-y-3">
      {/* AI Summary Note */}
      {userMessage && (
        <div className="bg-[#18181B] border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-0.5">
              Agent Executive Summary
            </div>
            <p className="text-sm text-[#FAFAFA] leading-relaxed">
              {userMessage}
            </p>
          </div>
        </div>
      )}

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4">
          <div className="text-xs text-[#A1A1AA] font-medium mb-1">Monthly Recovery</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400">
            ${potentialMonthly}
            <span className="text-xs text-[#A1A1AA] font-normal">/mo</span>
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">Identified recurring relief</div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4">
          <div className="text-xs text-[#A1A1AA] font-medium mb-1">Annual Savings</div>
          <div className="text-xl sm:text-2xl font-bold text-[#FAFAFA]">
            ${potentialAnnual}
            <span className="text-xs text-[#A1A1AA] font-normal">/yr</span>
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">Projected annual reduction</div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4">
          <div className="text-xs text-[#A1A1AA] font-medium mb-1">Total Audited</div>
          <div className="text-xl sm:text-2xl font-bold text-[#FAFAFA]">
            ${totalSpent}
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">
            {summary.total_transactions_analyzed || 0} transactions analyzed
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4">
          <div className="text-xs text-[#A1A1AA] font-medium mb-1">Flagged Issues</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400">
            {totalIssues}
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">
            Duplicates, hikes & dormant subs
          </div>
        </div>
      </div>
    </div>
  );
};
