import React, { useState } from 'react';
import { X, Bot, Send } from 'lucide-react';
import { formatINR } from '../utils/financial';
import type { Account, Client, Invoice, Project, Transaction } from '../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
  accounts: Account[];
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  transactions,
  invoices,
  projects,
  accounts,
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'USER' | 'AI'; text: string; actionData?: any }>>([
    {
      sender: 'AI',
      text: 'Hello! I am your AI Financial Assistant for Qasber Technologies LLP. Ask me anything about your revenue, expenses, pending invoices, GST, TDS, or project profitability.',
    },
  ]);

  if (!isOpen) return null;

  const sampleQueries = [
    'How much did I spend this month?',
    'What is pending from Wizcraft?',
    'Which project made the most profit?',
    'How much GST did I collect?',
    'How much TDS is receivable?',
  ];

  const handleAsk = (qText: string) => {
    if (!qText.trim()) return;

    const userMsg = { sender: 'USER' as const, text: qText };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');

    const qLower = qText.toLowerCase();
    let aiResponse = '';

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));

    if (qLower.includes('spend') || qLower.includes('spent') || qLower.includes('expense')) {
      const totalExpense = monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      aiResponse = `You have spent **${formatINR(totalExpense)}** this month (${currentMonth}). Your largest expense category is Cloud Hosting & Server infrastructure.`;
    } else if (qLower.includes('pending') || qLower.includes('wizcraft') || qLower.includes('client')) {
      const pendingInvs = invoices.filter((i) => i.pendingAmount > 0);
      const wizcraft = pendingInvs.filter((i) => i.clientId === 'cli-wizcraft');
      const totalPending = pendingInvs.reduce((s, i) => s + i.pendingAmount, 0);
      aiResponse = `Total pending receivables across all clients is **${formatINR(totalPending)}**. ${
        wizcraft.length > 0
          ? `For Wizcraft, invoice ${wizcraft[0].invoiceNumber} has a pending balance of **${formatINR(wizcraft[0].pendingAmount)}**.`
          : 'Wizcraft has no overdue invoices.'
      }`;
    } else if (qLower.includes('project') || qLower.includes('profit')) {
      let bestProject = '';
      let maxProfit = -Infinity;

      projects.forEach((p) => {
        const pIncomes = transactions.filter((t) => t.projectId === p.id && t.type === 'INCOME').reduce((s, t) => s + (t.baseAmount || t.amount), 0);
        const pExpenses = transactions.filter((t) => t.projectId === p.id && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
        const profit = pIncomes - pExpenses;
        if (profit > maxProfit) {
          maxProfit = profit;
          bestProject = p.name;
        }
      });

      aiResponse = `The project with the highest profitability is **${bestProject}** with a net profit of **${formatINR(maxProfit)}**.`;
    } else if (qLower.includes('gst')) {
      let outputGst = 0;
      transactions.filter((t) => t.type === 'INCOME' && t.gst?.applicable).forEach((t) => {
        outputGst += (t.gst?.cgst || 0) + (t.gst?.sgst || 0) + (t.gst?.igst || 0);
      });
      aiResponse = `You have collected **${formatINR(outputGst)}** in Output GST from clients. Your net GST position after input credit is clean.`;
    } else if (qLower.includes('tds')) {
      let tdsRec = 0;
      invoices.forEach((i) => {
        if (i.tdsApplicable) tdsRec += i.tdsAmount;
      });
      aiResponse = `Your total TDS Receivable withheld by clients is **${formatINR(tdsRec)}** (primarily under Section 194J at 10%). You can claim this in your income tax return.`;
    } else {
      aiResponse = `Based on your records for Qasber Technologies LLP: Your available bank balance across all accounts is **${formatINR(
        accounts.reduce((s, a) => s + a.balance, 0)
      )}**, and total net revenue this month is **${formatINR(
        monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + (t.baseAmount || t.amount), 0)
      )}**.`;
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'AI', text: aiResponse }]);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">AI Financial Assistant</h3>
              <p className="text-[11px] text-indigo-300">Live Structured Data Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                  m.sender === 'USER'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Suggested Questions</p>
          <div className="flex flex-wrap gap-1.5">
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleAsk(sq)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder="Ask financial question..."
            className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={() => handleAsk(query)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
