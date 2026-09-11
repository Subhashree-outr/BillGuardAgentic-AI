import React, { useState } from 'react';
import { BillGuardReport } from '../types';
import { Copy, Check, Download, FileCode2 } from 'lucide-react';

interface JsonViewerProps {
  report: BillGuardReport;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);

  // Exact JSON output format requested by user
  const jsonString = JSON.stringify(
    {
      summary: report.summary,
      findings: report.findings,
      action_plan: report.action_plan,
      user_message: report.user_message,
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billguard_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 text-[#FAFAFA]">
      {/* Bento Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">
              Autonomous Machine JSON Payload
            </h2>
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
              Pure JSON Output
            </span>
          </div>
          <p className="text-xs text-[#A1A1AA]">
            Exact schema output compliant with specified keys: summary, findings, action_plan, user_message
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-json-button"
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#09090B] hover:bg-[#121215] text-xs font-semibold text-[#FAFAFA] transition-colors border border-[#27272A] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
                Copy JSON
              </>
            )}
          </button>
          <button
            id="download-json-button"
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download .json
          </button>
        </div>
      </div>

      <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-4 sm:p-5 overflow-x-auto max-h-[600px] overflow-y-auto">
        <pre className="font-mono text-xs text-emerald-300 leading-relaxed">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
};

