import React from 'react';
import { Wallet, ArrowRightLeft, Landmark } from 'lucide-react';
import type { Account, Transaction } from '../../types';
import { formatINR } from '../../utils/financial';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onOpenAddModal: (tab?: any) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onOpenAddModal,
}) => {
  const totalLiquidBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-xs text-indigo-300 font-semibold uppercase">Total Liquid Capital</div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-1">{formatINR(totalLiquidBalance)}</div>
          <p className="text-xs text-slate-400 mt-1">Across 5 business accounts</p>
        </div>

        <button
          onClick={() => onOpenAddModal('TRANSFER')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transfer Money (Internal)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          return (
            <div
              key={acc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                    {acc.type === 'BANK' ? <Landmark className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{acc.name}</h4>
                    <p className="text-[11px] text-slate-500">{acc.accountNumber || acc.type}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">Current Balance</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatINR(acc.balance)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-500 text-[11px]">Total Inflow</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatINR(acc.inflow)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Total Outflow</div>
                  <div className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {formatINR(acc.outflow)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
