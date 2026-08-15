import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Briefcase,
  Landmark,
  FileText,
  FolderOpen,
  Settings,
  PlusCircle,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'income'
  | 'expenses'
  | 'pending'
  | 'clients'
  | 'projects'
  | 'gst-tds'
  | 'reports'
  | 'documents'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  openAddModal: (tab?: 'INCOME' | 'EXPENSE' | 'INVOICE') => void;
  isOpenMobile: boolean;
  closeMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openAddModal,
  isOpenMobile,
  closeMobile,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'gst-tds', label: 'GST & TDS', icon: Landmark },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: NavTab) => {
    setActiveTab(id);
    closeMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
              Q
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-snug tracking-tight">
                Qasber Tech
              </h1>
              <p className="text-[11px] text-indigo-400 font-medium">LLP • Finance Hub</p>
            </div>
          </div>
          <button
            onClick={closeMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              openAddModal('EXPENSE');
              closeMobile();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Add Transaction</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>FY 2026-2027</span>
          <span className="flex items-center text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            Offline Sync
          </span>
        </div>
      </aside>
    </>
  );
};
