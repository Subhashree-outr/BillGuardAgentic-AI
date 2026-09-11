import React, { useState } from 'react';
import { Finding, FindingType } from '../types';
import { 
  Copy, 
  TrendingUp, 
  Ghost, 
  AlertOctagon, 
  Calendar, 
  ShieldCheck, 
  Info,
  CheckCircle,
  Clock,
  Brain,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { FXAlertBanner } from './FXAlertBanner';

interface FindingsListProps {
  findings: Finding[];
  onInspectTrace?: (finding: Finding) => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings, onInspectTrace }) => {
  const [activeFilter, setActiveFilter] = useState<FindingType | 'all'>('all');


  const filteredFindings = activeFilter === 'all'
    ? findings
    : findings.filter((f) => f.type === activeFilter);

  const getBadgeForType = (type: FindingType) => {
    switch (type) {
      case 'duplicate_charge':
        return {
          symbol: 'D',
          label: 'Duplicate Charge',
          iconBg: 'bg-red-500/20 text-red-400 border border-red-500/30',
          amountColor: 'text-red-400',
        };
      case 'price_increase':
        return {
          symbol: '↑',
          label: 'Price Increase',
          iconBg: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
          amountColor: 'text-orange-400',
        };
      case 'forgotten_subscription':
        return {
          symbol: '?',
          label: 'Forgotten Subscription',
          iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          amountColor: 'text-blue-400',
        };
      case 'unusual_spending':
        return {
          symbol: '!',
          label: 'Unusual Spending Spike',
          iconBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
          amountColor: 'text-purple-400',
        };
      case 'upcoming_renewal':
        return {
          symbol: '🗓',
          label: 'Upcoming Renewal',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          amountColor: 'text-emerald-400',
        };
      default:
        return {
          symbol: '•',
          label: 'Billing Finding',
          iconBg: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
          amountColor: 'text-[#FAFAFA]',
        };
    }
  };

  const counts: Record<string, number> = {
    all: findings.length,
    duplicate_charge: findings.filter((f) => f.type === 'duplicate_charge').length,
    price_increase: findings.filter((f) => f.type === 'price_increase').length,
    forgotten_subscription: findings.filter((f) => f.type === 'forgotten_subscription').length,
    unusual_spending: findings.filter((f) => f.type === 'unusual_spending').length,
    upcoming_renewal: findings.filter((f) => f.type === 'upcoming_renewal').length,
  };

  const formatConfidence = (score: number) => {
    if (score <= 1.0) {
      return `${Math.round(score * 100)}%`;
    }
    return `${Math.round(score)}%`;
  };

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-[#A1A1AA] text-xs uppercase tracking-wider font-bold">
              Detected Findings
            </h2>
            <span className="text-[10px] bg-[#27272A] px-2 py-0.5 rounded-full text-[#FAFAFA] font-medium">
              {findings.length}
            </span>
          </div>
          <p className="text-xs text-[#71717A]">
            Evidence-backed billing anomalies and recurring charges
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#09090B] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A]'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('duplicate_charge')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'duplicate_charge'
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-[#09090B] text-red-400/80 hover:text-red-300 border border-[#27272A]'
            }`}
          >
            Duplicates ({counts.duplicate_charge})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('price_increase')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'price_increase'
                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                : 'bg-[#09090B] text-orange-400/80 hover:text-orange-300 border border-[#27272A]'
            }`}
          >
            Hikes ({counts.price_increase})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('forgotten_subscription')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'forgotten_subscription'
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                : 'bg-[#09090B] text-blue-400/80 hover:text-blue-300 border border-[#27272A]'
            }`}
          >
            Dormant ({counts.forgotten_subscription})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unusual_spending')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'unusual_spending'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-[#09090B] text-purple-400/80 hover:text-purple-300 border border-[#27272A]'
            }`}
          >
            Spikes ({counts.unusual_spending})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('upcoming_renewal')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'upcoming_renewal'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-[#09090B] text-emerald-400/80 hover:text-emerald-300 border border-[#27272A]'
            }`}
          >
            Renewals ({counts.upcoming_renewal})
          </button>
        </div>
      </div>

      {/* Findings List Items */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center text-[#A1A1AA] text-sm bg-[#09090B] border border-[#27272A] rounded-2xl">
            No findings in this category.
          </div>
        ) : (
          filteredFindings.map((finding, idx) => {
            const meta = getBadgeForType(finding.type);
            const amountNum = typeof finding.amount === 'number'
              ? finding.amount.toFixed(2)
              : String(finding.amount);

            return (
              <div
                key={finding.id || idx}
                className="p-4 sm:p-5 bg-[#09090B] border border-[#27272A] rounded-2xl hover:border-zinc-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4 items-start flex-1">
                    {/* Bento Type Icon Tile */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 text-sm ${meta.iconBg}`}>
                      {meta.symbol}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                          {meta.label}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-[#A1A1AA] border border-[#27272A]">
                          Conf: {formatConfidence(finding.confidence_score)}
                        </span>

                        {finding.date && (
                          <span className="text-xs text-[#71717A] font-mono">
                            {finding.date}
                          </span>
                        )}

                        {finding.renewal_date && (
                          <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-medium">
                            Renews: {finding.renewal_date}
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-base text-[#FAFAFA]">
                        {finding.title || `${finding.merchant} - $${amountNum}`}
                      </div>

                      <div className="text-xs text-[#A1A1AA] leading-relaxed">
                        {finding.explanation}
                      </div>

                      {/* FX Alert Banner (Agentic capability to live convert non-target currencies) */}
                      {finding.currency && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-[#27272A]">
                          <FXAlertBanner amount={typeof finding.amount === 'number' ? finding.amount : parseFloat(finding.amount)} originalCurrency={finding.currency} targetCurrency="INR" />
                        </div>
                      )}

                      {/* Evidence Box */}
                      {finding.evidence && (
                        <div className="mt-2 text-[11px] bg-[#18181B] rounded-xl p-3 border border-[#27272A] text-[#A1A1AA] font-mono overflow-x-auto">
                          <span className="font-bold text-[#71717A] uppercase tracking-wider block text-[10px] mb-1">
                            Verified Source Evidence:
                          </span>
                          {finding.evidence}
                        </div>
                      )}

                      {/* Agent Attribution & Why? Trace Button */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {finding.decision_trace?.agent_name || 'Bill Analyzer Agent'}
                          </span>
                          {finding.decision_trace?.tool_failure && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                              <RotateCw className="w-2.5 h-2.5" />
                              Tool Fallback Recovered
                            </span>
                          )}
                        </div>

                        {onInspectTrace && (
                          <button
                            type="button"
                            onClick={() => onInspectTrace(finding)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-500/30 transition-all cursor-pointer"
                          >
                            <Brain className="w-3 h-3" />
                            Why was this flagged?
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side Amount & Metrics */}
                  <div className="sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#27272A]">
                    <div className={`text-xl sm:text-2xl font-bold ${meta.amountColor}`}>
                      ${amountNum}
                    </div>

                    {finding.previous_amount && (
                      <div className="text-xs text-[#A1A1AA] mt-0.5">
                        was ${typeof finding.previous_amount === 'number' ? finding.previous_amount.toFixed(2) : finding.previous_amount}
                        {finding.increase_percentage && (
                          <span className="ml-1 text-[#FB923C] font-semibold">
                            (+{finding.increase_percentage}%)
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-xs font-semibold text-[#FAFAFA] mt-1">
                      {finding.merchant}
                    </div>

                    <div className="text-[10px] text-[#A1A1AA]">
                      {finding.category || 'Subscription'}
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

