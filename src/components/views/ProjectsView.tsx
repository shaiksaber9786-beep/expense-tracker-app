import React, { useState } from 'react';
import { PieChart, Filter } from 'lucide-react';
import type { Project, Transaction, Client } from '../../types';
import { formatINR } from '../../utils/financial';
import { exportReportToPDF } from '../../utils/export';

interface ProjectsViewProps {
  projects: Project[];
  transactions: Transaction[];
  clients?: Client[];
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  transactions,
  clients = [],
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');

  const filteredProjects = selectedClientId === 'ALL'
    ? projects
    : projects.filter((p) => p.clientId === selectedClientId);

  const projectMetrics = filteredProjects.map((p) => {
    const pTxs = transactions.filter((t) => t.projectId === p.id);
    const revenue = pTxs
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + (t.baseAmount || t.amount), 0);

    const expenses = pTxs
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0);

    const profit = revenue - expenses;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';

    const clientObj = clients.find((c) => c.id === p.clientId);

    return {
      project: p,
      clientName: clientObj?.name || 'General / Internal Project',
      revenue,
      expenses,
      profit,
      margin,
      txCount: pTxs.length,
    };
  });

  const handleExportProjectPnl = () => {
    const headers = ['Project Code', 'Project Name', 'Client', 'Revenue (₹)', 'Expenses (₹)', 'Net Profit (₹)', 'Margin (%)'];
    const rows = projectMetrics.map((pm) => [
      pm.project.code,
      pm.project.name,
      pm.clientName,
      formatINR(pm.revenue, false),
      formatINR(pm.expenses, false),
      formatINR(pm.profit, false),
      `${pm.margin}%`,
    ]);

    exportReportToPDF('PROJECT PROFITABILITY REPORT', 'Client-wise Event & Project P&L breakdown for Qasber Technologies LLP', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Event & Project Profitability Center
          </h3>
          <p className="text-xs text-slate-500">Client-segregated event & project P&L breakdown</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Client Filter */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Clients Projects</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportProjectPnl}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md whitespace-nowrap"
          >
            <PieChart className="w-4 h-4" />
            <span>Export P&L Report</span>
          </button>
        </div>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projectMetrics.map((pm) => {
          const isProfitable = pm.profit >= 0;
          return (
            <div
              key={pm.project.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-500/50 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                      {pm.project.code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                      {pm.clientName}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-2">
                    {pm.project.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{pm.project.description}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    isProfitable
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                  }`}
                >
                  {pm.margin}% Margin
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-500 text-[11px]">Revenue</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatINR(pm.revenue)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Expenses</div>
                  <div className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {formatINR(pm.expenses)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Net Profit</div>
                  <div
                    className={`font-bold mt-0.5 ${
                      isProfitable ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'
                    }`}
                  >
                    {formatINR(pm.profit)}
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
