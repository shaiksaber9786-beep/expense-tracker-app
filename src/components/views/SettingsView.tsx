import React, { useState } from 'react';
import { Database, Trash2, RefreshCw } from 'lucide-react';
import type { Category, CompanyProfile, TaxRule } from '../../types';
import { db, clearAllDatabaseData } from '../../db/database';

interface SettingsViewProps {
  companyProfile: CompanyProfile;
  categories: Category[];
  taxRules: TaxRule[];
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyProfile,
  categories,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'COMPANY' | 'CATEGORIES' | 'TAX' | 'SECURITY' | 'BACKUP'>('COMPANY');

  const [profile, setProfile] = useState<CompanyProfile>(companyProfile);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.companyProfile.put(profile);
    alert('Company profile updated successfully.');
    onRefresh();
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const catId = `cat-user-${Date.now()}`;
    await db.categories.add({
      id: catId,
      name: newCatName.trim(),
      type: newCatType,
    });
    setNewCatName('');
    onRefresh();
  };

  const handleDeleteCategory = async (id: string) => {
    await db.categories.delete(id);
    onRefresh();
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all transactions, invoices, and start with a clean slate?')) {
      await clearAllDatabaseData();
      alert('All sample test data cleared! Your database is now 100% clean and ready for your real records.');
      onRefresh();
    }
  };

  const handleExportDatabaseJSON = async () => {
    const txs = await db.transactions.toArray();
    const invs = await db.invoices.toArray();
    const accs = await db.accounts.toArray();
    const backupData = { companyProfile: profile, transactions: txs, invoices: invs, accounts: accs };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Qasber_Finance_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Subtabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4 overflow-x-auto">
        {[
          { id: 'COMPANY', label: 'Company Profile' },
          { id: 'CATEGORIES', label: 'Categories' },
          { id: 'TAX', label: 'Tax Rules' },
          { id: 'SECURITY', label: 'Roles & Security' },
          { id: 'BACKUP', label: 'Data & Privacy Reset' },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveTab(st.id as any)}
            className={`pb-3 font-bold text-xs sm:text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === st.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {activeTab === 'COMPANY' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Company Settings</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">GSTIN</label>
              <input
                type="text"
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">PAN Number</label>
              <input
                type="text"
                value={profile.pan}
                onChange={(e) => setProfile({ ...profile, pan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Financial Year</label>
              <input
                type="text"
                value={profile.financialYear}
                onChange={(e) => setProfile({ ...profile, financialYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">Address</label>
            <textarea
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              rows={2}
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Save Profile
          </button>
        </form>
      )}

      {activeTab === 'CATEGORIES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Editable Categories</h4>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="New category name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
            >
              Add
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {categories.map((cat) => (
              <div key={cat.id} className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">{cat.name} ({cat.type})</span>
                {!cat.isDefault && (
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'BACKUP' && (
        <div className="space-y-4 max-w-xl text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center">
              <Database className="w-4 h-4 text-emerald-500 mr-2" />
              <span>Local Database JSON Export</span>
            </h4>
            <p className="text-slate-500">Export your local offline-first financial data into JSON format for secure backup.</p>
            <button
              onClick={handleExportDatabaseJSON}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm flex items-center">
              <RefreshCw className="w-4 h-4 text-rose-600 mr-2" />
              <span>Clear Sample Test Data (Fresh Start)</span>
            </h4>
            <p className="text-rose-700 dark:text-rose-400">
              Clear all test sample transactions, test invoices, and start with 0 entries on a clean slate.
            </p>
            <button
              onClick={handleClearAllData}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Sample Test Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
