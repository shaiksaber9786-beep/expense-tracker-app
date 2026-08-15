export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type ITCEligibility = 'YES' | 'NO' | 'REVIEW';

export type AccountType = 'BANK' | 'CASH' | 'UPI' | 'CREDIT_CARD' | 'OTHER';

export interface CompanyProfile {
  name: string;
  logoUrl?: string;
  gstin: string;
  pan: string;
  address: string;
  email: string;
  phone: string;
  financialYear: string;
  currency: string;
  invoicePrefix: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  balance: number;
  inflow: number;
  outflow: number;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  isDefault?: boolean;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  clientId?: string; // Linked Client ID so Mythri and Wizcraft projects are strictly segregated
  description?: string;
  budget?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  createdAt: string;
}

export interface GSTDetails {
  applicable: boolean;
  rate: number; // 0, 5, 12, 18, 28
  type: 'INTRA_STATE' | 'INTER_STATE'; // INTRA = CGST+SGST, INTER = IGST
  cgst: number;
  sgst: number;
  igst: number;
  itcEligible?: ITCEligibility;
  vendorGstin?: string;
}

export interface TDSDetails {
  applicable: boolean;
  section: string; // e.g. 194C, 194J, 194H
  rate: number; // e.g. 1, 2, 10
  amount: number;
  certificateRef?: string;
  status?: 'RECEIVABLE' | 'PAYABLE' | 'DEPOSITED' | 'CLAIMED';
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  categoryId?: string;
  accountId: string;
  targetAccountId?: string; // For transfers
  clientId?: string;
  vendorId?: string;
  projectId?: string;
  description: string;
  amount: number; // Gross amount
  baseAmount?: number; // Pre-tax amount
  
  // Tax details
  isBusinessExpense?: boolean;
  gst?: GSTDetails;
  tds?: TDSDetails;

  // Linked records
  invoiceId?: string;
  attachmentUrl?: string;
  monthClosed?: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientId: string;
  projectId?: string;
  items?: InvoiceItem[];
  
  baseAmount: number;
  gstApplicable: boolean;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;

  tdsApplicable: boolean;
  tdsSection?: string;
  tdsRate?: number;
  tdsAmount: number;
  netReceivable: number;

  paidAmount: number;
  pendingAmount: number;
  status: PaymentStatus;
  notes?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  accountId: string;
  paymentMode: 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CASH' | 'OTHER';
  utrNumber?: string;
  notes?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  categoryId?: string;
  accountId: string;
  clientVendorId?: string;
  projectId?: string;
  actionType: 'AUTO_CREATE' | 'REMIND';
  nextDueDate: string;
  lastExecutedDate?: string;
  isActive: boolean;
}

export interface TaxRule {
  id: string;
  type: 'GST' | 'TDS';
  code: string;
  name: string;
  defaultRate: number;
  description: string;
}

export interface MonthClosure {
  id: string;
  monthYear: string; // YYYY-MM
  revenue: number;
  expenses: number;
  profit: number;
  gstPosition: number;
  tdsPosition: number;
  closedAt: string;
  closedBy: string;
  isClosed: boolean;
}

export interface Attachment {
  id: string;
  relatedType: 'TRANSACTION' | 'INVOICE' | 'PAYMENT' | 'CLIENT' | 'VENDOR';
  relatedId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
