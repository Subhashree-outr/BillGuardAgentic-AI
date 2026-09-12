import React from 'react';
import {
  ShieldCheck,
  Code,
  LayoutDashboard,
  Target,
  Activity,
  FileText,
  CreditCard,
  Calendar,
  Sparkles,
  Settings,
} from 'lucide-react';
import { WatcherStatus } from './WatcherStatus';

export type AppNavTab =
  | 'dashboard'
  | 'goal_mode'
  | 'agent_activity'
  | 'bills'
  | 'transactions'
  | 'subscriptions'
  | 'demos'
  | 'json'
  | 'settings';

interface HeaderProps {
  currentTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  engine?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  engine = 'gemini-2.5-flash-lite',
}) => {
  const tabs: { id: AppNavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'goal_mode', label: 'AI Goal Mode', icon: <Target className="w-3.5 h-3.5 text-blue-400" />, badge: 'State Loop' },
    { id: 'agent_activity', label: 'Agent Activity', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'bills', label: 'Bills', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'demos', label: 'Demo Mode', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, badge: '5 Scenarios' },
    { id: 'json', label: 'JSON', icon: <Code className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="border-b border-[#27272A] bg-[#09090B]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top brand row */}
        <div className="h-16 flex items-center justify-between border-b border-[#27272A]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#FAFAFA]">BillGuard</h1>
                <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-semibold">
                  Autonomous Agentic AI
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-[10px] font-medium">
                  SQLite &bull; REST API &bull; Gemini
                </span>
              </div>
              <p className="text-[#A1A1AA] text-xs">
                Real-Time Bill & Subscription Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-mono text-[11px]">{engine}</span>
            </div>

            <WatcherStatus />

            <div className="px-2.5 py-1 bg-[#18181B] border border-[#27272A] rounded-lg text-xs text-[#A1A1AA] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] font-medium text-[#FAFAFA]">Synthetic Data Seeded</span>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#27272A] text-[#A1A1AA]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
