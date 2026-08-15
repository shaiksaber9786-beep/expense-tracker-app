import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, FileText, CheckCircle2, DollarSign } from 'lucide-react';
import type { Account, Category, Client, Vendor, Project, Invoice } from '../types';
import { calculateGST, calculateTDS, calculateIncomeFromReceipt, formatINR } from '../utils/financial';
import { db } from '../db/database';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'INCOME' | 'EXPENSE' | 'INVOICE';
  accounts: Account[];
  categories?: Category[];
  clients: Client[];
  vendors?: Vendor[];
  projects: Project[];
  invoices: Invoice[];
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'EXPENSE',
  accounts,
  clients,
  projects,
  invoices,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'INCOME' | 'EXPENSE' | 'INVOICE'>(
    initialTab === 'INCOME' || initialTab === 'INVOICE' ? initialTab : 'EXPENSE'
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [otherCategoryName, setOtherCategoryName] = useState<string>('');
  
  // INVOICE NUMBER
  const defaultInvNum = `QAS/26-27/${String(invoices.length + 4).padStart(3, '0')}`;
  const [invoiceNumberInput, setInvoiceNumberInput] = useState<string>(defaultInvNum);

  // CLIENT & PROJECT SELECTION (SHARED & INTERCONNECTED)
  const [clientId, setClientId] = useState<string>('');
  const [otherClientName, setOtherClientName] = useState<string>('');
  const [hasProjectLink, setHasProjectLink] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [isCreatingNewProject, setIsCreatingNewProject] = useState<boolean>(false);

  // INCOME MODE: 'DIRECT' vs 'PENDING_INVOICE'
  const [incomeMode, setIncomeMode] = useState<'DIRECT' | 'PENDING_INVOICE'>('DIRECT');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  const [isBusinessExpense, setIsBusinessExpense] = useState<boolean>(false);
  const [gstApplicable, setGstApplicable] = useState<boolean>(false);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInterState, setIsInterState] = useState<boolean>(false);
  const [itcEligible, setItcEligible] = useState<'YES' | 'NO' | 'REVIEW'>('YES');
  const [vendorGstin, setVendorGstin] = useState<string>('');

  const [tdsApplicable, setTdsApplicable] = useState<boolean>(false);
  const [tdsSection, setTdsSection] = useState<string>('194C');
  const [tdsRate, setTdsRate] = useState<number>(2);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab === 'INCOME' || initialTab === 'INVOICE' || initialTab === 'EXPENSE') {
      setActiveTab(initialTab);
    } else {
      setActiveTab('EXPENSE');
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    setInvoiceNumberInput(`QAS/26-27/${String(invoices.length + 4).padStart(3, '0')}`);
  }, [invoices, isOpen]);

  useEffect(() => {
    if (activeTab === 'INCOME') {
      setGstRate(18);
      setTdsRate(2);
    } else if (activeTab === 'INVOICE') {
      setGstApplicable(true);
      setGstRate(18);
      setTdsApplicable(true);
      setTdsRate(10);
    }
  }, [activeTab]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts]);

  // Reset project selection when client changes to prevent cross-client project mingling
  useEffect(() => {
    setProjectId('');
    setIsCreatingNewProject(false);
    setNewProjectName('');
  }, [clientId]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const pendingInvoicesList = invoices.filter((i) => i.pendingAmount > 0);

  // Expense calculations
  const gstCalc = calculateGST(numAmount, gstApplicable ? gstRate : 0, isInterState);
  const tdsCalcAmount = tdsApplicable ? calculateTDS(numAmount, tdsRate) : 0;

  // Income reverse calculations
  const incomeCalc = calculateIncomeFromReceipt(
    numAmount,
    gstApplicable,
    gstRate,
    tdsApplicable,
    tdsRate,
    isInterState
  );

  // Filter projects belonging strictly to the currently selected client
  const clientProjects = projects.filter((p) => p.clientId === clientId);

  // Expense Categories: Home Expenses, Office Expenses, Salary, Saber Expenses, Others
  const expenseCategories = [
    { id: 'cat-home', name: 'Home Expenses' },
    { id: 'cat-office', name: 'Office Expenses' },
    { id: 'cat-salary', name: 'Salary' },
    { id: 'cat-saber', name: 'Saber Expenses' },
    { id: 'cat-others', name: 'Others' },
  ];

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(inv.pendingAmount.toString());
      setClientId(inv.clientId);
      if (inv.projectId) {
        setHasProjectLink(true);
        setProjectId(inv.projectId);
      }
      if (inv.gstApplicable) {
        setGstApplicable(true);
        setGstRate(inv.gstRate);
      }
      if (inv.tdsApplicable) {
        setTdsApplicable(true);
        if (inv.tdsRate) setTdsRate(inv.tdsRate);
      }
      setDescription(`Payment received for Invoice ${inv.invoiceNumber}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (activeTab === 'EXPENSE' && categoryId === 'cat-others' && !otherCategoryName.trim()) {
      setErrorMsg('Please specify what this Other category means.');
      return;
    }

    if (activeTab === 'INCOME' && incomeMode === 'PENDING_INVOICE' && !selectedInvoiceId) {
      setErrorMsg('Please select the pending invoice for which payment is being received.');
      return;
    }

    if ((activeTab === 'INCOME' || activeTab === 'INVOICE') && clientId === 'cli-others' && !otherClientName.trim()) {
      setErrorMsg('Please specify the Client Name.');
      return;
    }

    if (!description && activeTab !== 'INCOME' && activeTab !== 'INVOICE') {
      setErrorMsg('Please enter a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const targetAcc = accountId || accounts[0]?.id || '';

      // PERMANENT SAVE FOR CUSTOM CATEGORY
      let finalCatId = categoryId;
      if (activeTab === 'EXPENSE' && categoryId === 'cat-others' && otherCategoryName.trim()) {
        const newCatId = `cat-cust-${Date.now()}`;
        await db.categories.add({
          id: newCatId,
          name: otherCategoryName.trim(),
          type: 'EXPENSE',
          isDefault: false,
        });
        finalCatId = newCatId;
      }

      // PERMANENT SAVE FOR CUSTOM CLIENT
      let finalClientId = clientId;
      if ((activeTab === 'INCOME' || activeTab === 'INVOICE') && clientId === 'cli-others' && otherClientName.trim()) {
        const newClientId = `cli-cust-${Date.now()}`;
        await db.clients.add({
          id: newClientId,
          name: otherClientName.trim(),
          company: otherClientName.trim(),
          createdAt: nowIso,
        });
        finalClientId = newClientId;
      }

      // PERMANENT SAVE FOR CUSTOM PROJECT/EVENT
      let finalProjectId = projectId;
      if (isCreatingNewProject && newProjectName.trim()) {
        const newPrjId = `prj-cust-${Date.now()}`;
        const newCode = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
        await db.projects.add({
          id: newPrjId,
          name: newProjectName.trim(),
          code: newCode,
          clientId: finalClientId !== 'cli-others' ? finalClientId : undefined,
          status: 'ACTIVE',
          createdAt: nowIso,
        });
        finalProjectId = newPrjId;
      }

      let finalDescription = description.trim();

      if (activeTab === 'INCOME') {
        const clientLabel = finalClientId === 'cli-others'
          ? otherClientName.trim()
          : (clients.find(c => c.id === finalClientId)?.name || otherClientName.trim() || 'Direct Income');

        const prjObj = projects.find(p => p.id === finalProjectId);
        const projectLabel = isCreatingNewProject ? newProjectName.trim() : (prjObj ? prjObj.name : '');

        if (!finalDescription) {
          finalDescription = projectLabel ? `Income for ${projectLabel} (${clientLabel})` : `Income from ${clientLabel}`;
        }

        const txId = `tx-inc-${Date.now()}`;
        await db.transactions.add({
          id: txId,
          date,
          type: 'INCOME',
          categoryId: 'cat-services',
          accountId: targetAcc,
          clientId: finalClientId !== 'cli-others' ? finalClientId : undefined,
          projectId: finalProjectId || undefined,
          invoiceId: incomeMode === 'PENDING_INVOICE' ? selectedInvoiceId || undefined : undefined,
          description: finalDescription,
          amount: numAmount,
          baseAmount: incomeCalc.baseAmount,
          gst: gstApplicable ? {
            applicable: true,
            rate: gstRate,
            type: isInterState ? 'INTER_STATE' : 'INTRA_STATE',
            cgst: incomeCalc.cgst,
            sgst: incomeCalc.sgst,
            igst: incomeCalc.igst,
          } : undefined,
          tds: tdsApplicable ? {
            applicable: true,
            section: tdsSection,
            rate: tdsRate,
            amount: incomeCalc.tdsAmount,
            status: 'RECEIVABLE',
          } : undefined,
          createdAt: nowIso,
        });

        // If linked to a pending invoice, record payment & update invoice status
        if (incomeMode === 'PENDING_INVOICE' && selectedInvoiceId) {
          const inv = await db.invoices.get(selectedInvoiceId);
          if (inv) {
            const payId = `pay-${Date.now()}`;
            await db.invoicePayments.add({
              id: payId,
              invoiceId: inv.id,
              date,
              amount: numAmount,
              accountId: targetAcc,
              paymentMode: 'BANK_TRANSFER',
              notes: finalDescription,
              createdAt: nowIso,
            });

            const newPaid = inv.paidAmount + numAmount;
            const newPending = Math.max(0, inv.netReceivable - newPaid);
            const newStatus = newPending <= 0 ? 'PAID' : 'PARTIALLY_PAID';
            await db.invoices.update(inv.id, {
              paidAmount: newPaid,
              pendingAmount: newPending,
              status: newStatus,
            });
          }
        }

        const acc = await db.accounts.get(targetAcc);
        if (acc) {
          await db.accounts.update(targetAcc, {
            balance: acc.balance + numAmount,
            inflow: acc.inflow + numAmount,
          });
        }
      } else if (activeTab === 'EXPENSE') {
        const txId = `tx-exp-${Date.now()}`;
        await db.transactions.add({
          id: txId,
          date,
          type: 'EXPENSE',
          categoryId: finalCatId || 'cat-office',
          accountId: targetAcc,
          description: finalDescription || (otherCategoryName.trim() ? `Expense: ${otherCategoryName.trim()}` : 'Expense'),
          amount: gstApplicable ? gstCalc.totalAmount : numAmount,
          baseAmount: numAmount,
          isBusinessExpense,
          gst: isBusinessExpense && gstApplicable ? {
            applicable: true,
            rate: gstRate,
            type: isInterState ? 'INTER_STATE' : 'INTRA_STATE',
            cgst: gstCalc.cgst,
            sgst: gstCalc.sgst,
            igst: gstCalc.igst,
            itcEligible,
            vendorGstin: vendorGstin.trim() || undefined,
          } : undefined,
          tds: isBusinessExpense && tdsApplicable ? {
            applicable: true,
            section: tdsSection,
            rate: tdsRate,
            amount: tdsCalcAmount,
            status: 'PAYABLE',
          } : undefined,
          createdAt: nowIso,
        });

        const acc = await db.accounts.get(targetAcc);
        if (acc) {
          const expAmt = gstApplicable ? gstCalc.totalAmount : numAmount;
          await db.accounts.update(targetAcc, {
            balance: acc.balance - expAmt,
            outflow: acc.outflow + expAmt,
          });
        }
      } else if (activeTab === 'INVOICE') {
        const invId = `inv-${Date.now()}`;
        const finalInvNum = invoiceNumberInput.trim() || defaultInvNum;

        const clientLabel = finalClientId === 'cli-others'
          ? otherClientName.trim()
          : (clients.find(c => c.id === finalClientId)?.name || 'Client');

        const prjObj = projects.find(p => p.id === finalProjectId);
        const projectLabel = isCreatingNewProject ? newProjectName.trim() : (prjObj ? prjObj.name : '');

        const defaultNotes = projectLabel ? `Invoice for ${projectLabel} (${clientLabel})` : `Invoice for ${clientLabel}`;

        await db.invoices.add({
          id: invId,
          invoiceNumber: finalInvNum,
          invoiceDate: date,
          dueDate: date,
          clientId: finalClientId !== 'cli-others' ? finalClientId : clients[0]?.id || '',
          projectId: finalProjectId || undefined,
          baseAmount: numAmount,
          gstApplicable,
          gstRate: gstApplicable ? gstRate : 0,
          cgst: gstCalc.cgst,
          sgst: gstCalc.sgst,
          igst: gstCalc.igst,
          totalAmount: gstCalc.totalAmount,
          tdsApplicable,
          tdsSection,
          tdsRate,
          tdsAmount: tdsCalcAmount,
          netReceivable: gstCalc.totalAmount - tdsCalcAmount,
          paidAmount: 0,
          pendingAmount: gstCalc.totalAmount - tdsCalcAmount,
          status: 'PENDING',
          notes: finalDescription || defaultNotes,
          createdAt: nowIso,
        });
      }

      onSuccess();
      onClose();
      setAmount('');
      setDescription('');
      setOtherCategoryName('');
      setOtherClientName('');
      setNewProjectName('');
      setIsCreatingNewProject(false);
      setProjectId('');
      setSelectedInvoiceId('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared Client & Project Selection Component
  const renderClientAndProjectSelector = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Client *
        </label>
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            if (e.target.value === 'cli-mythri' || e.target.value === 'cli-wizcraft') {
              setHasProjectLink(true);
            } else {
              setHasProjectLink(false);
            }
          }}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
          required
        >
          <option value="">-- Select Client --</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.company})
            </option>
          ))}
          <option value="cli-others">-- Others (Custom Client Name) --</option>
        </select>
      </div>

      {clientId === 'cli-others' && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1.5 animate-fadeIn">
          <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300">
            Specify Custom Client Name * (Permanently Saved)
          </label>
          <input
            type="text"
            placeholder="e.g. New Production House, Freelance Client..."
            value={otherClientName}
            onChange={(e) => setOtherClientName(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
            required
          />
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
            Will be permanently saved into your Clients database and reflected everywhere!
          </p>
        </div>
      )}

      {/* PROJECT CHECKBOX & SEGREGATED CLIENT PROJECT DROPDOWN */}
      {clientId && clientId !== '' && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
            <input
              type="checkbox"
              checked={hasProjectLink || clientId === 'cli-mythri' || clientId === 'cli-wizcraft'}
              onChange={(e) => setHasProjectLink(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Link to a Specific Event / Project for {clients.find(c => c.id === clientId)?.name || otherClientName || 'Client'}</span>
          </label>

          {(hasProjectLink || clientId === 'cli-mythri' || clientId === 'cli-wizcraft') && (
            <div className="pt-1 space-y-2 animate-fadeIn">
              {!isCreatingNewProject ? (
                <div>
                  <select
                    value={projectId}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW_PROJECT') {
                        setIsCreatingNewProject(true);
                        setProjectId('');
                      } else {
                        setProjectId(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">-- Select {clients.find(c => c.id === clientId)?.name || 'Client'} Event / Project --</option>
                    {clientProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                    <option value="ADD_NEW_PROJECT">+ Create New Project / Event for this Client</option>
                  </select>

                  {clientProjects.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      No existing events/projects found for this client. Select "+ Create New Project / Event" above to create one.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                      + Create New Event/Project for {clients.find(c => c.id === clientId)?.name || otherClientName || 'Client'} (Permanently Saved)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewProject(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Wizcraft - Concert 2026 / Mythri - Film B"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-indigo-300 rounded-lg text-xs font-semibold"
                    required
                  />
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    Will be permanently saved under this Client into your Projects database!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-600 mr-2" />
            + Add Financial Record
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 PRIMARY TABS: INCOME, EXPENSE, INVOICE */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 space-x-2 overflow-x-auto">
          {[
            { id: 'INCOME', label: '+ Income Received', icon: TrendingUp, color: 'text-emerald-500' },
            { id: 'EXPENSE', label: '+ Expense Paid', icon: TrendingDown, color: 'text-rose-500' },
            { id: 'INVOICE', label: '+ Invoice (Payment Expected)', icon: FileText, color: 'text-indigo-500' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
              {errorMsg}
            </div>
          )}

          {/* INVOICE NUMBER FIELD FOR INVOICE TAB */}
          {activeTab === 'INVOICE' && (
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumberInput}
                onChange={(e) => setInvoiceNumberInput(e.target.value)}
                placeholder="e.g. QAS/26-27/004"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400"
                required
              />
            </div>
          )}

          {/* INCOME TYPE SELECTION (DIRECT VS PENDING INVOICE RECEIPT) */}
          {activeTab === 'INCOME' && (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-2">
              <span className="block text-[11px] font-extrabold text-emerald-900 dark:text-emerald-300">
                How did you receive this income?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIncomeMode('DIRECT');
                    setSelectedInvoiceId('');
                  }}
                  className={`p-2.5 text-xs font-bold rounded-lg border flex items-center justify-center space-x-2 transition ${
                    incomeMode === 'DIRECT'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Direct Income</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncomeMode('PENDING_INVOICE')}
                  className={`p-2.5 text-xs font-bold rounded-lg border flex items-center justify-center space-x-2 transition ${
                    incomeMode === 'PENDING_INVOICE'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>From Pending Income / Invoice ({pendingInvoicesList.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* PENDING INVOICE SELECTOR */}
          {activeTab === 'INCOME' && incomeMode === 'PENDING_INVOICE' && (
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2 animate-fadeIn">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                Select Pending Invoice to Record Payment *
              </label>
              {pendingInvoicesList.length > 0 ? (
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Select Pending Receivable Invoice --</option>
                  {pendingInvoicesList.map((inv) => {
                    const clientObj = clients.find((c) => c.id === inv.clientId);
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {clientObj?.name || 'Client'} (Pending: {formatINR(inv.pendingAmount)})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="text-xs text-amber-800 dark:text-amber-300 py-1">
                  No pending invoices found. Switch to "Direct Income" above to record direct payment without an invoice.
                </div>
              )}
            </div>
          )}

          {/* 1. DATE & AMOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {activeTab === 'INVOICE' ? 'Invoice Date *' : 'Date *'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {activeTab === 'INCOME' ? 'Total Amount Received (₹) *' : activeTab === 'INVOICE' ? 'Base Amount (₹) *' : 'Amount (₹) *'}
              </label>
              <input
                type="number"
                step="any"
                placeholder={activeTab === 'INCOME' ? 'e.g. 116000' : 'e.g. 15000'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>
          </div>

          {/* EXPENSE CATEGORY PILLS */}
          {activeTab === 'EXPENSE' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {expenseCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition ${
                      categoryId === c.id
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* OTHERS CUSTOM CATEGORY INPUT (FOR EXPENSE) */}
          {activeTab === 'EXPENSE' && categoryId === 'cat-others' && (
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1.5 animate-fadeIn">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                Specify Other Category Name * (Permanently Saved)
              </label>
              <input
                type="text"
                placeholder="e.g. Travel, Equipment Purchase, Client Entertainment..."
                value={otherCategoryName}
                onChange={(e) => setOtherCategoryName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                required
              />
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Will be permanently saved into your Categories database!
              </p>
            </div>
          )}

          {/* SHARED CLIENT & PROJECT SELECTOR (FOR BOTH DIRECT INCOME & INVOICE TABS) */}
          {((activeTab === 'INCOME' && incomeMode === 'DIRECT') || activeTab === 'INVOICE') && renderClientAndProjectSelector()}

          {/* DESCRIPTION & QUICK PRESET CHIPS */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {activeTab === 'INCOME' || activeTab === 'INVOICE' ? 'Description / Notes (Optional)' : 'Description / Reason *'}
            </label>
            <input
              type="text"
              placeholder={
                activeTab === 'INCOME'
                  ? 'e.g. Advance payment / Service fees (Optional)'
                  : activeTab === 'EXPENSE'
                  ? 'e.g. Tea / Fiber bill / Fuel / Developer salary...'
                  : 'e.g. Software Services Payment / Milestone 1 (Optional)'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              required={activeTab === 'EXPENSE'}
            />

            {/* DYNAMIC CATEGORY PRESET CHIPS FOR ZERO-TYPING LOGGING */}
            {activeTab === 'EXPENSE' && (
              <div className="mt-2.5 space-y-1">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  {categoryId === 'cat-home' ? 'Home Presets:' : categoryId === 'cat-saber' ? 'Saber Presets:' : categoryId === 'cat-office' ? 'Office Presets:' : categoryId === 'cat-salary' ? 'Salary Presets:' : 'Presets:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    categoryId === 'cat-home'
                      ? ['Dad', 'Mom', 'Nausheen', 'Sahil', 'Grocery', 'Milk & Provisions', 'Electricity / Maintenance']
                      : categoryId === 'cat-saber'
                      ? ['Out with Friends', 'Shopping', 'Café & Snacks', 'Personal Outing', 'Fitness & Personal']
                      : categoryId === 'cat-salary'
                      ? ['Chandan', 'Hemant', 'Pavan', 'Karthik', 'Karan', 'Aziz']
                      : categoryId === 'cat-others'
                      ? ['Miscellaneous', 'Client Dinner', 'Emergency Repair', 'Travel Fare']
                      : ['WiFi Bill', 'AI Subscription', 'Cable / Adapter', 'Office Snacks & Tea', 'Cloud Hosting', 'Stationery']
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDescription(preset)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        description === preset
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* EXPENSE TAX CHECKBOX */}
          {activeTab === 'EXPENSE' && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBusinessExpense}
                  onChange={(e) => setIsBusinessExpense(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Is this a Business Expense with GST/TDS?</span>
              </label>
            </div>
          )}

          {/* INCOME & INVOICE GST & TDS CHECKBOXES */}
          {(activeTab === 'INCOME' || activeTab === 'INVOICE') && (
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                <span>{activeTab === 'INVOICE' ? 'Invoice GST & TDS Configuration' : 'Income Tax & GST Deductions'}</span>
                <span className="text-[10px] font-normal text-indigo-700 dark:text-indigo-400">
                  {activeTab === 'INVOICE' ? 'Calculates invoice tax & net receivable' : 'Reverse calculates base revenue & net tax'}
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* GST CHECKBOX */}
                <div className="p-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gstApplicable}
                      onChange={(e) => setGstApplicable(e.target.value === 'YES' || e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>GST Included</span>
                  </label>

                  {gstApplicable && (
                    <div className="space-y-1.5 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">GST Rate (%)</label>
                        <select
                          value={gstRate}
                          onChange={(e) => setGstRate(Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400"
                        >
                          <option value={5}>5% GST</option>
                          <option value={12}>12% GST</option>
                          <option value={18}>18% GST (Default)</option>
                          <option value={28}>28% GST</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">Tax Supply</label>
                        <select
                          value={isInterState ? 'INTER' : 'INTRA'}
                          onChange={(e) => setIsInterState(e.target.value === 'INTER')}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="INTRA">Intra-State (CGST+SGST)</option>
                          <option value="INTER">Inter-State (IGST)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* TDS CHECKBOX */}
                <div className="p-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tdsApplicable}
                      onChange={(e) => setTdsApplicable(e.target.value === 'YES' || e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>TDS Deducted</span>
                  </label>

                  {tdsApplicable && (
                    <div className="space-y-1.5 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">TDS Rate (%)</label>
                        <select
                          value={tdsRate}
                          onChange={(e) => setTdsRate(Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400"
                        >
                          <option value={1}>1% TDS</option>
                          <option value={2}>2% TDS (Default)</option>
                          <option value={5}>5% TDS</option>
                          <option value={10}>10% TDS (Sec 194J)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">TDS Section</label>
                        <select
                          value={tdsSection}
                          onChange={(e) => setTdsSection(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="194C">Sec 194C (2%)</option>
                          <option value="194J">Sec 194J (10%)</option>
                          <option value="194H">Sec 194H (5%)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* INCOME / INVOICE CALCULATION BREAKDOWN SUMMARY CARD */}
              {numAmount > 0 && activeTab === 'INCOME' && (
                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl text-xs space-y-1 font-mono border border-emerald-200 dark:border-emerald-900 shadow-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Base Revenue Amount:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatINR(incomeCalc.baseAmount)}</span>
                  </div>
                  {gstApplicable && (
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                      <span>GST Included ({gstRate}%):</span>
                      <span>+{formatINR(incomeCalc.gstAmount)}</span>
                    </div>
                  )}
                  {tdsApplicable && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>TDS Cut (-{tdsRate}%):</span>
                      <span>-{formatINR(incomeCalc.tdsAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 text-[11px] pt-0.5">
                    <span>Pre-tax Revenue Net (Base - TDS):</span>
                    <span>{formatINR(incomeCalc.preTaxNet)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800 text-sm font-sans">
                    <span>Total Bank Receipt:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatINR(numAmount)}</span>
                  </div>
                </div>
              )}

              {numAmount > 0 && activeTab === 'INVOICE' && (
                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl text-xs space-y-1 font-mono border border-indigo-200 dark:border-indigo-900 shadow-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Base Invoice Amount:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatINR(numAmount)}</span>
                  </div>
                  {gstApplicable && (
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                      <span>GST Output ({gstRate}%):</span>
                      <span>+{formatINR(gstCalc.totalGst)}</span>
                    </div>
                  )}
                  {tdsApplicable && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>TDS Withholding by Client (-{tdsRate}%):</span>
                      <span>-{formatINR(tdsCalcAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800 text-sm font-sans">
                    <span>Net Expected Bank Receivable:</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{formatINR(gstCalc.totalAmount - tdsCalcAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXPENSE TAX CONFIGURATION */}
          {activeTab === 'EXPENSE' && isBusinessExpense && (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                Tax & GST Configuration
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    GST Applicable?
                  </label>
                  <select
                    value={gstApplicable ? 'YES' : 'NO'}
                    onChange={(e) => setGstApplicable(e.target.value === 'YES')}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </select>
                </div>

                {gstApplicable && (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        GST Rate (%)
                      </label>
                      <select
                        value={gstRate}
                        onChange={(e) => setGstRate(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18% (Standard)</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tax Supply Type
                      </label>
                      <select
                        value={isInterState ? 'INTER' : 'INTRA'}
                        onChange={(e) => setIsInterState(e.target.value === 'INTER')}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="INTRA">Intra-State (CGST + SGST)</option>
                        <option value="INTER">Inter-State (IGST)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {gstApplicable && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Input Tax Credit (ITC) Eligible?
                    </label>
                    <select
                      value={itcEligible}
                      onChange={(e) => setItcEligible(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="YES">Yes (ITC Claimable)</option>
                      <option value="NO">No (Ineligible)</option>
                      <option value="REVIEW">Review Later</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Vendor GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Vendor GSTIN (Optional)"
                      value={vendorGstin}
                      onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      TDS Applicable?
                    </label>
                    <select
                      value={tdsApplicable ? 'YES' : 'NO'}
                      onChange={(e) => setTdsApplicable(e.target.value === 'YES')}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>

                  {tdsApplicable && (
                    <>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                          TDS Section
                        </label>
                        <select
                          value={tdsSection}
                          onChange={(e) => {
                            setTdsSection(e.target.value);
                            if (e.target.value === '194C') setTdsRate(2);
                            if (e.target.value === '194J') setTdsRate(10);
                            if (e.target.value === '194H') setTdsRate(5);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="194J">Sec 194J (Prof/Tech - 10%)</option>
                          <option value="194C">Sec 194C (Contractors - 2%)</option>
                          <option value="194H">Sec 194H (Commission - 5%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                          TDS Rate (%)
                        </label>
                        <input
                          type="number"
                          value={tdsRate}
                          onChange={(e) => setTdsRate(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {numAmount > 0 && (
                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl text-xs space-y-1 font-mono border border-indigo-100 dark:border-indigo-900">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Base Amount:</span>
                    <span>{formatINR(numAmount)}</span>
                  </div>
                  {gstApplicable && (
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                      <span>GST Output ({gstRate}%):</span>
                      <span>+{formatINR(gstCalc.totalGst)}</span>
                    </div>
                  )}
                  {tdsApplicable && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>TDS Withholding ({tdsRate}%):</span>
                      <span>-{formatINR(tdsCalcAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800 text-sm font-sans">
                    <span>Total Expense:</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {formatINR(gstApplicable ? gstCalc.totalAmount : numAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
