import React, { useState } from 'react';
import { ShieldAlert, FileText } from 'lucide-react';
import type { Invoice, TaxRule, Transaction } from '../../types';
import { formatINR } from '../../utils/financial';
import { exportReportToPDF } from '../../utils/export';

interface GstTdsViewProps {
  transactions: Transaction[];
  invoices: Invoice[];
  taxRules: TaxRule[];
}

export const GstTdsView: React.FC<GstTdsViewProps> = ({
  transactions,
  invoices,
}) => {
  const [activeTab, setActiveTab] = useState<'GST' | 'TDS'>('GST');

  let salesCgst = 0;
  let salesSgst = 0;
  let salesIgst = 0;

  transactions.forEach((t) => {
    if (t.type === 'INCOME' && t.gst?.applicable) {
      salesCgst += t.gst.cgst || 0;
      salesSgst += t.gst.sgst || 0;
      salesIgst += t.gst.igst || 0;
    }
  });
  const totalOutputGst = salesCgst + salesSgst + salesIgst;

  let inputCgstEligible = 0;
  let inputSgstEligible = 0;
  let inputIgstEligible = 0;

  transactions.forEach((t) => {
    if (t.type === 'EXPENSE' && t.gst?.applicable && t.gst?.itcEligible === 'YES') {
      inputCgstEligible += t.gst.cgst || 0;
      inputSgstEligible += t.gst.sgst || 0;
      inputIgstEligible += t.gst.igst || 0;
    }
  });
  const totalEligibleInputGst = inputCgstEligible + inputSgstEligible + inputIgstEligible;
  const netGstLiability = Math.max(0, totalOutputGst - totalEligibleInputGst);

  let tdsReceivable = 0;
  invoices.forEach((i) => {
    if (i.tdsApplicable) tdsReceivable += i.tdsAmount;
  });

  let tdsPayable = 0;
  transactions.forEach((t) => {
    if (t.type === 'EXPENSE' && t.tds?.applicable) {
      tdsPayable += t.tds.amount || 0;
    }
  });

  const handleExportGstPDF = () => {
    const headers = ['GST Category', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)'];
    const rows = [
      ['Output GST (Collected on Sales)', formatINR(salesCgst, false), formatINR(salesSgst, false), formatINR(salesIgst, false), formatINR(totalOutputGst, false)],
      ['Eligible Input Tax Credit (ITC)', formatINR(inputCgstEligible, false), formatINR(inputSgstEligible, false), formatINR(inputIgstEligible, false), formatINR(totalEligibleInputGst, false)],
      ['Net GST Payable / Liability', '-', '-', '-', formatINR(netGstLiability, false)],
    ];
    exportReportToPDF('GST MANAGEMENT SUMMARY REPORT', 'Management tax position for Qasber Technologies LLP', headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('GST')}
          className={`pb-3 font-bold text-sm border-b-2 transition ${
            activeTab === 'GST'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          GST Center & ITC Audit
        </button>
        <button
          onClick={() => setActiveTab('TDS')}
          className={`pb-3 font-bold text-sm border-b-2 transition ${
            activeTab === 'TDS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          TDS Center (Withholding Tax)
        </button>
      </div>

      {activeTab === 'GST' ? (
        <>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              <strong>Management Summary Notice:</strong> Calculated figures represent internal operational management metrics and avoid presenting as official GSTR-3B/GSTR-1 government filings.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Total Output GST Collected</div>
              <div className="mt-1 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatINR(totalOutputGst)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">CGST+SGST+IGST on sales</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Eligible Input Tax Credit (ITC)</div>
              <div className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatINR(totalEligibleInputGst)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">ITC claimable on business bills</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Net GST Liability Position</div>
              <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                {formatINR(netGstLiability)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Output minus eligible Input ITC</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Output vs Input Tax Component Breakdown
              </h4>
              <button
                onClick={handleExportGstPDF}
                className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export GST Summary PDF</span>
              </button>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-bold">Tax Category</th>
                  <th className="p-3 font-bold text-right">CGST</th>
                  <th className="p-3 font-bold text-right">SGST</th>
                  <th className="p-3 font-bold text-right">IGST</th>
                  <th className="p-3 font-bold text-right">Total GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                <tr>
                  <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                    Output GST (Collected on Sales)
                  </td>
                  <td className="p-3 text-right">{formatINR(salesCgst)}</td>
                  <td className="p-3 text-right">{formatINR(salesSgst)}</td>
                  <td className="p-3 text-right">{formatINR(salesIgst)}</td>
                  <td className="p-3 text-right font-extrabold text-indigo-600">{formatINR(totalOutputGst)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                    Eligible Input Tax Credit (ITC)
                  </td>
                  <td className="p-3 text-right">{formatINR(inputCgstEligible)}</td>
                  <td className="p-3 text-right">{formatINR(inputSgstEligible)}</td>
                  <td className="p-3 text-right">{formatINR(inputIgstEligible)}</td>
                  <td className="p-3 text-right font-extrabold text-emerald-600">{formatINR(totalEligibleInputGst)}</td>
                </tr>
                <tr className="bg-slate-50 dark:bg-slate-800 font-sans font-bold">
                  <td className="p-3 text-slate-900 dark:text-white">Net GST Liability</td>
                  <td className="p-3 text-right" colSpan={3}>-</td>
                  <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white">{formatINR(netGstLiability)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">TDS Receivable (Client Withholdings)</div>
              <div className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatINR(tdsReceivable)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Under Sec 194J (10%) & Sec 194C (2%)</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">TDS Payable (Vendor Deductions)</div>
              <div className="mt-1 text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {formatINR(tdsPayable)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Deducted from vendor payments to deposit</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
