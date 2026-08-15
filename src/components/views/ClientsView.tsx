import React, { useState } from 'react';
import { FileText, Plus, Briefcase, Trash2, Building, X } from 'lucide-react';
import type { Client, Invoice, Project, Transaction } from '../../types';
import { formatINR } from '../../utils/financial';
import { exportReportToPDF } from '../../utils/export';
import { db } from '../../db/database';

interface ClientsViewProps {
  clients: Client[];
  invoices: Invoice[];
  projects: Project[];
  transactions: Transaction[];
  onOpenAddModal: (tab?: any) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  invoices,
  projects,
  transactions,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  
  // Modals state
  const [isAddClientOpen, setIsAddClientOpen] = useState<boolean>(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState<boolean>(false);

  // Add Client Form state
  const [clientNameInput, setClientNameInput] = useState<string>('');
  const [newGstin, setNewGstin] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');

  // Add Project Form state (No Budget field)
  const [newPrjName, setNewPrjName] = useState<string>('');
  const [newPrjCode, setNewPrjCode] = useState<string>('');
  const [newPrjDesc, setNewPrjDesc] = useState<string>('');

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const clientInvoices = invoices.filter((i) => i.clientId === selectedClientId);
  const clientTxs = transactions.filter((t) => t.clientId === selectedClientId);
  const clientProjects = projects.filter((p) => p.clientId === selectedClientId);

  const totalInvoiced = clientInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalRevenue = clientInvoices.reduce((s, i) => s + i.baseAmount, 0);
  const totalReceived = clientInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalPending = clientInvoices.reduce((s, i) => s + i.pendingAmount, 0);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameInput.trim()) return;

