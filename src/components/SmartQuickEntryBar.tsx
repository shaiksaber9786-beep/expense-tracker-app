import React, { useState } from 'react';
import { Sparkles, Mic, Check } from 'lucide-react';
import { parseNaturalLanguageText, formatINR } from '../utils/financial';
import type { Account, Project } from '../types';
import { db } from '../db/database';

interface SmartQuickEntryBarProps {
  accounts: Account[];
  projects: Project[];
  onTransactionCreated: () => void;
}

export const SmartQuickEntryBar: React.FC<SmartQuickEntryBarProps> = ({
  accounts,
  projects,
  onTransactionCreated,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.length > 5) {
      const parsed = parseNaturalLanguageText(text, projects, accounts);
      setParsedResult(parsed);
    } else {
      setParsedResult(null);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleInputChange(transcript);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSaveParsed = async () => {
    if (!parsedResult || parsedResult.amount <= 0) return;
    setIsSaving(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const accId = parsedResult.accountId || accounts[0]?.id || '';
      const txId = `tx-smart-${Date.now()}`;

      await db.transactions.add({
        id: txId,
        date: todayStr,
        type: parsedResult.type,
        accountId: accId,
        projectId: parsedResult.projectId || undefined,
        description: parsedResult.description,
        amount: parsedResult.amount,
        createdAt: new Date().toISOString(),
      });

      const acc = await db.accounts.get(accId);
      if (acc) {
        if (parsedResult.type === 'INCOME') {
          await db.accounts.update(accId, { balance: acc.balance + parsedResult.amount, inflow: acc.inflow + parsedResult.amount });
        } else {
          await db.accounts.update(accId, { balance: acc.balance - parsedResult.amount, outflow: acc.outflow + parsedResult.amount });
        }
      }

      setInputText('');
      setParsedResult(null);
      onTransactionCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide uppercase text-indigo-300">
            Smart Quick Entry (AI Natural Language)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          e.g., "Spent 5500 fuel for SpotCheck from cash"
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder='Type natural entry e.g. "Received 50000 from Wizcraft for Event Reg in HDFC"...'
          className="w-full pl-4 pr-24 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />

        <div className="absolute right-2 flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleVoiceInput}
            title="Voice Dictation"
            className={`p-2 rounded-lg text-slate-300 hover:text-white transition ${
              isListening ? 'bg-rose-600 animate-bounce' : 'bg-slate-700/60 hover:bg-slate-700'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          {parsedResult && parsedResult.amount > 0 && (
            <button
              onClick={handleSaveParsed}
              disabled={isSaving}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1 transition shadow-lg"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Confirm'}</span>
            </button>
          )}
        </div>
      </div>

      {parsedResult && parsedResult.amount > 0 && (
        <div className="mt-3 p-3 bg-slate-800/90 rounded-xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                parsedResult.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {parsedResult.type}
            </span>
            <span className="font-bold text-white text-sm">{formatINR(parsedResult.amount)}</span>
          </div>

          <div className="flex items-center space-x-3 text-slate-300 text-[11px]">
            <span>
              Account:{' '}
              <strong className="text-white">
                {accounts.find((a) => a.id === parsedResult.accountId)?.name || 'Default Account'}
              </strong>
            </span>
            {parsedResult.projectId && (
              <span>
                Project:{' '}
                <strong className="text-indigo-300">
                  {projects.find((p) => p.id === parsedResult.projectId)?.name}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
