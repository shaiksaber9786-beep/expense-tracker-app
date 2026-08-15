import React, { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import type { Account, Category, Client, Project, Transaction, Vendor } from '../../types';
import { formatINR } from '../../utils/financial';
import { exportReportToPDF, exportToExcel } from '../../utils/export';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  projects: Project[];
  clients: Client[];
  vendors: Vendor[];
  searchTerm: string;
  onOpenAddModal: (tab?: any) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  projects,
  searchTerm,
}) => {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  const filtered = transactions.filter((t) => {
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
    if (projectFilter !== 'ALL' && t.projectId !== projectFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchAmt = t.amount.toString().includes(q);
      return matchDesc || matchAmt;
    }
    return true;
  });

  const handleExportPDF = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Project', 'Amount (₹)'];
    const rows = filtered.map((t) => [
      t.date,
      t.type,
      t.description,
      categories.find((c) => c.id === t.categoryId)?.name || 'General',
      projects.find((p) => p.id === t.projectId)?.name || 'General',
      formatINR(t.amount, false),
    ]);
    exportReportToPDF('TRANSACTION LEDGER REPORT', 'Complete ledger history of Qasber Technologies LLP', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Account', 'Project', 'GST Rate', 'TDS Amount'];
    const rows = filtered.map((t) => [
      t.date,
      t.type,
      t.description,
      t.amount,
      accounts.find((a) => a.id === t.accountId)?.name || '',
      projects.find((p) => p.id === t.projectId)?.name || '',
      t.gst?.rate || 0,
      t.tds?.amount || 0,
    ]);
    exportToExcel('Qasber_Transactions', 'Transactions', headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter Chips */}
          {['ALL', 'INCOME', 'EXPENSE', 'TRANSFER'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTypeFilter(tf as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === tf
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>PDF Export</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 font-bold">Date</th>
                <th className="p-3.5 font-bold">Type</th>
                <th className="p-3.5 font-bold">Description</th>
                <th className="p-3.5 font-bold">Account</th>
                <th className="p-3.5 font-bold">Project</th>
                <th className="p-3.5 font-bold">Tax Details</th>
                <th className="p-3.5 font-bold text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const prj = projects.find((p) => p.id === tx.projectId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{tx.date}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            tx.type === 'INCOME'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : tx.type === 'EXPENSE'
                              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{acc?.name || 'Account'}</td>
                      <td className="p-3.5 font-medium text-indigo-600 dark:text-indigo-400">
                        {prj?.name || 'General'}
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-500">
                        {tx.gst?.applicable && <span className="mr-1.5">GST {tx.gst.rate}%</span>}
                        {tx.tds?.applicable && <span>TDS {tx.tds.section}</span>}
                        {!tx.gst?.applicable && !tx.tds?.applicable && <span className="opacity-40">-</span>}
                      </td>
                      <td
                        className={`p-3.5 text-right font-extrabold text-sm font-mono ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'EXPENSE'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                        {formatINR(tx.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
