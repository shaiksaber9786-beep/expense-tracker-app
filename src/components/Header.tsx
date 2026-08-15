import React from 'react';
import {
  Menu,
  Search,
  FileSpreadsheet,
  Lock,
  Unlock,
  Sun,
  Moon,
  Bot,
  Plus,
} from 'lucide-react';
import type { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  toggleMobileSidebar: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  openAIAssistant: () => void;
  openExcelImport: () => void;
  openMonthCloseModal: () => void;
  isMonthClosed: boolean;
  openAddModal: (tab?: 'INCOME' | 'EXPENSE' | 'INVOICE') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  toggleMobileSidebar,
  searchTerm,
  setSearchTerm,
  isDarkMode,
  setIsDarkMode,
  openAIAssistant,
  openExcelImport,
  openMonthCloseModal,
  isMonthClosed,
  openAddModal,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Financial Command Center';
      case 'transactions': return 'All Transactions';
      case 'income': return 'Income & Invoices Hub';
      case 'expenses': return 'Expense Tracker';
      case 'pending': return 'Pending Receivables & Payables';
      case 'clients': return 'Client Directory & Ledgers';
      case 'projects': return 'Project Profitability';
      case 'gst-tds': return 'GST & TDS Tax Center';
      case 'reports': return 'Financial Reports';
      case 'documents': return 'Document Management';
      case 'settings': return 'Company Settings';
      default: return 'Finance Manager';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3.5 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white capitalize">
            {getTabTitle(activeTab)}
          </h2>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            🔒 100% Offline & Private (On-Device Storage)
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative hidden md:block w-64 lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice, client, UTR..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <button
          onClick={openExcelImport}
          title="Import Excel Data"
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center space-x-1.5 transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Import Excel</span>
        </button>

        <button
          onClick={openMonthCloseModal}
          title={isMonthClosed ? 'Month is CLOSED (Locked)' : 'Month is OPEN'}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition ${
            isMonthClosed
              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
          }`}
        >
          {isMonthClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isMonthClosed ? 'Month Closed' : 'Month Open'}</span>
        </button>

        <button
          onClick={openAIAssistant}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 hover:opacity-90 transition"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">AI Financial Assistant</span>
        </button>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <button
          onClick={() => openAddModal('EXPENSE')}
          className="p-2 rounded-xl bg-indigo-600 text-white lg:hidden"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
