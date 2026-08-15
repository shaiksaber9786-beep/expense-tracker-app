import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import type { Client, Invoice, Project, Transaction } from '../../types';
import { formatINR } from '../../utils/financial';
import { exportReportToPDF } from '../../utils/export';

interface IncomeViewProps {
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  onOpenAddModal: (tab?: any) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  invoices,
  clients,
  projects,
  onOpenAddModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID'>('ALL');

  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalRevenue = invoices.reduce((s, i) => s + i.baseAmount, 0);
  const totalReceived = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalPending = invoices.reduce((s, i) => s + i.pendingAmount, 0);
  const totalTDS = invoices.reduce((s, i) => s + i.tdsAmount, 0);

  const filteredInvoices = invoices.filter((i) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return i.status === 'PENDING' || i.pendingAmount === i.netReceivable;
    if (statusFilter === 'PARTIALLY_PAID') return i.status === 'PARTIALLY_PAID';
    if (statusFilter === 'PAID') return i.status === 'PAID' || i.pendingAmount === 0;
    return true;
  });

  const handleExportInvoicesPDF = () => {
    const headers = ['Invoice No', 'Date', 'Client', 'Base Amount', 'GST', 'Total', 'TDS', 'Paid', 'Pending', 'Status'];
    const rows = filteredInvoices.map((i) => {
      const client = clients.find((c) => c.id === i.clientId);
      return [
        i.invoiceNumber,
        i.invoiceDate,
        client?.name || '',
        formatINR(i.baseAmount, false),
        formatINR(i.totalAmount - i.baseAmount, false),
        formatINR(i.totalAmount, false),
        formatINR(i.tdsAmount, false),
        formatINR(i.paidAmount, false),
        formatINR(i.pendingAmount, false),
        i.status,
      ];
    });
    exportReportToPDF('INVOICE REGISTER REPORT', 'Invoice Register Report for Qasber Technologies LLP', headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Net Revenue</div>
          <div className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
            {formatINR(totalRevenue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pre-tax sales revenue</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Invoiced</div>
          <div className="mt-1 text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatINR(totalInvoiced)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Includes GST output</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Cash Received</div>
          <div className="mt-1 text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatINR(totalReceived)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deposited into accounts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Pending Receivables</div>
          <div className="mt-1 text-lg font-extrabold text-amber-600 dark:text-amber-400">
            {formatINR(totalPending)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Due from clients</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">TDS Withheld</div>
          <div className="mt-1 text-lg font-extrabold text-blue-600 dark:text-blue-400">
            {formatINR(totalTDS)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sec 194J/194C credits</div>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Client Invoices & Receivables
          </h3>
          <p className="text-xs text-slate-500">Filter invoices by payment status</p>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto pb-1 sm:pb-0">
          {/* STATUS FILTER BUTTONS */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
            {[
              { id: 'ALL', label: 'All Invoices' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
              { id: 'PAID', label: 'Received / Paid' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportInvoicesPDF}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => onOpenAddModal('INVOICE')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 font-bold">Invoice No</th>
                <th className="p-3.5 font-bold">Date</th>
                <th className="p-3.5 font-bold">Client Name</th>
                <th className="p-3.5 font-bold">Project</th>
                <th className="p-3.5 font-bold text-right">Base Revenue</th>
                <th className="p-3.5 font-bold text-right">GST</th>
                <th className="p-3.5 font-bold text-right">TDS (10%)</th>
                <th className="p-3.5 font-bold text-right">Net Rec.</th>
                <th className="p-3.5 font-bold text-right">Pending</th>
                <th className="p-3.5 font-bold text-center">Status</th>
                <th className="p-3.5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const client = clients.find((c) => c.id === inv.clientId);
                  const prj = projects.find((p) => p.id === inv.projectId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {inv.invoiceDate}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {client?.name || 'Client'}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{prj?.name || 'General'}</td>
                      <td className="p-3.5 text-right font-mono font-semibold">{formatINR(inv.baseAmount)}</td>
                      <td className="p-3.5 text-right font-mono text-indigo-600">
                        +{formatINR(inv.totalAmount - inv.baseAmount)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-amber-600">
                        -{formatINR(inv.tdsAmount)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold">{formatINR(inv.netReceivable)}</td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-rose-600">
                        {formatINR(inv.pendingAmount)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                          }`}
                        >
                          {inv.status === 'PAID' ? 'RECEIVED' : inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {inv.pendingAmount > 0 && (
                          <button
                            onClick={() => onOpenAddModal('INCOME')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                          >
                            Receive Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-slate-400 text-xs">
                    No invoices match the selected status filter ({statusFilter}).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
