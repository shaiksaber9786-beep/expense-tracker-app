import React, { useState } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import type { Attachment } from '../../types';

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<Attachment[]>([
    {
      id: 'doc-01',
      relatedType: 'INVOICE',
      relatedId: 'inv-101',
      fileName: 'Wizcraft_Invoice_QAS_001.pdf',
      fileType: 'application/pdf',
      fileSize: 245000,
      dataUrl: '#',
      uploadedAt: '2026-08-01',
    },
    {
      id: 'doc-02',
      relatedType: 'TRANSACTION',
      relatedId: 'tx-2001',
      fileName: 'AWS_Hosting_Bill_Aug.pdf',
      fileType: 'application/pdf',
      fileSize: 180000,
      dataUrl: '#',
      uploadedAt: '2026-08-02',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: Attachment = {
      id: `doc-${Date.now()}`,
      relatedType: 'TRANSACTION',
      relatedId: 'tx-general',
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      dataUrl: '#',
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setDocuments((prev) => [newDoc, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Document Repository & Attachments
          </h3>
          <p className="text-xs text-slate-500">Store receipts, vendor bills, and TDS certificates</p>
        </div>

        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-md">
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-3 truncate">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{doc.fileName}</div>
                <div className="text-[11px] text-slate-500">
                  {doc.relatedType} • {doc.uploadedAt}
                </div>
              </div>
            </div>

            <button
              onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
