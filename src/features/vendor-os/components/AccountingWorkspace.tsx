import {
  ArrowDownUp,
  Banknote,
  Calculator,
  ClipboardList,
  FileText,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const invoices = [
  { number: 'INV-2048', booking: 'Goa Beach Escape', amount: 'INR 29,999', state: 'Due' },
  { number: 'INV-2051', booking: 'Kerala Houseboat', amount: 'INR 18,400', state: 'Sent' },
  { number: 'INV-2057', booking: 'Luxury SUV Rental', amount: 'INR 7,299', state: 'Paid' },
];

const expenses = [
  { title: 'Fuel Expense', branch: 'Fleet depot', amount: 'INR 12,400', state: 'Approved' },
  { title: 'Guide payout advance', branch: 'Tours', amount: 'INR 8,000', state: 'Review' },
  { title: 'Room linen purchase', branch: 'PMS', amount: 'INR 21,600', state: 'Booked' },
];

const payouts = [
  { title: 'Tripetrip Payout', detail: 'Marketplace settlement batch', value: 'INR 1.2L', state: 'Processing' },
  { title: 'Supplier Commission', detail: 'Dubai Weekend package', value: '12%', state: 'Reconcile' },
  { title: 'Direct Booking Margin', detail: 'Goa flash deal savings', value: 'INR 18,900', state: 'Ready' },
];

const ledgerItems = [
  { title: 'GST Output', detail: 'June collection estimate', value: 'INR 42,300', state: 'Accrued' },
  { title: 'Branch Ledger', detail: 'Goa Villa Desk', value: 'Balanced', state: 'Clean' },
  { title: 'Commission Mapping', detail: 'Marketplace + supplier splits', value: '3 rules', state: 'Active' },
];

const financeSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Booking-linked ledger',
    detail: 'Every invoice, payout, commission, and tax event maps back to Tripetrip booking records.',
    icon: ArrowDownUp,
  },
  {
    title: 'Finance controls',
    detail: 'Role-based approval protects expenses, refunds, payouts, and ledger exports.',
    icon: ShieldCheck,
  },
  {
    title: 'Revenue signals',
    detail: 'Branch margin, direct-booking savings, and marketplace commission impact stay visible.',
    icon: TrendingUp,
  },
];

function StatePill({ state }: { state: string }) {
  const attention = ['Due', 'Review', 'Reconcile', 'Processing'].includes(state);
  return (
    <span
      className={
        attention
          ? 'w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase text-amber-700 ring-1 ring-amber-100'
          : 'w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100'
      }
    >
      {state}
    </span>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">{detail}</div>
    </div>
  );
}

export function AccountingWorkspace() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Invoices, payouts, taxes, ledger
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Accounting</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Control receivables, branch expenses, supplier payouts, commissions, taxes, ledger reconciliation, and financial exports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <ClipboardList className="mr-2 h-4 w-4" />
              Export Ledger
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Receivables" value="INR 4.2L" detail="12 invoices" />
        <Metric label="Expenses" value="INR 82K" detail="This month" />
        <Metric label="Payouts" value="INR 2.1L" detail="Pending" />
        <Metric label="Ledger Health" value="98%" detail="Reconciled" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Receivables Command</h3>
          </div>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.number} className="grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <div className="text-sm font-black text-slate-950">{invoice.number}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{invoice.booking}</div>
                </div>
                <div className="text-lg font-black text-slate-950">{invoice.amount}</div>
                <StatePill state={invoice.state} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Expense Desk</h3>
          </div>
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{expense.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{expense.branch}</div>
                  </div>
                  <StatePill state={expense.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{expense.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Payouts & Commissions</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {payouts.map((payout) => (
              <div key={payout.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{payout.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{payout.detail}</div>
                  </div>
                  <StatePill state={payout.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{payout.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Tax & Ledger</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {ledgerItems.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                  </div>
                  <StatePill state={item.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {financeSignals.map(({ title, detail, icon: Icon }) => (
            <div key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-black text-slate-950">{title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
