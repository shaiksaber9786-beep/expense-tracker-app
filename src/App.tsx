import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDatabase } from './db/database';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { MonthCloseModal } from './components/MonthCloseModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';

// View Components
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { IncomeView } from './components/views/IncomeView';
import { ExpensesView } from './components/views/ExpensesView';
import { PendingView } from './components/views/PendingView';
import { ClientsView } from './components/views/ClientsView';
import { ProjectsView } from './components/views/ProjectsView';
import { GstTdsView } from './components/views/GstTdsView';
import { ReportsView } from './components/views/ReportsView';
import { DocumentsView } from './components/views/DocumentsView';
import { SettingsView } from './components/views/SettingsView';

// Mobile Bottom Nav Icons
import { LayoutDashboard, Users, TrendingUp, TrendingDown, Clock, Plus } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialTab, setAddModalInitialTab] = useState<'INCOME' | 'EXPENSE' | 'INVOICE'>('EXPENSE');
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isMonthCloseOpen, setIsMonthCloseOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    seedInitialDatabase();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const profileList = useLiveQuery(() => db.companyProfile.toArray(), [refreshTrigger]);
  const accounts = useLiveQuery(() => db.accounts.toArray(), [refreshTrigger]) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), [refreshTrigger]) || [];
  const clients = useLiveQuery(() => db.clients.toArray(), [refreshTrigger]) || [];
  const vendors = useLiveQuery(() => db.vendors.toArray(), [refreshTrigger]) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), [refreshTrigger]) || [];
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [refreshTrigger]) || [];
  const invoices = useLiveQuery(() => db.invoices.orderBy('invoiceDate').reverse().toArray(), [refreshTrigger]) || [];
  const taxRules = useLiveQuery(() => db.taxRules.toArray(), [refreshTrigger]) || [];
  const monthClosures = useLiveQuery(() => db.monthClosures.toArray(), [refreshTrigger]) || [];

  const companyProfile = profileList?.[0] || {
    name: 'Qasber Technologies LLP',
    gstin: '32ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    address: 'Kochi, Kerala',
    email: 'accounts@qasber.com',
    phone: '+91 98765 43210',
    financialYear: '2026-2027',
    currency: 'INR',
    invoicePrefix: 'QAS/26-27/',
  };

  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const currentClosure = monthClosures.find((m) => m.monthYear === currentMonthYear);
  const isMonthClosed = currentClosure?.isClosed || false;

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const openAddModalWithTab = (tab: 'INCOME' | 'EXPENSE' | 'INVOICE' = 'EXPENSE') => {
    setAddModalInitialTab(tab);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAddModal={openAddModalWithTab}
        isOpenMobile={isMobileSidebarOpen}
        closeMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header
          activeTab={activeTab}
          toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          openAIAssistant={() => setIsAIAssistantOpen(true)}
          openExcelImport={() => setIsExcelImportOpen(true)}
          openMonthCloseModal={() => setIsMonthCloseOpen(true)}
          isMonthClosed={isMonthClosed}
          openAddModal={openAddModalWithTab}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              invoices={invoices}
              accounts={accounts}
              projects={projects}
              clients={clients}
              onOpenAddModal={openAddModalWithTab}
              onNavigateTab={setActiveTab}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              projects={projects}
              clients={clients}
              vendors={vendors}
              searchTerm={searchTerm}
              onOpenAddModal={openAddModalWithTab}
            />
          )}

          {activeTab === 'income' && (
            <IncomeView
              invoices={invoices}
              clients={clients}
              projects={projects}
              transactions={transactions}
              onOpenAddModal={openAddModalWithTab}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              vendors={vendors}
              projects={projects}
              onOpenAddModal={openAddModalWithTab}
            />
          )}

          {activeTab === 'pending' && (
            <PendingView
              invoices={invoices}
              clients={clients}
              vendors={vendors}
              onOpenAddModal={openAddModalWithTab}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              invoices={invoices}
              projects={projects}
              transactions={transactions}
              onOpenAddModal={openAddModalWithTab}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              transactions={transactions}
              clients={clients}
            />
          )}

          {activeTab === 'gst-tds' && (
            <GstTdsView
              transactions={transactions}
              invoices={invoices}
              taxRules={taxRules}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              invoices={invoices}
              clients={clients}
              projects={projects}
              accounts={accounts}
            />
          )}

          {activeTab === 'documents' && <DocumentsView />}

          {activeTab === 'settings' && (
            <SettingsView
              companyProfile={companyProfile}
              categories={categories}
              taxRules={taxRules}
              onRefresh={handleRefresh}
            />
          )}
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-slate-400 border-t border-slate-800 flex items-center justify-around py-2.5 px-3 lg:hidden shadow-2xl">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'expenses', label: 'Expenses', icon: TrendingDown },
          { id: 'income', label: 'Income', icon: TrendingUp },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'pending', label: 'Pending', icon: Clock },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as NavTab)}
              className={`flex flex-col items-center justify-center space-y-1 py-1 px-2 text-xs font-bold rounded-xl transition ${
                isActive ? 'text-rose-400 bg-rose-950/40 font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => openAddModalWithTab('EXPENSE')}
          className="w-11 h-11 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition"
          title="Quick Expense"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialTab={addModalInitialTab}
        accounts={accounts}
        categories={categories}
        clients={clients}
        vendors={vendors}
        projects={projects}
        invoices={invoices}
        onSuccess={handleRefresh}
      />

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        accounts={accounts}
        categories={categories}
        projects={projects}
        onImportComplete={handleRefresh}
      />

      <MonthCloseModal
        isOpen={isMonthCloseOpen}
        onClose={() => setIsMonthCloseOpen(false)}
        transactions={transactions}
        onStatusChange={handleRefresh}
      />

      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        transactions={transactions}
        invoices={invoices}
        projects={projects}
        clients={clients}
        accounts={accounts}
      />
    </div>
  );
}

export default App;
