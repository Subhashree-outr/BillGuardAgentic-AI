import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Eye, RefreshCw, Layers } from 'lucide-react';

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: string;
}

interface Bill {
  id: string;
  filename: string;
  file_type: string;
  merchant: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  tax: number;
  currency: string;
  category: string;
  is_recurring: boolean;
  raw_content?: string;
  status: string;
  items?: BillItem[];
}

export const BillsView: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bills');
      const data = await res.json();
      if (data.bills) {
        setBills(data.bills);
      }
    } catch (e) {
      console.error('Failed to load bills:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/bills/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadMessage(`Successfully parsed bill for ${data.bill.merchant} (₹${data.bill.total_amount})`);
        fetchBills();
      } else {
        setUploadMessage(`Upload failed: ${data.error}`);
      }
    } catch (err: any) {
      setUploadMessage(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleTextUpload = async () => {
    if (!uploadText.trim()) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const res = await fetch('/api/bills/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadText,
          filename: uploadFileName || 'pasted_bill_statement.txt',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUploadMessage(`Extracted structured bill for ${data.bill.merchant} (₹${data.bill.total_amount})`);
        setUploadText('');
        fetchBills();
      } else {
        setUploadMessage(`Extraction failed: ${data.error}`);
      }
    } catch (err: any) {
      setUploadMessage(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-400" />
              Upload & Extract Bill Document
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Supports PDF, receipts, invoices or statement text. Extracted into structured database records.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File input */}
          <div className="border-2 border-dashed border-[#27272A] hover:border-blue-500/50 rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center bg-[#09090B]/50">
            <FileText className="w-8 h-8 text-[#71717A] mb-2" />
            <p className="text-xs text-[#FAFAFA] font-medium mb-1">Click to select or drop bill document</p>
            <p className="text-[11px] text-[#71717A] mb-3">PDF, PNG, JPG, or CSV (max 10MB)</p>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">
              <span>{isUploading ? 'Extracting...' : 'Browse Document'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Text Paste option */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Bill title / filename (optional)"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                className="flex-1 bg-[#09090B] border border-[#27272A] text-xs px-3 py-1.5 rounded-lg text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-blue-500"
              />
            </div>
            <textarea
              rows={3}
              placeholder="Or paste bill OCR raw text (e.g. INVOICE #98234 AWS Total: ₹3450.00)"
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              className="w-full flex-1 bg-[#09090B] border border-[#27272A] text-xs p-3 rounded-lg text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-blue-500 resize-none font-mono"
            />
            <button
              type="button"
              onClick={handleTextUpload}
              disabled={isUploading || !uploadText.trim()}
              className="self-end bg-[#27272A] hover:bg-[#3F3F46] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all"
            >
              Parse with Bill Analyzer Agent
            </button>
          </div>
        </div>

        {uploadMessage && (
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{uploadMessage}</span>
          </div>
        )}
      </div>

      {/* Bills Table */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#FAFAFA]">Audited Bills & Invoices</h3>
            <span className="text-[11px] bg-[#27272A] px-2 py-0.5 rounded-full text-[#A1A1AA]">
              {bills.length} Invoices
            </span>
          </div>
          <button
            type="button"
            onClick={fetchBills}
            className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1.5 bg-[#27272A] px-2.5 py-1 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#27272A] text-[#71717A] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Merchant</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Bill Date</th>
                <th className="py-2.5 px-3">Total Amount</th>
                <th className="py-2.5 px-3">Tax</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]/50">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-[#27272A]/20 transition-colors">
                  <td className="py-3 px-3 font-medium text-[#FAFAFA]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <div>
                        <div>{bill.merchant}</div>
                        <div className="text-[10px] text-[#71717A]">{bill.filename}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#A1A1AA]">{bill.category}</td>
                  <td className="py-3 px-3 text-[#A1A1AA] font-mono">{bill.bill_date}</td>
                  <td className="py-3 px-3 font-semibold text-[#FAFAFA]">
                    {bill.currency === 'USD' ? '$' : '₹'}{bill.total_amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-[#71717A]">
                    {bill.currency === 'USD' ? '$' : '₹'}{bill.tax.toFixed(2)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        bill.status === 'flagged'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {bill.status === 'flagged' ? 'Flagged Anomaly' : 'Processed'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedBill(bill)}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Eye className="w-3 h-3" /> View Line Items
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-[#FAFAFA]">{selectedBill.merchant}</h4>
                <p className="text-xs text-[#71717A] mt-0.5">{selectedBill.filename} &bull; {selectedBill.bill_date}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="text-[#71717A] hover:text-[#FAFAFA] text-lg px-2"
              >
                &times;
              </button>
            </div>

            <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#71717A]">Total Amount:</span>
                <p className="text-[#FAFAFA] font-bold text-sm">
                  {selectedBill.currency === 'USD' ? '$' : '₹'}{selectedBill.total_amount.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[#71717A]">Tax Component:</span>
                <p className="text-[#FAFAFA] font-bold text-sm">
                  {selectedBill.currency === 'USD' ? '$' : '₹'}{selectedBill.tax.toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Extracted Line Items
              </h5>
              <div className="border border-[#27272A] rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#09090B] text-[#71717A] text-[10px]">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {selectedBill.items && selectedBill.items.length > 0 ? (
                      selectedBill.items.map((it) => (
                        <tr key={it.id} className="text-[#FAFAFA]">
                          <td className="py-2 px-3">{it.description}</td>
                          <td className="py-2 px-2 text-center text-[#71717A]">{it.quantity}</td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {selectedBill.currency === 'USD' ? '$' : '₹'}{it.total_price.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-3 text-center text-[#71717A]">
                          Single lump-sum charge
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
