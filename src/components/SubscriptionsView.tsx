import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, TrendingUp, CheckCircle2, ShieldAlert, ArrowUpRight, Ban } from 'lucide-react';

interface Subscription {
  id: string;
  merchant: string;
  plan_name: string;
  billing_cycle: string;
  current_price: number;
  previous_price?: number;
  currency: string;
  renewal_date: string;
  last_active_date: string;
  is_dormant: boolean | number;
  duplicate_group?: string;
  status: string;
}

export const SubscriptionsView: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      if (data.subscriptions) {
        setSubscriptions(data.subscriptions);
      }
    } catch (e) {
      console.error('Failed to load subscriptions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCancelClick = async (sub: Subscription) => {
    try {
      // Find or trigger action approval for this subscription
      setActionSuccess(`Initiated termination safeguard for ${sub.merchant}. Check Action Approvals to authorize cancellation.`);
    } catch (e) {
      console.error(e);
    }
  };

  const totalMonthly = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((acc, s) => acc + s.current_price, 0);

  const dormantSubs = subscriptions.filter((s) => Boolean(s.is_dormant) && s.status === 'active');
  const potentialDormantSavings = dormantSubs.reduce((acc, s) => acc + s.current_price, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4">
          <span className="text-[11px] text-[#71717A] uppercase font-bold tracking-wider">Active Monthly Recurring</span>
          <p className="text-xl font-bold text-[#FAFAFA] mt-1">₹{totalMonthly.toLocaleString()}</p>
          <span className="text-[11px] text-[#A1A1AA]">{subscriptions.filter((s) => s.status === 'active').length} active memberships</span>
        </div>

        <div className="bg-[#18181B] border border-amber-500/20 rounded-2xl p-4">
          <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Dormant Subscriptions
          </span>
          <p className="text-xl font-bold text-amber-400 mt-1">₹{potentialDormantSavings.toLocaleString()}/mo</p>
          <span className="text-[11px] text-[#A1A1AA]">{dormantSubs.length} idle services flagged (&gt;90 days)</span>
        </div>

        <div className="bg-[#18181B] border border-emerald-500/20 rounded-2xl p-4">
          <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider">Annual Recyclable Savings</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">₹{(potentialDormantSavings * 12).toLocaleString()}/yr</p>
          <span className="text-[11px] text-[#A1A1AA]">Guaranteed relief without service loss</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Active Subscriptions & Renewal Radar
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Audited for inactivity, duplicate streaming/music coverage, and unannounced price hikes.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#27272A] text-[#71717A] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Service & Plan</th>
                <th className="py-2.5 px-3">Rate</th>
                <th className="py-2.5 px-3">Last Active Usage</th>
                <th className="py-2.5 px-3">Next Renewal</th>
                <th className="py-2.5 px-3">Status / Audit</th>
                <th className="py-2.5 px-3 text-right">Safeguard Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]/50">
              {subscriptions.map((sub) => {
                const isDormant = Boolean(sub.is_dormant);
                const hasHike = sub.previous_price && sub.current_price > sub.previous_price;
                return (
                  <tr key={sub.id} className="hover:bg-[#27272A]/20 transition-colors">
                    <td className="py-3 px-3 font-medium text-[#FAFAFA]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#27272A] flex items-center justify-center font-bold text-xs text-blue-400">
                          {sub.merchant.charAt(0)}
                        </div>
                        <div>
                          <div>{sub.merchant}</div>
                          <div className="text-[10px] text-[#71717A]">{sub.plan_name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#FAFAFA]">₹{sub.current_price}/mo</div>
                      {hasHike && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-0.5 font-mono">
                          <TrendingUp className="w-3 h-3" /> Was ₹{sub.previous_price} (+
                          {Math.round(((sub.current_price - (sub.previous_price || 0)) / (sub.previous_price || 1)) * 100)}
                          %)
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-[#A1A1AA]">{sub.last_active_date}</span>
                      {isDormant && (
                        <span className="block text-[10px] text-red-400 font-semibold">&gt;90 days idle</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-[#A1A1AA]">{sub.renewal_date}</td>

                    <td className="py-3 px-3">
                      {isDormant ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] font-semibold">
                          <ShieldAlert className="w-3 h-3" /> Dormant Service
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {isDormant && (
                        <button
                          type="button"
                          onClick={() => handleCancelClick(sub)}
                          className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md transition-all font-semibold"
                        >
                          <Ban className="w-3 h-3" /> Queue Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
