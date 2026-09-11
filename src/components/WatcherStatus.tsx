import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WatcherStatus() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/watcher/status');
      const data = await res.json();
      setIsActive(data.isActive);
      setLogs(data.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleWatcher = async () => {
    setIsLoading(true);
    try {
      const endpoint = isActive ? '/api/watcher/stop' : '/api/watcher/start';
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      setIsActive(data.isActive);
      setLogs(data.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowLogs(!showLogs)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
          isActive
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:bg-[#27272A]'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isActive ? (
          <Eye className="w-3.5 h-3.5" />
        ) : (
          <EyeOff className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
          {isActive ? 'Watcher Active' : 'Watcher Inactive'}
        </span>
      </button>

      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-[320px] bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-[#27272A] flex items-center justify-between bg-[#18181B]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-[#FAFAFA]">Autonomous Watcher</span>
              </div>
              <button
                onClick={toggleWatcher}
                disabled={isLoading}
                className={`text-[10px] px-2 py-1 rounded font-bold uppercase transition-colors ${
                  isActive
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {isActive ? 'Stop' : 'Start'}
              </button>
            </div>
            
            <div className="p-3 max-h-[200px] overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-xs text-[#71717A] text-center italic py-2">No logs yet.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-[10px] font-mono text-[#D4D4D8] pb-1 border-b border-[#27272A]/50 last:border-0">
                    {log}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
