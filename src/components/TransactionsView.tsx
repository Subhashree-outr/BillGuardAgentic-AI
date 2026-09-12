import React, { useState, useEffect } from 'react';
import { CreditCard, Search, AlertCircle, CheckCircle2, ArrowUpDown, Filter } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  is_recurring: boolean;
  status: string;
  note?: string;
}

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const categories = ['all', ...Array.from(new Set(transactions.map((t) => t.category)))];

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="min-w-0 bg-[#18181B] border border-[#27272A] rounded-2xl p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              Transaction Ledger & Anomaly Detection
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Live transactional feed monitored by the Anomaly Detection Agent for duplicate debits and suspicious rates.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#71717A]" />
              <input
                type="text"
                placeholder="Search merchant or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] text-xs pl-8 pr-3 py-1.5 rounded-lg text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-blue-500 sm:w-60"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#09090B] border border-[#27272A] text-xs px-2.5 py-1.5 rounded-lg text-[#FAFAFA] focus:outline-none focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={String(c)} value={String(c)}>
                  {String(c).toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#27272A] text-[#71717A] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Merchant</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Audit Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]/50">
              {filtered.map((tx) => {
                const isAnomaly = tx.status === 'flagged_duplicate' || tx.status === 'flagged';
                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors ${
                      isAnomaly ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-[#27272A]/20'
                    }`}
                  >
                    <td className="py-3 px-3 text-[#A1A1AA] font-mono">{tx.date}</td>
                    <td className="py-3 px-3 font-medium text-[#FAFAFA]">
                      <div>{tx.merchant}</div>
                      {tx.note && <div className="text-[10px] text-[#71717A]">{tx.note}</div>}
                    </td>
                    <td className="py-3 px-3 text-[#A1A1AA]">{tx.category}</td>
                    <td className="py-3 px-3 font-semibold text-[#FAFAFA]">
                      {tx.currency === 'USD' ? '$' : '₹'}{tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                          tx.is_recurring
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-[#27272A] text-[#A1A1AA]'
                        }`}
                      >
                        {tx.is_recurring ? 'Recurring' : 'One-time'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {isAnomaly ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] font-semibold">
                          <AlertCircle className="w-3 h-3" /> Duplicate Debit Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 sm:hidden">
          {filtered.map((tx) => {
            const isAnomaly = tx.status === 'flagged_duplicate' || tx.status === 'flagged';
            return (
              <div key={tx.id} className={`rounded-xl border p-3 ${isAnomaly ? 'border-red-500/20 bg-red-500/5' : 'border-[#27272A] bg-[#09090B]'}`}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#FAFAFA]">{tx.merchant}</div>
                    <div className="mt-1 font-mono text-[10px] text-[#71717A]">{tx.date}</div>
                  </div>
                  <div className="shrink-0 text-right font-semibold text-[#FAFAFA]">
                    {tx.currency === 'USD' ? '$' : 'â‚¹'}{tx.amount.toFixed(2)}
                  </div>
                </div>
                {tx.note && <p className="mt-2 text-[11px] leading-relaxed text-[#A1A1AA]">{tx.note}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[#27272A] px-2 py-0.5 text-[10px] text-[#A1A1AA]">{tx.category}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] ${tx.is_recurring ? 'border border-purple-500/20 bg-purple-500/10 text-purple-400' : 'bg-[#27272A] text-[#A1A1AA]'}`}>
                    {tx.is_recurring ? 'Recurring' : 'One-time'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${isAnomaly ? 'border border-red-500/20 bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {isAnomaly ? 'Flagged' : 'Cleared'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
