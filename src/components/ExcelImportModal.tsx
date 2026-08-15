import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../db/database';
import type { Account, Category, Project } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  projects: Project[];
  onImportComplete: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onImportComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);

  const [dateCol, setDateCol] = useState('');
  const [descCol, setDescCol] = useState('');
  const [amountCol, setAmountCol] = useState('');
  const [typeCol, setTypeCol] = useState('');

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];

        if (data.length > 0) {
          const fileHeaders = data[0].map((h: any) => String(h || '').trim());
          setHeaders(fileHeaders);

          const rows = data.slice(1).filter(r => r.length > 0);
          setRawData(rows);

          fileHeaders.forEach((h: string) => {
            const lower = h.toLowerCase();
            if (lower.includes('date')) setDateCol(h);
            if (lower.includes('desc') || lower.includes('particular') || lower.includes('detail')) setDescCol(h);
            if (lower.includes('amount') || lower.includes('total') || lower.includes('rs')) setAmountCol(h);
            if (lower.includes('type') || lower.includes('dr/cr') || lower.includes('mode')) setTypeCol(h);
          });

          setStep(2);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const generatePreview = () => {
    if (!dateCol || !amountCol) {
      alert('Date and Amount column mappings are required.');
      return;
    }

    const dateIdx = headers.indexOf(dateCol);
    const descIdx = headers.indexOf(descCol);
    const amountIdx = headers.indexOf(amountCol);
    const typeIdx = headers.indexOf(typeCol);

    const rows = rawData.map((r, i) => {
      const rawDate = r[dateIdx];
      const rawDesc = r[descIdx] || 'Imported Transaction';
      const rawAmt = parseFloat(String(r[amountIdx] || '0').replace(/[^0-9.-]+/g, '')) || 0;
      const rawType = String(r[typeIdx] || '').toLowerCase();

      let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';
      if (rawType.includes('cr') || rawType.includes('inc') || rawType.includes('deposit') || rawAmt > 0) {
        type = 'INCOME';
      }

      const isValid = rawAmt !== 0;

      return {
        id: i,
        date: rawDate ? String(rawDate) : new Date().toISOString().split('T')[0],
        description: String(rawDesc),
        amount: Math.abs(rawAmt),
        type,
        isValid,
      };
    });

    setParsedRows(rows);
    setStep(3);
  };

  const handleFinalImport = async () => {
    setIsImporting(true);
    try {
      const defaultAcc = accounts[0]?.id || '';
      const nowIso = new Date().toISOString();

      const validRows = parsedRows.filter(r => r.isValid);

      for (const row of validRows) {
        const txId = `tx-imp-${Date.now()}-${row.id}`;
        await db.transactions.add({
          id: txId,
          date: row.date,
          type: row.type,
          accountId: defaultAcc,
          description: row.description,
          amount: row.amount,
          createdAt: nowIso,
        });

        const acc = await db.accounts.get(defaultAcc);
        if (acc) {
          if (row.type === 'INCOME') {
            await db.accounts.update(defaultAcc, { balance: acc.balance + row.amount, inflow: acc.inflow + row.amount });
          } else {
            await db.accounts.update(defaultAcc, { balance: acc.balance - row.amount, outflow: acc.outflow + row.amount });
          }
        }
      }

      onImportComplete();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed during import execution.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Excel Data Import Wizard (Step {step} of 3)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6">
              <Upload className="w-12 h-12 text-indigo-500 mx-auto mb-3 animate-bounce" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                Upload Financial Excel / CSV File
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Supports .xlsx, .xls, .csv files containing bank statements or legacy Excel logs
              </p>
              <label className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-lg">
                Choose Excel File
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Map columns from <strong>{fileName}</strong> to financial fields:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Column *
                  </label>
                  <select
                    value={dateCol}
                    onChange={(e) => setDateCol(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Column *
                  </label>
                  <select
                    value={amountCol}
                    onChange={(e) => setAmountCol(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description Column
                  </label>
                  <select
                    value={descCol}
                    onChange={(e) => setDescCol(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Type / Credit-Debit Column
                  </label>
                  <select
                    value={typeCol}
                    onChange={(e) => setTypeCol(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between border-t border-slate-200 dark:border-slate-800">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-xs font-medium text-slate-500">
                  Back
                </button>
                <button
                  onClick={generatePreview}
                  className="px-5 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1"
                >
                  <span>Preview Records</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Found {parsedRows.length} total records to import ({parsedRows.filter(r => r.isValid).length} valid)
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {parsedRows.map((r, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{r.description}</div>
                      <div className="text-[11px] text-slate-500">{r.date} • Type: {r.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white">₹{r.amount}</div>
                      {r.isValid ? (
                        <span className="text-[10px] text-emerald-500 font-medium">Valid</span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-medium">Invalid</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between border-t border-slate-200 dark:border-slate-800">
                <button onClick={() => setStep(2)} className="px-4 py-2 text-xs font-medium text-slate-500">
                  Back
                </button>
                <button
                  onClick={handleFinalImport}
                  disabled={isImporting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  {isImporting ? 'Importing...' : 'Confirm & Commit Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
