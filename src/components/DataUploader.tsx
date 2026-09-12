import React, { useRef, useState } from 'react';
import { Sparkles, FileText, ChevronDown, ChevronUp, RotateCcw, UploadCloud } from 'lucide-react';
import { SAMPLE_DATASETS } from '../sampleData';

interface DataUploaderProps {
  rawData: string;
  onDataChange: (data: string) => void;
  onAnalyze: (dataToAnalyze?: string) => void;
  isLoading: boolean;
  selectedSampleId: string;
  onSelectSample: (id: string) => void;
  apiKey?: string;
}

export const DataUploader: React.FC<DataUploaderProps> = ({
  rawData,
  onDataChange,
  onAnalyze,
  isLoading,
  selectedSampleId,
  onSelectSample,
  apiKey,
}) => {
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = rawData ? rawData.trim().split('\n').length : 0;

  const uploadFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Reading bill document...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/bills/upload', {
        method: 'POST',
        headers: apiKey ? { 'X-Gemini-API-Key': apiKey } : undefined,
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadMessage(`Success! Extracted: ${data.extracted_summary}`);
        onDataChange(rawData + '\n\n' + JSON.stringify(data.bill, null, 2));
      } else {
        setUploadMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
    e.target.value = '';
  };

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Bar: Sample Selector & Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
            Input Statement &bull; Demo Datasets
          </h2>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_DATASETS.map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onSelectSample(sample.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-blue-300 font-semibold'
                      : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-zinc-700'
                  }`}
                >
                  {sample.name.split('(')[0].trim()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragActive(false); const file = e.dataTransfer.files[0]; if (file) void uploadFile(file); }}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 hover:text-white bg-emerald-500/10 border transition-all cursor-pointer ${isDragActive ? 'border-emerald-400 bg-emerald-500/20' : 'border-emerald-500/20'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.csv"
              onChange={handleFileUpload}
              className="sr-only"
              disabled={isUploading}
            />
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : isDragActive ? 'Drop bill here' : 'Drop or upload bill'}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomEditor(!showCustomEditor)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#09090B] border border-[#27272A] hover:border-zinc-700 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>{showCustomEditor ? 'Hide Editor' : 'Paste / Edit Statement'}</span>
            {showCustomEditor ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            id="run-analysis-button"
            type="button"
            disabled={isLoading || !rawData.trim()}
            onClick={() => onAnalyze()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Run Agent Audit
              </>
            )}
          </button>
        </div>
      </div>
      
      {uploadMessage && (
        <div className="text-xs text-blue-300 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
          {uploadMessage}
        </div>
      )}

      {/* Collapsible Custom Statement Textarea */}
      {showCustomEditor && (
        <div className="pt-2 border-t border-[#27272A] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
            <span>Raw Statement Content ({lineCount} lines)</span>
            <button
              type="button"
              onClick={() => onDataChange('')}
              className="text-[#71717A] hover:text-red-400 flex items-center gap-1 text-[11px] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          </div>
          <textarea
            id="billing-data-textarea"
            value={rawData}
            onChange={(e) => onDataChange(e.target.value)}
            placeholder="Paste raw CSV, JSON, or bank statement transactions here..."
            rows={6}
            className="w-full rounded-xl border border-[#27272A] p-3 text-xs font-mono text-emerald-300 bg-[#09090B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-y"
          />
        </div>
      )}
    </div>
  );
};