    const newId = `cli-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const cleanName = clientNameInput.trim();

    await db.clients.add({
      id: newId,
      name: cleanName,
      company: cleanName,
      gstin: newGstin.trim().toUpperCase() || undefined,
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined,
      createdAt: nowIso,
    });

    setSelectedClientId(newId);
    setClientNameInput('');
    setNewGstin('');
    setNewEmail('');
    setNewAddress('');
    setIsAddClientOpen(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrjName.trim() || !selectedClientId) return;

    const newId = `prj-${Date.now()}`;
    const autoCode = newPrjCode.trim().toUpperCase() || `PRJ-${Math.floor(100 + Math.random() * 900)}`;

    await db.projects.add({
      id: newId,
      name: newPrjName.trim(),
      code: autoCode,
      clientId: selectedClientId,
      description: newPrjDesc.trim() || undefined,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    setNewPrjName('');
    setNewPrjCode('');
    setNewPrjDesc('');
    setIsAddProjectOpen(false);
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client? Associated projects will also be updated.')) {
      await db.clients.delete(id);
      const remaining = clients.filter((c) => c.id !== id);
      if (remaining.length > 0) setSelectedClientId(remaining[0].id);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await db.projects.delete(id);
    }
  };

  const handleExportClientLedger = () => {
    if (!selectedClient) return;
    const headers = ['Date', 'Type', 'Description', 'Base Revenue', 'GST', 'TDS', 'Total Amount (₹)'];
    const rows = clientTxs.map((t) => [
      t.date,
      t.type,
      t.description,
      formatINR(t.baseAmount || t.amount, false),
      formatINR((t.gst?.cgst || 0) + (t.gst?.sgst || 0) + (t.gst?.igst || 0), false),
      formatINR(t.tds?.amount || 0, false),
      formatINR(t.amount, false),
    ]);

    exportReportToPDF(
      `CLIENT LEDGER - ${selectedClient.name.toUpperCase()}`,
      `GSTIN: ${selectedClient.gstin || 'N/A'} • PAN: ${selectedClient.pan || 'N/A'}`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Clients & Client-Linked Projects Manager
          </h3>
          <p className="text-xs text-slate-500">Manage clients, events, and projects</p>
        </div>
        <button
          onClick={() => setIsAddClientOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Directory List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm h-fit">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center">
              <Building className="w-4 h-4 text-indigo-500 mr-1.5" />
              <span>Client Directory</span>
            </h4>
            <span className="text-xs font-semibold text-slate-500">{clients.length} Clients</span>
          </div>

          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            {clients.map((c) => {
              const isSelected = c.id === selectedClientId;
              const cInvs = invoices.filter((i) => i.clientId === c.id);
              const cPending = cInvs.reduce((s, i) => s + i.pendingAmount, 0);
              const cPrjs = projects.filter((p) => p.clientId === c.id);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-xs">{c.name}</div>
                      {c.name !== c.company && <div className="text-[11px] text-slate-500">{c.company}</div>}
                    </div>
                    {isSelected && clients.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(c.id);
                        }}
                        title="Delete Client"
                        className="p-1 text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {cPrjs.length} Projects/Events
                    </span>
                    <span
                      className={`font-bold ${
                        cPending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
                      }`}
                    >
                      {cPending > 0 ? `Pending: ${formatINR(cPending)}` : 'Clear'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Client Ledger & Projects Manager */}
        {selectedClient && (
          <div className="lg:col-span-2 space-y-5">
            {/* Client Summary Banner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                    {selectedClient.name}
                  </h3>
                  {selectedClient.gstin && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                      GSTIN: {selectedClient.gstin}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleExportClientLedger}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export Ledger</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-500 text-[11px]">Total Sales Revenue</div>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {formatINR(totalRevenue)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Total Invoiced</div>
                  <div className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {formatINR(totalInvoiced)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Amount Received</div>
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatINR(totalReceived)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Pending Balance</div>
                  <div className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatINR(totalPending)}
                  </div>
                </div>
              </div>
            </div>

            {/* CLIENT-LINKED PROJECTS / EVENTS MANAGEMENT CARD WITH SMOOTH SCROLLING */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center">
                    <Briefcase className="w-4 h-4 text-indigo-600 mr-2" />
                    <span>Projects & Events for {selectedClient.name} ({clientProjects.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">Events & Software Projects managed for this client</p>
                </div>
                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Project / Event</span>
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clientProjects.length > 0 ? (
                    clientProjects.map((p) => {
                      const pTxs = transactions.filter((t) => t.projectId === p.id);
                      const pRevenue = pTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);

                      return (
                        <div
                          key={p.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2 relative group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                {p.code}
                              </span>
                              <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                                {p.name}
                              </h5>
                            </div>
                            <button
                              onClick={() => handleDeleteProject(p.id)}
                              className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {p.description && <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500">Revenue Recorded:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {formatINR(pRevenue)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="sm:col-span-2 p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No projects or events added yet for {selectedClient.name}. Click "+ Add Project / Event" above to create one.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client Statement Ledger */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>Client Statement Ledger ({clientTxs.length} Transactions)</span>
              </div>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-slate-500">
                      <th className="p-3 font-bold">Date</th>
                      <th className="p-3 font-bold">Description</th>
                      <th className="p-3 font-bold text-right">Base Revenue</th>
                      <th className="p-3 font-bold text-right">TDS (10%)</th>
                      <th className="p-3 font-bold text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {clientTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-500">{tx.date}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {tx.description}
                        </td>
                        <td className="p-3 text-right font-mono">{formatINR(tx.baseAmount || tx.amount)}</td>
                        <td className="p-3 text-right font-mono text-amber-600">
                          {formatINR(tx.tds?.amount || 0)}
                        </td>
                        <td className="p-3 text-right font-extrabold text-emerald-600 font-mono">
                          +{formatINR(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD CLIENT */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">+ Add New Client</h3>
              <button onClick={() => setIsAddClientOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Client / Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mythri Movie Makers"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="36AAACM1234F1Z9"
                  value={newGstin}
                  onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="accounts@client.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Address (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Billing address..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(false)}
                  className="px-4 py-2 text-slate-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PROJECT / EVENT FOR SELECTED CLIENT (REMOVED BUDGET FIELD, ENHANCED SCROLLING) */}
      {isAddProjectOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                + Add Project / Event for {selectedClient.name}
              </h3>
              <button onClick={() => setIsAddProjectOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Project / Event Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Film Production B / Sunburn Concert 2026"
                  value={newPrjName}
                  onChange={(e) => setNewPrjName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Project Code / Reference ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MMM-04"
                  value={newPrjCode}
                  onChange={(e) => setNewPrjCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Description / Event Details (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Details about this movie, event, or software contract..."
                  value={newPrjDesc}
                  onChange={(e) => setNewPrjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(false)}
                  className="px-4 py-2 text-slate-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save Project / Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
