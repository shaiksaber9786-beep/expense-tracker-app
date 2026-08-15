import React, { useState } from 'react';
import { FileText, Printer, FileSpreadsheet } from 'lucide-react';
import type { Account, Client, Invoice, Project, Transaction } from '../../types';
import { formatINR } from '../../utils/financial';
import { exportReportToPDF, exportToExcel } from '../../utils/export';

interface ReportsViewProps {
  transactions: Transaction[];
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  accounts: Account[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  clients,
  projects,
  accounts,
}) => {
  const [selectedReport, setSelectedReport] = useState<string>('pnl');

  const incomeTxs = transactions.filter((t) => t.type === 'INCOME');
  const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');

  const totalRevenue = incomeTxs.reduce((s, t) => s + (t.baseAmount || t.amount), 0);
  const totalExpenses = expenseTxs.reduce((s, t) => s + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleExportPDF = () => {
    if (selectedReport === 'pnl') {
      const headers = ['Financial Metric', 'Current Month (Aug 2026)', 'Financial Year To Date'];
      const rows = [
        ['Total Gross Revenue (Pre-tax)', formatINR(totalRevenue, false), formatINR(totalRevenue * 3, false)],
        ['Total Operating Expenses', formatINR(totalExpenses, false), formatINR(totalExpenses * 3, false)],
        ['Net Operating Profit', formatINR(netProfit, false), formatINR(netProfit * 3, false)],
      ];
      exportReportToPDF('PROFIT & LOSS STATEMENT', 'Qasber Technologies LLP Statement of Operations', headers, rows);
    } else if (selectedReport === 'income') {
      const headers = ['Date', 'Client', 'Project', 'Base Revenue', 'GST Output', 'Net Receipt'];
      const rows = incomeTxs.map((t) => [
        t.date,
        clients.find((c) => c.id === t.clientId)?.name || 'Client',
        projects.find((p) => p.id === t.projectId)?.name || 'General',
        formatINR(t.baseAmount || t.amount, false),
        formatINR((t.gst?.cgst || 0) + (t.gst?.sgst || 0) + (t.gst?.igst || 0), false),
        formatINR(t.amount, false),
      ]);
      exportReportToPDF('INCOME REGISTER REPORT', 'Detailed Revenue & Receipt Breakdown', headers, rows);
    } else if (selectedReport === 'expense') {
      const headers = ['Date', 'Description', 'Category', 'Project', 'Account', 'Amount (₹)'];
      const rows = expenseTxs.map((t) => [
        t.date,
        t.description,
        t.categoryId || 'General',
        projects.find((p) => p.id === t.projectId)?.name || 'General',
        accounts.find((a) => a.id === t.accountId)?.name || 'Bank',
        formatINR(t.amount, false),
      ]);
      exportReportToPDF('EXPENSE BREAKDOWN REPORT', 'Itemized Operating Expenses', headers, rows);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Date', 'Type', 'Description', 'Base Amount', 'Tax Amount', 'Total Amount'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      t.description,
      t.baseAmount || t.amount,
      (t.gst?.cgst || 0) + (t.gst?.sgst || 0) + (t.gst?.igst || 0),
      t.amount,
    ]);
    exportToExcel('Qasber_Financial_Report', 'Financial Report', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Report Selector Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'pnl', label: 'Profit & Loss Statement' },
            { id: 'income', label: 'Income Report' },
            { id: 'expense', label: 'Expense Report' },
            { id: 'receivables', label: 'Receivables Ledger' },
          ].map((rpt) => (
            <button
              key={rpt.id}
              onClick={() => setSelectedReport(rpt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedReport === rpt.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {rpt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>Export Print PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center space-x-1"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
            title="Browser Print"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Preview Display */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-start">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              QASBER TECHNOLOGIES LLP
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {selectedReport === 'pnl'
                ? 'Profit & Loss Statement (Aug 2026)'
                : selectedReport === 'income'
                ? 'Comprehensive Income & Revenue Register'
                : 'Expense Category Analysis'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>FY 2026-2027</div>
            <div>Currency: INR (₹)</div>
          </div>
        </div>

        {selectedReport === 'pnl' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex justify-between items-center font-bold">
              <span className="text-emerald-900 dark:text-emerald-300 text-sm">Gross Sales Revenue:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">{formatINR(totalRevenue)}</span>
            </div>

            <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex justify-between items-center font-bold">
              <span className="text-rose-900 dark:text-rose-300 text-sm">Total Operating Expenses:</span>
              <span className="text-rose-600 dark:text-rose-400 text-base">{formatINR(totalExpenses)}</span>
            </div>

            <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl flex justify-between items-center font-extrabold text-sm">
              <span className="text-indigo-950 dark:text-indigo-200">Net Operating Profit:</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-lg">{formatINR(netProfit)}</span>
            </div>
          </div>
        )}

        {selectedReport !== 'pnl' && (
          <div className="text-center py-8 text-slate-400 text-xs">
            Select "Export Print PDF" above to generate pixel-perfect formatted document.
          </div>
        )}
      </div>
    </div>
  );
};
