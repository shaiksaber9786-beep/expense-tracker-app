import React, { useState } from 'react';
import { Plus, CheckCircle, Zap, Check } from 'lucide-react';
import type { Account, Category, Project, Transaction, Vendor } from '../../types';
import { formatINR } from '../../utils/financial';
import { exportReportToPDF } from '../../utils/export';
import { db } from '../../db/database';

interface ExpensesViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  vendors: Vendor[];
  projects: Project[];
  onOpenAddModal: (tab?: any) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  transactions,
  categories,
  accounts,
  vendors,
  projects,
  onOpenAddModal,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [businessOnly, setBusinessOnly] = useState<boolean>(false);

  // QUICK EXPENSE LOGGING BAR STATE
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>('cat-office');
  const [quickNote, setQuickNote] = useState<string>('');
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);

  const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');

  const filtered = expenseTxs.filter((t) => {
    if (selectedCat !== 'ALL' && t.categoryId !== selectedCat) return false;
    if (businessOnly && !t.isBusinessExpense) return false;
    return true;
  });

  const totalExpenseAmount = filtered.reduce((s, t) => s + t.amount, 0);
  const businessExpenseAmount = filtered.filter((t) => t.isBusinessExpense).reduce((s, t) => s + t.amount, 0);
  const eligibleItcAmount = filtered
    .filter((t) => t.gst?.applicable && t.gst?.itcEligible === 'YES')
    .reduce((s, t) => s + ((t.gst?.cgst || 0) + (t.gst?.sgst || 0) + (t.gst?.igst || 0)), 0);

  // DYNAMIC CATEGORY-SPECIFIC PRESET CHIPS
  const categoryPresets: Record<string, string[]> = {
    'cat-home': ['Dad', 'Mom', 'Nausheen', 'Sahil', 'Grocery', 'Milk & Provisions', 'Electricity / Maintenance'],
    'cat-saber': ['Out with Friends', 'Shopping', 'Café & Snacks', 'Personal Outing', 'Fitness & Personal'],
    'cat-office': ['WiFi Bill', 'AI Subscription', 'Cable / Adapter', 'Office Snacks & Tea', 'Cloud Hosting', 'Stationery'],
    'cat-salary': ['Chandan', 'Hemant', 'Pavan', 'Karthik', 'Karan', 'Aziz'],
    'cat-others': ['Miscellaneous', 'Client Dinner', 'Emergency Repair', 'Travel Fare'],
  };

  const activePresets = categoryPresets[quickCategory] || categoryPresets['cat-office'];

  const handleQuickSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(quickAmount);
    if (!num || num <= 0) return;

    setIsQuickSaving(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();
      const txId = `tx-exp-${Date.now()}`;
      const targetAcc = accounts[0]?.id || 'acc-icici';

      const catObj = categories.find(c => c.id === quickCategory);
      const defaultDesc = catObj ? `${catObj.name} Expense` : 'Expense';

      await db.transactions.add({
        id: txId,
        date: todayStr,
        type: 'EXPENSE',
        categoryId: quickCategory,
        accountId: targetAcc,
        description: quickNote.trim() || defaultDesc,
        amount: num,
        baseAmount: num,
        createdAt: nowIso,
      });

      const acc = await db.accounts.get(targetAcc);
      if (acc) {
        await db.accounts.update(targetAcc, {
          balance: acc.balance - num,
          outflow: acc.outflow + num,
        });
      }

      setQuickAmount('');
      setQuickNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleExportExpensesPDF = () => {
    const headers = ['Date', 'Description', 'Category', 'Vendor', 'Project', 'Account', 'Amount (₹)'];
    const rows = filtered.map((t) => [
      t.date,
      t.description,
      categories.find((c) => c.id === t.categoryId)?.name || 'General',
      vendors.find((v) => v.id === t.vendorId)?.name || '-',
      projects.find((p) => p.id === t.projectId)?.name || 'General',
      accounts.find((a) => a.id === t.accountId)?.name || '-',
      formatINR(t.amount, false),
    ]);
    exportReportToPDF('EXPENSE REGISTER REPORT', 'Itemized list of business & operating expenses', headers, rows);
  };

  return (
    <div className="space-y-5 pb-16 lg:pb-0">
      {/* 3-SECOND ULTRA FAST EXPENSE LOGGING WIDGET WITH BIG MOBILES TOUCH TARGETS */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border border-rose-500/40 rounded-3xl text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-rose-400 animate-pulse" />
            <h4 className="font-black text-sm uppercase tracking-wide text-rose-300">
              Quick Expense Logger (3 Seconds)
            </h4>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
            🔒 100% Offline
          </span>
        </div>

        <form onSubmit={handleQuickSaveExpense} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* AMOUNT INPUT - BIG FONT FOR S24 ULTRA */}
            <div className="sm:col-span-4">
              <input
                type="number"
                step="any"
                placeholder="Amount (₹) *"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/90 border-2 border-rose-400/50 rounded-2xl text-lg font-extrabold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            {/* CATEGORY SELECTOR PILLS */}
            <div className="sm:col-span-8 flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'cat-home', label: 'Home' },
                { id: 'cat-office', label: 'Office' },
                { id: 'cat-salary', label: 'Salary' },
                { id: 'cat-saber', label: 'Saber' },
                { id: 'cat-others', label: 'Others' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setQuickCategory(cat.id);
                    setQuickNote('');
                  }}
                  className={`px-3.5 py-2.5 text-xs font-black rounded-xl border transition whitespace-nowrap active:scale-95 ${
                    quickCategory === cat.id
                      ? 'bg-rose-600 text-white border-rose-400 shadow-lg scale-[1.02]'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-rose-400/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Note / Reason (Select 1-tap preset below)..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={isQuickSaving || !quickAmount}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 whitespace-nowrap shadow-lg shadow-rose-600/40 disabled:opacity-50 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>{isQuickSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>

          {/* DYNAMIC CATEGORY PRESET CHIPS */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">
              {quickCategory === 'cat-home' ? 'Home Presets:' : quickCategory === 'cat-saber' ? 'Saber Presets:' : quickCategory === 'cat-office' ? 'Office Presets:' : quickCategory === 'cat-salary' ? 'Salary Presets:' : 'Presets:'}
            </span>
            {activePresets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setQuickNote(p)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition active:scale-95 ${
                  quickNote === p
                    ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-800 hover:bg-rose-950/60 text-slate-200 hover:text-white border-slate-700/60'
                }`}
              >
                + {p}
              </button>
            ))}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Outflow</div>
          <div className="mt-1 text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
            {formatINR(totalExpenseAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{filtered.length} entries</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Business Overhead</div>
          <div className="mt-1 text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
            {formatINR(businessExpenseAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tax deductible</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Eligible ITC Claim</div>
          <div className="mt-1 text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatINR(eligibleItcAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">GST input credit</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="ALL">All Categories</option>
            {categories
              .filter((c) => c.type === 'EXPENSE')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={businessOnly}
              onChange={(e) => setBusinessOnly(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <span>Business Only</span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExpensesPDF}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
          >
            PDF
          </button>
          <button
            onClick={() => onOpenAddModal('EXPENSE')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-lg shadow-rose-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>+ Full Form</span>
          </button>
        </div>
      </div>

      {/* MOBILE LIST CARDS VIEW FOR S24 ULTRA (RESPONSIVE) */}
      <div className="space-y-2.5 sm:hidden">
        {filtered.map((tx) => {
          const cat = categories.find((c) => c.id === tx.categoryId);
          return (
            <div
              key={tx.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                  {cat?.name || 'Expense'}
                </span>
                <span className="font-mono text-xs text-slate-400 font-semibold">{tx.date}</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white pr-2">
                  {tx.description}
                </h5>
                <span className="font-mono font-black text-base text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  -{formatINR(tx.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 font-bold">Date</th>
                <th className="p-3.5 font-bold">Category</th>
                <th className="p-3.5 font-bold">Description</th>
                <th className="p-3.5 font-bold">Vendor</th>
                <th className="p-3.5 font-bold">Project</th>
                <th className="p-3.5 font-bold">Business / GST</th>
                <th className="p-3.5 font-bold">ITC Status</th>
                <th className="p-3.5 font-bold text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const ven = vendors.find((v) => v.id === tx.vendorId);
                const prj = projects.find((p) => p.id === tx.projectId);
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-slate-500">{tx.date}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {cat?.name || 'Expense'}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{ven?.name || '-'}</td>
                    <td className="p-3.5 text-indigo-600 dark:text-indigo-400 font-medium">
                      {prj?.name || 'General'}
                    </td>
                    <td className="p-3.5">
                      {tx.isBusinessExpense ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                          Business ({tx.gst?.rate || 0}% GST)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
                          Personal / Direct
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {tx.gst?.itcEligible === 'YES' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Eligible
                        </span>
                      )}
                      {tx.gst?.itcEligible === 'NO' && (
                        <span className="text-rose-500 font-semibold text-[11px]">Ineligible</span>
                      )}
                      {!tx.gst?.itcEligible && <span className="opacity-40">-</span>}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-sm font-mono text-rose-600 dark:text-rose-400">
                      -{formatINR(tx.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
