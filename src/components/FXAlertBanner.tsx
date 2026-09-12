import React, { useState, useEffect } from 'react';
import { Globe, ArrowRightLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FXAlertBannerProps {
  amount: number;
  originalCurrency: string;
  targetCurrency?: string;
}

export function FXAlertBanner({ amount, originalCurrency, targetCurrency = 'INR' }: FXAlertBannerProps) {
  const [loading, setLoading] = useState(true);
  const [fxData, setFxData] = useState<any>(null);

  useEffect(() => {
    if (originalCurrency === targetCurrency) {
      setLoading(false);
      return;
    }

    const fetchFX = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tools/fx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, fromCurrency: originalCurrency, toCurrency: targetCurrency })
        });
        const data = await res.json();
        setFxData(data);
      } catch (err) {
        console.error('Failed to fetch FX:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFX();
  }, [amount, originalCurrency, targetCurrency]);

  if (originalCurrency === targetCurrency) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="w-full bg-blue-500/10 border-t border-b border-blue-500/20 px-3 sm:px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-blue-400">
          <Globe className="w-4 h-4" />
          <span className="truncate">Foreign Currency Detected: {originalCurrency}</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <Loader2 className="w-3 h-3 animate-spin" />
            Calculating live FX...
          </div>
        ) : fxData ? (
          <div className="flex max-w-full flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-1.5 bg-[#18181B] border border-[#27272A] px-2 py-1 rounded-md">
              <span className="text-[#A1A1AA]">{fxData.original_amount} {fxData.from_currency}</span>
              <ArrowRightLeft className="w-3 h-3 text-[#71717A]" />
              <span className="text-white font-bold">{fxData.converted_amount} {fxData.to_currency}</span>
            </div>
            <div className="text-[10px] text-[#A1A1AA] flex flex-col items-end hidden sm:flex">
              <span>Rate: {fxData.exchange_rate}</span>
              <span className="text-emerald-500/70">{fxData.source}</span>
            </div>
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
