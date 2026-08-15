import Dexie, { type Table } from 'dexie';
import type {
  Account,
  Category,
  Client,
  Vendor,
  Project,
  Transaction,
  Invoice,
  InvoicePayment,
  RecurringTransaction,
  TaxRule,
  MonthClosure,
  CompanyProfile,
  Attachment,
  AuditLog,
} from '../types';

export class QasberFinanceDB extends Dexie {
  companyProfile!: Table<CompanyProfile, string>;
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  clients!: Table<Client, string>;
  vendors!: Table<Vendor, string>;
  projects!: Table<Project, string>;
  transactions!: Table<Transaction, string>;
  invoices!: Table<Invoice, string>;
  invoicePayments!: Table<InvoicePayment, string>;
  recurringTransactions!: Table<RecurringTransaction, string>;
  taxRules!: Table<TaxRule, string>;
  monthClosures!: Table<MonthClosure, string>;
  attachments!: Table<Attachment, string>;
  auditLogs!: Table<AuditLog, string>;

  constructor() {
    super('QasberFinanceDB');
    this.version(1).stores({
      companyProfile: 'name',
      accounts: 'id, name, type',
      categories: 'id, name, type',
      clients: 'id, name, company, gstin',
      vendors: 'id, name, company',
      projects: 'id, name, code, clientId, status',
      transactions: 'id, date, type, accountId, clientId, vendorId, projectId, monthClosed',
      invoices: 'id, invoiceNumber, invoiceDate, dueDate, clientId, projectId, status',
      invoicePayments: 'id, invoiceId, date, accountId',
      recurringTransactions: 'id, type, nextDueDate, isActive',
      taxRules: 'id, type, code',
      monthClosures: 'id, monthYear, isClosed',
      attachments: 'id, relatedType, relatedId',
      auditLogs: 'id, timestamp, user',
    });
  }
}

export const db = new QasberFinanceDB();

export async function seedInitialDatabase() {
  const existingProfile = await db.companyProfile.count();
  if (existingProfile > 0) {
    return;
  }

  console.log('Seeding clean Qasber Technologies financial database...');

  await db.companyProfile.put({
    name: 'Qasber Technologies LLP',
    logoUrl: '',
    gstin: '32ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    address: 'Suite 402, Technology Park, Kakkanad, Kochi, Kerala 682030',
    email: 'accounts@qasber.com',
    phone: '+91 98765 43210',
    financialYear: '2026-2027',
    currency: 'INR',
    invoicePrefix: 'QAS/26-27/',
  });

  await db.accounts.bulkPut([
    {
      id: 'acc-main',
      name: 'Main Business Account',
      type: 'BANK',
      accountNumber: '•••• 1234',
      balance: 0,
      inflow: 0,
      outflow: 0,
      isDefault: true,
    },
  ]);

  await db.categories.bulkPut([
    { id: 'cat-home', name: 'Home Expenses', type: 'EXPENSE', isDefault: true },
    { id: 'cat-office', name: 'Office Expenses', type: 'EXPENSE', isDefault: true },
    { id: 'cat-salary', name: 'Salary', type: 'EXPENSE', isDefault: true },
    { id: 'cat-saber', name: 'Saber Expenses', type: 'EXPENSE', isDefault: true },
    { id: 'cat-others', name: 'Others', type: 'EXPENSE', isDefault: true },
    { id: 'cat-services', name: 'Software Services', type: 'INCOME', isDefault: true },
    { id: 'cat-consulting', name: 'Consulting', type: 'INCOME' },
    { id: 'cat-subscription', name: 'SaaS Subscriptions', type: 'INCOME' },
    { id: 'cat-other-inc', name: 'Other Income', type: 'INCOME' },
  ]);

  await db.clients.bulkPut([
    {
      id: 'cli-mythri',
      name: 'Mythri Movie Makers',
      company: 'Mythri Movie Makers',
      gstin: '36AAACM1234F1Z9',
      pan: 'AAACM1234F',
      phone: '+91 98490 12345',
      email: 'finance@mythrimoviemakers.com',
      address: 'Jubilee Hills, Hyderabad, TS 500033',
      notes: 'Media & digital production client.',
      createdAt: '2026-08-15',
    },
    {
      id: 'cli-wizcraft',
      name: 'Wizcraft International',
      company: 'Wizcraft International',
      gstin: '27AAAAB1234C1Z1',
      pan: 'AAAAB1234C',
      phone: '+91 98200 11223',
      email: 'finance@wizcraft.com',
      address: 'Bandra West, Mumbai, MH 400050',
      notes: 'Event registration & software client.',
      createdAt: '2026-08-15',
    },
  ]);

  await db.projects.bulkPut([
    { id: 'prj-mythri-film-a', name: 'Mythri - Film Production A', code: 'MMM-01', clientId: 'cli-mythri', status: 'ACTIVE' as const, createdAt: '2026-08-15' },
    { id: 'prj-mythri-vfx', name: 'Mythri - Digital VFX Suite', code: 'MMM-02', clientId: 'cli-mythri', status: 'ACTIVE' as const, createdAt: '2026-08-15' },
    { id: 'prj-wiz-sunburn', name: 'Wizcraft - Sunburn Festival 2026', code: 'WIZ-01', clientId: 'cli-wizcraft', status: 'ACTIVE' as const, createdAt: '2026-08-15' },
    { id: 'prj-wiz-iifa', name: 'Wizcraft - IIFA Awards Portal', code: 'WIZ-02', clientId: 'cli-wizcraft', status: 'ACTIVE' as const, createdAt: '2026-08-15' },
  ]);

  await db.taxRules.bulkPut([
    { id: 'gst-0', type: 'GST', code: 'GST_0', name: 'Exempt / 0%', defaultRate: 0, description: 'Zero rated goods/services' },
    { id: 'gst-5', type: 'GST', code: 'GST_5', name: '5% GST', defaultRate: 5, description: '5% tax rate' },
    { id: 'gst-12', type: 'GST', code: 'GST_12', name: '12% GST', defaultRate: 12, description: '12% tax rate' },
    { id: 'gst-18', type: 'GST', code: 'GST_18', name: '18% GST', defaultRate: 18, description: 'Standard 18% services GST' },
    { id: 'gst-28', type: 'GST', code: 'GST_28', name: '28% GST', defaultRate: 28, description: '28% tax rate' },
    { id: 'tds-194c', type: 'TDS', code: '194C', name: 'Sec 194C - Contractors', defaultRate: 2, description: 'Payments to contractors (2%)' },
    { id: 'tds-194j', type: 'TDS', code: '194J', name: 'Sec 194J - Professional / Tech Services', defaultRate: 10, description: 'Technical & professional fees (10%)' },
    { id: 'tds-194h', type: 'TDS', code: '194H', name: 'Sec 194H - Commission / Brokerage', defaultRate: 5, description: 'Commission payments (5%)' },
  ]);

  // Clean state: ZERO dummy transactions or invoices
  await db.transactions.clear();
  await db.invoices.clear();
  await db.invoicePayments.clear();
  await db.auditLogs.clear();
}

export async function clearAllDatabaseData() {
  await db.transactions.clear();
  await db.invoices.clear();
  await db.invoicePayments.clear();
  await db.auditLogs.clear();
  await db.companyProfile.clear();
  await db.accounts.clear();
  await db.categories.clear();
  await db.clients.clear();
  await db.vendors.clear();
  await db.projects.clear();
  await db.recurringTransactions.clear();
  await seedInitialDatabase();
}
