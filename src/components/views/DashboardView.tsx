import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import type { Account, Client, Invoice, Project, Transaction } from '../../types';
import { formatINR } from '../../utils/financial';
import { SmartQuickEntryBar } from '../SmartQuickEntryBar';

interface DashboardViewProps {
  transactions: Transaction[];
  invoices: Invoice[];
  accounts: Account[];
  projects: Project[];
  clients: Client[];
  onOpenAddModal: (tab?: any) => void;
  onNavigateTab: (tab: any) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  invoices,
  accounts,
  projects,
  clients,
  onNavigateTab,
  onRefresh,
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));

  const totalIncomeThisMonth = monthTxs
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + (t.baseAmount || t.amount), 0);

  const totalExpensesThisMonth = monthTxs
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncomeThisMonth - totalExpensesThisMonth;

  const pendingIncome = invoices
    .filter((i) => i.pendingAmount > 0)
    .reduce((sum, i) => sum + i.pendingAmount, 0);

  const pendingExpenses = 18500;

  let outputGst = 0;
  let inputGstEligible = 0;

  transactions.forEach((t) => {
    if (t.type === 'INCOME' && t.gst?.applicable) {
      outputGst += (t.gst.cgst || 0) + (t.gst.sgst || 0) + (t.gst.igst || 0);
    }
    if (t.type === 'EXPENSE' && t.gst?.applicable && t.gst?.itcEligible === 'YES') {
      inputGstEligible += (t.gst.cgst || 0) + (t.gst.sgst || 0) + (t.gst.igst || 0);
    }
  });

  const gstPosition = Math.max(0, outputGst - inputGstEligible);

  let tdsReceivable = 0;
  invoices.forEach((i) => {
    if (i.tdsApplicable) tdsReceivable += i.tdsAmount;
  });

  const chartData = [
    { month: 'Mar', Income: 280000, Expenses: 140000 },
    { month: 'Apr', Income: 320000, Expenses: 180000 },
    { month: 'May', Income: 240000, Expenses: 110000 },
    { month: 'Jun', Income: 410000, Expenses: 220000 },
    { month: 'Jul', Income: 380000, Expenses: 195000 },
    { month: 'Aug', Income: totalIncomeThisMonth || 300000, Expenses: totalExpensesThisMonth || 120000 },
  ];

  const cashFlowData = [
    { day: '01 Aug', inflow: 100000, outflow: 14160 },
    { day: '05 Aug', inflow: 0, outflow: 45000 },
    { day: '08 Aug', inflow: 108000, outflow: 3500 },
    { day: '12 Aug', inflow: 100000, outflow: 2949 },
    { day: '15 Aug', inflow: 50000, outflow: 1850 },
  ];

  return (
    <div className="space-y-6">
      <SmartQuickEntryBar accounts={accounts} projects={projects} onTransactionCreated={onRefresh} />

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Income (Aug)</span>
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {formatINR(totalIncomeThisMonth)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+14.2% vs last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Expenses (Aug)</span>
            <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {formatINR(totalExpensesThisMonth)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center font-medium">
            <span>Operational overhead</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Net Profit</span>
            <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-lg sm:text-xl font-extrabold ${
              netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'
            }`}
          >
            {formatINR(netProfit)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Revenue minus expenses</div>
        </div>

        <div
          onClick={() => onNavigateTab('clients')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-indigo-400 transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Clients</span>
            <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {clients.length} Clients
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Mythri, Wizcraft & others</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('pending')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 hover:border-indigo-400 cursor-pointer transition shadow-sm"
        >
          <div className="text-xs text-slate-500 font-medium">Pending Income</div>
          <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatINR(pendingIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">3 unpaid invoices</div>
        </div>

        <div
          onClick={() => onNavigateTab('pending')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 hover:border-indigo-400 cursor-pointer transition shadow-sm"
        >
          <div className="text-xs text-slate-500 font-medium">Pending Payables</div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
            {formatINR(pendingExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Vendor bills due</div>
        </div>

        <div
          onClick={() => onNavigateTab('gst-tds')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 hover:border-indigo-400 cursor-pointer transition shadow-sm"
        >
          <div className="text-xs text-slate-500 font-medium">GST Position</div>
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {formatINR(gstPosition)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Net liability (Output - ITC)</div>
        </div>

        <div
          onClick={() => onNavigateTab('gst-tds')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 hover:border-indigo-400 cursor-pointer transition shadow-sm"
        >
          <div className="text-xs text-slate-500 font-medium">TDS Receivable</div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(tdsReceivable)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Withheld by clients</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Income vs Expenses Breakdown
              </h3>
              <p className="text-xs text-slate-500">6-Month Trend Overview</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => formatINR(Number(value))} />
                <Bar dataKey="Income" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Cash Flow Movement
              </h3>
              <p className="text-xs text-slate-500">Inflow vs Outflow over time</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => formatINR(Number(value))} />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="outflow" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Pending Receivables (Invoices)
            </h3>
            <button
              onClick={() => onNavigateTab('pending')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {invoices
              .filter((i) => i.pendingAmount > 0)
              .map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                return (
                  <div
                    key={inv.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {client?.name || 'Client'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {inv.invoiceNumber} • Due {inv.dueDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-amber-600 dark:text-amber-400">
                        {formatINR(inv.pendingAmount)}
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Recent Transactions
            </h3>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {tx.description}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tx.date} • {tx.type}
                  </div>
                </div>
                <div
                  className={`font-extrabold ${
                    tx.type === 'INCOME'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : tx.type === 'EXPENSE'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-blue-600'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                  {formatINR(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
