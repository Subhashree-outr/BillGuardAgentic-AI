/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header, AppNavTab } from './components/Header';
import { AgentPipeline } from './components/AgentPipeline';
import { DataUploader } from './components/DataUploader';
import { SummaryMetrics } from './components/SummaryMetrics';
import { FindingsList } from './components/FindingsList';
import { ActionPlanView } from './components/ActionPlanView';
import { JsonViewer } from './components/JsonViewer';
import { DecisionTraceModal } from './components/DecisionTraceModal';
import { HumanApprovalModal } from './components/HumanApprovalModal';
import { BillsView } from './components/BillsView';
import { TransactionsView } from './components/TransactionsView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { AgentActivityView } from './components/AgentActivityView';
import { GoalModeView } from './components/GoalModeView';
import { HackathonDemosView } from './components/HackathonDemosView';
import { ChatPanel } from './components/ChatPanel';
import { SettingsView } from './components/SettingsView';
import { SAMPLE_DATASETS } from './sampleData';
import { BillGuardReport, Finding, ActionPlanItem } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppNavTab>('dashboard');
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_DATASETS[0].id);
  const [rawData, setRawData] = useState<string>(SAMPLE_DATASETS[0].content);
  const [report, setReport] = useState<BillGuardReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<string>('gemini-2.5-flash-lite');
  const [sessionApiKey, setSessionApiKey] = useState('');
  const [notice, setNotice] = useState<{ message: string; tone: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  const [approvedItemIds, setApprovedItemIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [inspectingFinding, setInspectingFinding] = useState<Finding | null>(null);
  const [approvingAction, setApprovingAction] = useState<ActionPlanItem | null>(null);

  // Check health and model on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasGeminiKey !== undefined) {
          setEngine(data.hasGeminiKey ? (data.model || 'gemini-2.5-flash-lite') : 'rule-engine-billguard');
        }
      })
      .catch(() => {
        // Dev server booting
      });
  }, []);

  useEffect(() => {
    if (window.location.hostname.endsWith('github.io')) setNotice({ message: 'Gemini is disabled on static GitHub Pages. Deterministic auditing remains available.', tone: 'warning' });
    else if (!sessionApiKey) setNotice({ message: 'No session Gemini key configured. Deterministic auditing remains available.', tone: 'warning' });
  }, [sessionApiKey]);

  const handleAnalyze = useCallback(
    async (dataToAnalyze?: string) => {
      const textToSend = dataToAnalyze !== undefined ? dataToAnalyze : rawData;
      if (!textToSend.trim()) {
        setError('Please provide or select billing data to analyze.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(sessionApiKey ? { 'X-Gemini-API-Key': sessionApiKey } : {}) },
          body: JSON.stringify({ data: textToSend }),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || `Server responded with status ${response.status}`);
        }

        const resData = await response.json();
        if (resData.data) {
          const rep: BillGuardReport = resData.data;
          setReport(rep);
          if (resData.engine) {
            setEngine(resData.engine);
          }
        } else {
          throw new Error('No report returned from server');
        }
      } catch (err: any) {
        console.error('Analysis failed:', err);
        setError(err?.message || 'Failed to analyze billing data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [rawData, sessionApiKey]
  );

  // Initial auto-run with default sample
  useEffect(() => {
    handleAnalyze(SAMPLE_DATASETS[0].content);
  }, [handleAnalyze]);

  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (found) {
      setSelectedSampleId(sampleId);
      setRawData(found.content);
      setApprovedItemIds({});
      handleAnalyze(found.content);
    }
  };

  // Human Approval Execution
  const handleApproveAction = async (actionId: string, simulatedSaving: number) => {
    setApprovedItemIds((prev) => ({ ...prev, [actionId]: true }));
    try {
      await fetch(`/api/actions/${actionId}/approve`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend action approval logged locally:', e);
    }
  };

  // Reject Action with Constraint
  const handleRejectAction = async (merchantName: string, reason: string) => {
    setApprovingAction(null);
  };

  return (
    <div className="min-h-screen min-w-0 w-full overflow-x-hidden bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        engine={engine}
      />

      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start gap-3 text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-red-200">Analysis Incident</h4>
              <p className="text-xs text-red-300/90 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => handleAnalyze()}
              className="w-full sm:w-auto text-xs font-semibold text-white flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}
        {notice && <div className={`rounded-xl p-3 text-xs border ${notice.tone === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : notice.tone === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-blue-500/10 border-blue-500/30 text-blue-200'}`} role="status">{notice.message}<button type="button" onClick={() => setNotice(null)} className="ml-3 underline">Dismiss</button></div>}

        {/* Tab 1: Audit Dashboard */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Input Section */}
            <DataUploader
              rawData={rawData}
              onDataChange={(val) => {
                setRawData(val);
                setSelectedSampleId('');
              }}
              onAnalyze={() => handleAnalyze()}
              isLoading={isLoading}
              selectedSampleId={selectedSampleId}
              onSelectSample={handleSelectSample}
              apiKey={sessionApiKey}
            />

            {/* Agentic Execution Pipeline */}
            <AgentPipeline logs={report?.agent_loop_logs} isLoading={isLoading} />

            {/* Results Area */}
            {report && (
              <div className="space-y-5">
                <SummaryMetrics summary={report.summary} userMessage={report.user_message} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="min-w-0 lg:col-span-7">
                    <FindingsList
                      findings={report.findings || []}
                      onInspectTrace={(finding) => setInspectingFinding(finding)}
                    />
                  </div>
                  <div className="min-w-0 lg:col-span-5">
                    <ActionPlanView
                      actionPlan={report.action_plan || []}
                      onReviewApproval={(item) => setApprovingAction(item)}
                      approvedItemIds={approvedItemIds}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Goal Mode */}
        {currentTab === 'goal_mode' && (
          <GoalModeView
            onRunComplete={(res) => {
              // Optionally refresh
            }}
          />
        )}

        {/* Tab 3: Agent Activity Timeline */}
        {currentTab === 'agent_activity' && <AgentActivityView />}

        {/* Tab 4: Bills & Invoices */}
        {currentTab === 'bills' && <BillsView />}

        {/* Tab 5: Transactions */}
        {currentTab === 'transactions' && <TransactionsView />}

        {/* Tab 6: Subscriptions */}
        {currentTab === 'subscriptions' && <SubscriptionsView />}

        {/* Tab 7: Hackathon Scenarios */}
        {currentTab === 'demos' && <HackathonDemosView />}

        {/* Tab 8: Technical JSON */}
        {currentTab === 'json' && report && <JsonViewer report={report} />}
        {currentTab === 'settings' && <SettingsView apiKey={sessionApiKey} onApiKeyChange={setSessionApiKey} onNotify={(message, tone = 'info') => setNotice({ message, tone })} />}
      </main>

      {/* Decision Trace Modal (Explainable AI) */}
      <DecisionTraceModal
        finding={inspectingFinding}
        onClose={() => setInspectingFinding(null)}
        onOpenApproval={(finding) => {
          const match = report?.action_plan.find(
            (a) => a.target_merchant === finding.merchant || a.action.includes(finding.merchant)
          );
          if (match) {
            setApprovingAction(match);
          }
        }}
      />

      {/* Human-in-the-Loop Consequential Action Modal */}
      <HumanApprovalModal
        actionItem={approvingAction}
        onClose={() => setApprovingAction(null)}
        onApprove={handleApproveAction}
        onRejectWithConstraint={handleRejectAction}
      />

      <ChatPanel apiKey={sessionApiKey} onNotify={(message) => setNotice({ message, tone: 'warning' })} />

      <footer className="border-t border-[#27272A] bg-[#09090B] py-5 mt-8 sm:mt-10 text-center text-xs text-[#71717A]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex min-w-0 flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex min-w-0 items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-medium text-[#A1A1AA] break-words">
              BillGuard &bull; Agentic AI Financial Auditor
            </span>
          </div>
          <p className="max-w-full break-words">
            Autonomous Anomaly Detection &bull; Grounded Evidence &bull; Human-in-the-Loop Safety &bull; SQLite Persistence
          </p>
        </div>
      </footer>
    </div>
  );
}
