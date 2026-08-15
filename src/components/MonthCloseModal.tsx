import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, ShieldCheck } from 'lucide-react';
import { db } from '../db/database';
import { formatINR } from '../utils/financial';
import type { Transaction } from '../types';

interface MonthCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onStatusChange: () => void;
}

export const MonthCloseModal: React.FC<MonthCloseModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onStatusChange,
}) => {
  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      checkMonthStatus();
    }
  }, [isOpen]);

  const checkMonthStatus = async () => {
    const record = await db.monthClosures.get(currentMonthYear);
    if (record) {
      setIsClosed(record.isClosed);
    } else {
      setIsClosed(false);
    }
  };

  if (!isOpen) return null;

  const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonthYear));
  const incomeTxs = monthTxs.filter((t) => t.type === 'INCOME');
  const expenseTxs = monthTxs.filter((t) => t.type === 'EXPENSE');

  const totalRevenue = incomeTxs.reduce((sum, t) => sum + (t.baseAmount || t.amount), 0);
  const totalExpenses = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleToggleClose = async () => {
    setIsProcessing(true);
    try {
      const nextStatus = !isClosed;
      await db.monthClosures.put({
        id: currentMonthYear,
        monthYear: currentMonthYear,
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: netProfit,
        gstPosition: 0,
        tdsPosition: 0,
        closedAt: new Date().toISOString(),
        closedBy: 'Owner',
        isClosed: nextStatus,
      });

      setIsClosed(nextStatus);
      onStatusChange();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Month Closing Management ({currentMonthYear})
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Total Revenue:</span>
              <span className="font-bold text-emerald-600">{formatINR(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Total Expenses:</span>
              <span className="font-bold text-rose-600">{formatINR(totalExpenses)}</span>
            </div>
            <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
              <span>Net Profit:</span>
              <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatINR(netProfit)}
              </span>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
              isClosed
                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {isClosed ? <Lock className="w-5 h-5 mt-0.5" /> : <Unlock className="w-5 h-5 mt-0.5" />}
            <div>
              <p className="font-bold">
                {isClosed ? 'Month is CLOSED & LOCKED' : 'Month is OPEN for Editing'}
              </p>
              <p className="mt-0.5 opacity-90">
                {isClosed
                  ? 'Financial records for this month are locked to prevent accidental modifications or audit discrepancies.'
                  : 'You can add, edit, or remove financial transactions for this month.'}
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Close
            </button>
            <button
              onClick={handleToggleClose}
              disabled={isProcessing}
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-lg transition flex items-center space-x-1.5 ${
                isClosed
                  ? 'bg-slate-700 hover:bg-slate-600'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{isProcessing ? 'Updating...' : isClosed ? 'Reopen Month' : 'Mark Month Closed'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
