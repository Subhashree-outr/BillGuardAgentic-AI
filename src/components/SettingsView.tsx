import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onNotify: (message: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ apiKey, onApiKeyChange, onNotify }) => {
  const [draft, setDraft] = useState(apiKey);
  const [isTesting, setIsTesting] = useState(false);
  const isPages = window.location.hostname.endsWith('github.io');

  const testConnection = async () => {
    if (!draft.trim() || isPages) return;
    setIsTesting(true);
    try {
      const response = await fetch('/api/gemini/test', { method: 'POST', headers: { 'X-Gemini-API-Key': draft.trim() } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Connection failed.');
      onApiKeyChange(draft.trim());
      onNotify('Gemini connection verified. The key is held only in this browser session.', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Gemini connection failed.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const removeKey = () => {
    setDraft('');
    onApiKeyChange('');
    onNotify('Gemini API key removed from this session.', 'info');
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><KeyRound className="w-5 h-5" /></div>
          <div>
            <h2 className="text-base font-bold text-[#FAFAFA]">AI Provider Settings</h2>
            <p className="text-xs text-[#A1A1AA] mt-1">Bring your own Gemini API key for this browser session.</p>
          </div>
        </div>
        {isPages ? (
          <div className="mt-5 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">GitHub Pages is static and has no private backend. Key entry is disabled here so the deployed site does not encourage sending credentials to an untrusted public client.</div>
        ) : (
          <>
            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck className="w-4 h-4" /> Never saved to SQLite, GitHub, analytics, or server logs.</div>
            <label className="block mt-5 text-xs font-semibold text-[#A1A1AA]">Gemini API key</label>
            <input type="password" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="AIza..." autoComplete="off" className="mt-1 w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
            <p className="text-[11px] text-[#71717A] mt-2">The key is kept in memory only and disappears when this page is refreshed or closed. Anyone with browser access could inspect it while configured.</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={testConnection} disabled={isTesting || !draft.trim()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-40">{isTesting ? 'Testing...' : 'Test and use key'}</button>
              <button type="button" onClick={removeKey} disabled={!draft && !apiKey} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-300 text-xs font-semibold disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /> Remove key</button>
            </div>
            {apiKey && <div className="mt-4 text-xs text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Session key configured: {apiKey.slice(0, 4)}••••{apiKey.slice(-4)}</div>}
          </>
        )}
      </div>
    </div>
  );
};
