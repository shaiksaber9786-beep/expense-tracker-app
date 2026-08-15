import type { Account } from '../types';

/**
 * Formats a numeric value into INR (₹) string following Indian Numbering System
 * Example: 125000 -> ₹1,25,000
 */
export function formatINR(amount: number = 0, showSymbol: boolean = true): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(absAmount);

  const prefix = showSymbol ? '₹' : '';
  const sign = isNegative ? '-' : '';
  return `${sign}${prefix}${formatted}`;
}

/**
 * Calculates GST components based on base amount and GST rate
 */
export function calculateGST(baseAmount: number, rate: number, isInterState: boolean = false) {
  if (!rate || rate === 0) {
    return { cgst: 0, sgst: 0, igst: 0, totalGst: 0, totalAmount: baseAmount };
  }

  const totalGst = Math.round((baseAmount * rate) / 100);
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = totalGst;
  } else {
    cgst = Math.round(totalGst / 2);
    sgst = totalGst - cgst;
  }

  return {
    cgst,
    sgst,
    igst,
    totalGst,
    totalAmount: baseAmount + totalGst,
  };
}

/**
 * Calculates TDS deduction amount
 */
export function calculateTDS(baseAmount: number, rate: number) {
  if (!rate || rate === 0) return 0;
  return Math.round((baseAmount * rate) / 100);
}

/**
 * Reverse calculates Income Base Amount, GST, and TDS from Total Amount Received
 * Base Amount B = Total Received / (1 + GST% - TDS%)
 */
export function calculateIncomeFromReceipt(
  receivedAmount: number,
  gstApplicable: boolean,
  gstRate: number = 18,
  tdsApplicable: boolean,
  tdsRate: number = 2,
  isInterState: boolean = false
) {
  if (!receivedAmount || receivedAmount <= 0) {
    return {
      baseAmount: 0,
      gstAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      tdsAmount: 0,
      preTaxNet: 0,
      totalReceived: 0,
    };
  }

  const gRatio = gstApplicable ? (gstRate / 100) : 0;
  const tRatio = tdsApplicable ? (tdsRate / 100) : 0;
  const denominator = 1 + gRatio - tRatio;

  const baseAmount = Math.round(receivedAmount / (denominator > 0 ? denominator : 1));
  const gstAmount = Math.round(baseAmount * gRatio);
  const tdsAmount = Math.round(baseAmount * tRatio);
  const preTaxNet = baseAmount - tdsAmount;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (gstApplicable) {
    if (isInterState) {
      igst = gstAmount;
    } else {
      cgst = Math.round(gstAmount / 2);
      sgst = gstAmount - cgst;
    }
  }

  return {
    baseAmount,
    gstAmount,
    cgst,
    sgst,
    igst,
    tdsAmount,
    preTaxNet,
    totalReceived: receivedAmount,
  };
}

/**
 * Smart Natural Language Transaction Parser
 */
export function parseNaturalLanguageText(text: string, projectsList: any[] = [], accountsList: Account[] = []) {
  const normalized = text.toLowerCase();
  
  let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  if (normalized.includes('received') || normalized.includes('income') || normalized.includes('got') || normalized.includes('earned')) {
    type = 'INCOME';
  }

  const amountMatch = normalized.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
  let amount = 0;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  let matchedProjectId = '';
  for (const p of projectsList) {
    if (normalized.includes(p.name.toLowerCase()) || normalized.includes(p.code.toLowerCase())) {
      matchedProjectId = p.id;
      break;
    }
  }

  let matchedAccountId = '';
  for (const acc of accountsList) {
    if (normalized.includes(acc.name.toLowerCase()) || (acc.accountNumber && normalized.includes(acc.accountNumber))) {
      matchedAccountId = acc.id;
      break;
    } else if (normalized.includes('hdfc') && acc.name.toLowerCase().includes('hdfc')) {
      matchedAccountId = acc.id;
      break;
    } else if (normalized.includes('icici') && acc.name.toLowerCase().includes('icici')) {
      matchedAccountId = acc.id;
      break;
    } else if (normalized.includes('cash') && acc.name.toLowerCase().includes('cash')) {
      matchedAccountId = acc.id;
      break;
    } else if (normalized.includes('upi') && acc.name.toLowerCase().includes('upi')) {
      matchedAccountId = acc.id;
      break;
    }
  }

  const description = text.trim();

  return {
    type,
    amount,
    description,
    projectId: matchedProjectId,
    accountId: matchedAccountId,
  };
}
