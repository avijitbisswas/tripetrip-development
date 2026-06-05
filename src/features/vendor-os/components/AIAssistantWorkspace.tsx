import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';

interface AIAssistantWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
}

const briefItems = [
  { title: 'Morning operations brief', detail: '14 arrivals, 6 dirty rooms, 3 high-value leads, 2 permit risks', state: 'Ready' },
  { title: 'Revenue watch', detail: 'Goa villa weekend demand spike and Bali package margin shift', state: 'Review' },
  { title: 'Team workload', detail: 'Inbox SLA risk on transport and PMS handoff', state: 'Attention' },
];

const riskAlerts = [
  { title: 'Housekeeping risk', module: 'PMS', detail: '6 dirty rooms before 2 PM arrivals', state: 'Urgent' },
  { title: 'Luxury SUV permit expiry', module: 'Fleet', detail: 'Insurance expires in 18 days', state: 'Attention' },
  { title: 'Dubai supplier hold', module: 'Tours', detail: '6 rooms awaiting confirmation', state: 'Review' },
];

const replyDrafts = [
  { title: 'Airport pickup reply', channel: 'Inbox', detail: 'Driver number and ETA drafted for traveler', state: 'Drafted' },
  { title: 'Goa villa quote follow-up', channel: 'CRM', detail: 'Direct-deal savings highlighted', state: 'Ready' },
  { title: 'Scuba waiver reminder', channel: 'Activities', detail: 'Safety checklist link included', state: 'Review' },
];

const pricingSuggestions = [
  { title: 'Raise Goa villa weekend price', detail: 'Demand spike against 3 villas left', value: '+12%', state: 'Review' },
  { title: 'Flash sale Bali villa', detail: 'Unsold weekday inventory', value: 'Save INR 5,500', state: 'Ready' },
  { title: 'Hold SUV promo', detail: 'Permit risk may affect fulfillment', value: 'Pause', state: 'Attention' },
];

const automations = [
  { title: 'Create follow-up tasks', detail: '9 CRM leads due today', state: 'Queued' },
  { title: 'Notify branch manager', detail: 'Housekeeping arrival risk summary', state: 'Needs approval' },
  { title: 'Draft marketplace update', detail: 'Luxury SUV listing permit note', state: 'Drafted' },
];

const approvalSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Human Approval',
    detail: 'AI can draft, summarize, and recommend, but pricing, payouts, cancellations, and public listing changes require approval.',
    icon: ShieldCheck,
  },
  {
    title: 'Audit-ready prompts',
    detail: 'Every generated insight maps to module context, confidence, reviewer, and downstream action.',
    icon: ClipboardCheck,
  },
  {
    title: 'Operational memory',
    detail: 'The assistant reads CRM, inbox, PMS, tours, activities, fleet, accounting, and marketplace signals as one business context.',
    icon: Brain,
  },
];

const insightStatusOptions = ['review', 'ready', 'approved', 'dismissed'];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function StatePill({ state }: { state: string }) {
  const attention = ['Attention', 'Urgent', 'Review', 'Needs approval'].includes(state);
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

export function AIAssistantWorkspace({ organizationId, branchId }: AIAssistantWorkspaceProps) {
  const records = useVendorOSRecords('ai_assistant', organizationId);
  const mutations = useVendorOSRecordMutations('ai_assistant', organizationId, branchId);
  const [insightForm, setInsightForm] = useState({
    title: '',
    recommendation: '',
    confidence: '',
    status: 'review',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const liveInsights = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        title: String(record.title || 'Untitled AI insight'),
        recommendation: String(record.recommendation || 'Recommendation pending review'),
        confidence:
          record.confidence === null || record.confidence === undefined
            ? 'Confidence pending'
            : `${record.confidence}% confidence`,
        state: titleCase(String(record.status || 'review')),
      })),
    [records.records],
  );

  async function handleInsightSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        title: insightForm.title,
        recommendation: insightForm.recommendation,
        confidence: insightForm.confidence ? Number(insightForm.confidence) : null,
        status: insightForm.status,
      });
      setInsightForm({
        title: '',
        recommendation: '',
        confidence: '',
        status: 'review',
      });
      await records.refresh();
      setFormMessage('AI insight created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create AI insight');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Briefs, drafts, pricing, risk
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">AI Operations Assistant</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Convert live Vendor OS signals into daily briefs, reply drafts, pricing recommendations, risk alerts, and approval-ready automations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Brief
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <MessageSquareText className="mr-2 h-4 w-4" />
              Draft Reply
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">AI Insight Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_ai_insights</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Auditable AI Record
          </span>
        </div>
        <form className="grid gap-3 xl:grid-cols-[0.85fr_1.35fr_0.45fr_0.55fr_auto]" onSubmit={handleInsightSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Insight title *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="AI insight"
              required
              value={insightForm.title}
              onChange={(inputEvent) => setInsightForm((current) => ({ ...current, title: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Recommendation *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Recommended action"
              required
              value={insightForm.recommendation}
              onChange={(inputEvent) => setInsightForm((current) => ({ ...current, recommendation: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Confidence</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              max="100"
              min="0"
              type="number"
              value={insightForm.confidence}
              onChange={(inputEvent) => setInsightForm((current) => ({ ...current, confidence: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={insightForm.status}
              onChange={(inputEvent) => setInsightForm((current) => ({ ...current, status: inputEvent.target.value }))}
            >
              {insightStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create AI Insight
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Insights" value="8" detail="Today" />
        <Metric label="Draft Replies" value="14" detail="Ready" />
        <Metric label="Revenue Ideas" value="5" detail="High impact" />
        <Metric label="Risk Alerts" value="6" detail="Needs review" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Daily Brief</h3>
          </div>
          <div className="space-y-3">
            {liveInsights.map((insight) => (
              <div key={insight.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{insight.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">{insight.recommendation}</div>
                    <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-700">{insight.confidence}</div>
                  </div>
                  <StatePill state={insight.state} />
                </div>
              </div>
            ))}
            {briefItems.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</div>
                  </div>
                  <StatePill state={item.state} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Risk Alerts</h3>
          </div>
          <div className="space-y-3">
            {riskAlerts.map((alert) => (
              <div key={alert.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{alert.title}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{alert.module}</div>
                  </div>
                  <StatePill state={alert.state} />
                </div>
                <div className="mt-3 text-sm text-slate-600">{alert.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Reply Drafts</h3>
          </div>
          <div className="space-y-3">
            {replyDrafts.map((draft) => (
              <div key={draft.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{draft.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{draft.channel}</div>
                  </div>
                  <StatePill state={draft.state} />
                </div>
                <div className="mt-3 text-sm text-slate-600">{draft.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Pricing Suggestions</h3>
          </div>
          <div className="space-y-3">
            {pricingSuggestions.map((price) => (
              <div key={price.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{price.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{price.detail}</div>
                  </div>
                  <StatePill state={price.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{price.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Automation Queue</h3>
          </div>
          <div className="space-y-3">
            {automations.map((automation) => (
              <div key={automation.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{automation.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{automation.detail}</div>
                  </div>
                  <StatePill state={automation.state} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {approvalSignals.map(({ title, detail, icon: Icon }) => (
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-emerald-600" />
          <div>
            <div className="text-sm font-black text-slate-950">AI provider integration ready</div>
            <div className="mt-1 text-sm text-slate-600">
              The workspace is structured for future model calls while keeping current recommendations deterministic and auditable.
            </div>
          </div>
          <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
        </div>
      </section>
    </div>
  );
}
