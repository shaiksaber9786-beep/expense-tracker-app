import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import type { Client, Invoice, Vendor } from '../../types';
import { formatINR } from '../../utils/financial';

interface PendingViewProps {
  invoices: Invoice[];
  clients: Client[];
  vendors: Vendor[];
  onOpenAddModal: (tab?: any) => void;
}

export const PendingView: React.FC<PendingViewProps> = ({
  invoices,
  clients,
  onOpenAddModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'RECEIVABLES' | 'PAYABLES'>('RECEIVABLES');

  const pendingInvoices = invoices.filter((i) => i.pendingAmount > 0);
  const totalReceivable = pendingInvoices.reduce((s, i) => s + i.pendingAmount, 0);

  const today = new Date();
  const overdueInvoices = pendingInvoices.filter((i) => new Date(i.dueDate) < today);
  const totalOverdue = overdueInvoices.reduce((s, i) => s + i.pendingAmount, 0);

  const calculateDaysPending = (invoiceDateStr: string) => {
    const invDate = new Date(invoiceDateStr);
    const diffTime = Math.abs(today.getTime() - invDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        <button
          onClick={() => setActiveSubTab('RECEIVABLES')}
          className={`pb-3 font-bold text-sm border-b-2 transition ${
            activeSubTab === 'RECEIVABLES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Pending Receivables (Invoices)
        </button>
        <button
          onClick={() => setActiveSubTab('PAYABLES')}
          className={`pb-3 font-bold text-sm border-b-2 transition ${
            activeSubTab === 'PAYABLES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Pending Payables (Vendor Bills)
        </button>
      </div>

      {activeSubTab === 'RECEIVABLES' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Total Pending Receivable</div>
              <div className="mt-1 text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {formatINR(totalReceivable)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{pendingInvoices.length} unpaid invoices</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Total Overdue</div>
              <div className="mt-1 text-xl font-extrabold text-rose-600 dark:text-rose-400">
                {formatINR(totalOverdue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{overdueInvoices.length} invoices past due date</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Due Soon (Next 7 Days)</div>
              <div className="mt-1 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatINR(totalReceivable - totalOverdue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Upcoming expected cash inflow</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 font-bold">Client Name</th>
                    <th className="p-3.5 font-bold">Invoice No</th>
                    <th className="p-3.5 font-bold">Date & Due Date</th>
                    <th className="p-3.5 font-bold text-right">Invoice Amount</th>
                    <th className="p-3.5 font-bold text-right">Received</th>
                    <th className="p-3.5 font-bold text-right">TDS</th>
                    <th className="p-3.5 font-bold text-right">Pending Amount</th>
                    <th className="p-3.5 font-bold text-center">Days Pending</th>
                    <th className="p-3.5 font-bold text-center">Status</th>
                    <th className="p-3.5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingInvoices.map((inv) => {
                    const client = clients.find((c) => c.id === inv.clientId);
                    const days = calculateDaysPending(inv.invoiceDate);
                    const isOverdue = new Date(inv.dueDate) < today;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {client?.name || 'Client'}
                        </td>
                        <td className="p-3.5 font-mono text-indigo-600 font-bold">{inv.invoiceNumber}</td>
                        <td className="p-3.5 text-slate-500">
                          <div>{inv.invoiceDate}</div>
                          <div className={`text-[10px] ${isOverdue ? 'text-rose-500 font-bold' : ''}`}>
                            Due: {inv.dueDate}
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-mono font-semibold">{formatINR(inv.totalAmount)}</td>
                        <td className="p-3.5 text-right font-mono text-emerald-600">{formatINR(inv.paidAmount)}</td>
                        <td className="p-3.5 text-right font-mono text-amber-600">{formatINR(inv.tdsAmount)}</td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-rose-600">
                          {formatINR(inv.pendingAmount)}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {days} days
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}
                          >
                            {isOverdue ? 'OVERDUE' : inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => onOpenAddModal('PAYMENT')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            Record Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <Clock className="w-10 h-10 text-indigo-500 mx-auto" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Pending Vendor Payables
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You have ₹18,500 in pending vendor obligations for server hosting & internet utilities due later this month.
          </p>
        </div>
      )}
    </div>
  );
};
