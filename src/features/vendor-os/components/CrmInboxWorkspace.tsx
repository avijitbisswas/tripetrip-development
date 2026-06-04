import { useMemo, useState, type FormEvent } from 'react';
import { Bot, CalendarClock, CheckCircle2, CircleDollarSign, MessageSquare, PhoneCall, Send, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';

type CrmInboxMode = 'crm' | 'inbox';

interface CrmInboxWorkspaceProps {
  mode: CrmInboxMode;
  organizationId?: string;
  branchId?: string | null;
}

const pipelineStages = [
  {
    title: 'New',
    leads: [
      { name: 'Rahul Jain', request: 'Dubai weekend for 2', value: 'INR 64,000', status: 'Hot lead' },
      { name: 'Sara Fernandes', request: 'Scuba diving group', value: '12 pax', status: 'Needs call' },
    ],
  },
  {
    title: 'Qualified',
    leads: [
      { name: 'Priya Sen', request: 'Kerala family package', value: 'INR 1.2L', status: 'Dates fixed' },
      { name: 'Kabir Arora', request: 'Manali resort stay', value: '4 nights', status: 'Budget fit' },
    ],
  },
  {
    title: 'Quote Sent',
    leads: [
      { name: 'Aarav Mehta', request: 'Goa villa inquiry', value: 'INR 42,000', status: 'Follow-up due' },
      { name: 'Neha Rao', request: 'Luxury SUV rental', value: 'INR 18,400', status: 'Awaiting reply' },
    ],
  },
  {
    title: 'Won',
    leads: [{ name: 'Maya Kapoor', request: 'Bali escape', value: 'INR 2.4L', status: 'Booked' }],
  },
];

const followUps = [
  { title: 'Send Goa villa quote', owner: 'Sales desk', due: 'Today 4:00 PM' },
  { title: 'Call Kerala family lead', owner: 'Priya', due: 'Tomorrow 10:00 AM' },
  { title: 'Confirm Dubai hotel allotment', owner: 'Ops', due: 'Today 7:00 PM' },
];

const conversations = [
  {
    title: 'Goa booking question',
    channel: 'Tripetrip chat',
    customer: 'Aarav Mehta',
    message: 'Can we add airport pickup and early check-in?',
    status: 'Urgent',
  },
  {
    title: 'Kerala package documents',
    channel: 'Email',
    customer: 'Priya Sen',
    message: 'Passport details received. ID proof pending for two guests.',
    status: 'Assigned',
  },
  {
    title: 'SUV rental timing',
    channel: 'WhatsApp',
    customer: 'Neha Rao',
    message: 'Traveler wants driver number and pickup ETA.',
    status: 'Open',
  },
];

const crmStageOptions = ['new', 'qualified', 'quote_sent', 'won', 'lost'];
const inboxChannelOptions = ['tripetrip', 'email', 'phone', 'whatsapp'];
const inboxStatusOptions = ['open', 'assigned', 'closed'];

const stageLabels: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  quote_sent: 'Quote Sent',
  won: 'Won',
  lost: 'Lost',
};

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">{detail}</div>
    </div>
  );
}

function formatRecordValue(value: unknown) {
  const amount = Number(value || 0);
  if (!amount) return 'INR 0';
  return `INR ${amount.toLocaleString('en-IN')}`;
}

export function CrmInboxWorkspace({ mode, organizationId, branchId }: CrmInboxWorkspaceProps) {
  const isCrm = mode === 'crm';
  const records = useVendorOSRecords(mode, organizationId);
  const mutations = useVendorOSRecordMutations(mode, organizationId, branchId);
  const [leadForm, setLeadForm] = useState({ title: '', stage: 'new', estimated_value: '' });
  const [threadForm, setThreadForm] = useState({ subject: '', channel: 'tripetrip', status: 'open' });
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const livePipelineStages = useMemo(() => {
    if (!records.records.length) return pipelineStages;

    return crmStageOptions.map((stage) => ({
      title: stageLabels[stage] || stage,
      leads: records.records
        .filter((record) => String(record.stage || 'new') === stage)
        .map((record) => ({
          name: String(record.title || 'Untitled lead'),
          request: String(record.source || 'direct inquiry'),
          value: formatRecordValue(record.estimated_value),
          status: stageLabels[String(record.stage || 'new')] || 'Active',
        })),
    }));
  }, [records.records]);

  const liveConversations = useMemo(() => {
    if (!records.records.length) return conversations;

    return records.records.map((record) => ({
      title: String(record.subject || 'Untitled thread'),
      channel: String(record.channel || 'tripetrip'),
      customer: 'Traveler',
      message: String(record.last_message_at || record.created_at || 'No messages yet'),
      status: String(record.status || 'open'),
    }));
  }, [records.records]);

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        title: leadForm.title,
        stage: leadForm.stage,
        estimated_value: leadForm.estimated_value ? Number(leadForm.estimated_value) : 0,
      });
      setLeadForm({ title: '', stage: 'new', estimated_value: '' });
      await records.refresh();
      setFormMessage('Lead created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create lead');
    }
  }

  async function handleThreadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        subject: threadForm.subject,
        channel: threadForm.channel,
        status: threadForm.status,
      });
      setThreadForm({ subject: '', channel: 'tripetrip', status: 'open' });
      await records.refresh();
      setFormMessage('Thread created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create thread');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              {isCrm ? 'Sales and guest memory' : 'Conversation operations'}
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {isCrm ? 'CRM Command Center' : 'Inbox Command Center'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {isCrm
                ? 'Convert marketplace inquiries, direct website leads, calls, referrals, and repeat guests through one accountable sales pipeline.'
                : 'Handle traveler, supplier, and internal conversations with assignment, context, reply drafting, and booking-aware follow-up.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <UserPlus className="mr-2 h-4 w-4" />
              {isCrm ? 'Add Lead' : 'New Thread'}
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <Bot className="mr-2 h-4 w-4" />
              AI Reply Draft
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">
              {isCrm ? 'Create Lead' : 'Create Thread'}
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Backed by {isCrm ? 'vendor_leads' : 'vendor_conversations'}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live CRM API
          </span>
        </div>
        {isCrm ? (
          <form className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_0.7fr_auto]" onSubmit={handleLeadSubmit}>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Lead title *</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Trip request"
                required
                value={leadForm.title}
                onChange={(event) => setLeadForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Stage</span>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={leadForm.stage}
                onChange={(event) => setLeadForm((current) => ({ ...current, stage: event.target.value }))}
              >
                {crmStageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stageLabels[stage]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Estimated value</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                min="0"
                placeholder="0"
                type="number"
                value={leadForm.estimated_value}
                onChange={(event) => setLeadForm((current) => ({ ...current, estimated_value: event.target.value }))}
              />
            </label>
            <Button
              className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
              disabled={mutations.submitting || !organizationId}
              type="submit"
            >
              Create Lead
            </Button>
          </form>
        ) : (
          <form className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_0.7fr_auto]" onSubmit={handleThreadSubmit}>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Subject *</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Conversation topic"
                required
                value={threadForm.subject}
                onChange={(event) => setThreadForm((current) => ({ ...current, subject: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Channel</span>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={threadForm.channel}
                onChange={(event) => setThreadForm((current) => ({ ...current, channel: event.target.value }))}
              >
                {inboxChannelOptions.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status</span>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={threadForm.status}
                onChange={(event) => setThreadForm((current) => ({ ...current, status: event.target.value }))}
              >
                {inboxStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
              disabled={mutations.submitting || !organizationId}
              type="submit"
            >
              Create Thread
            </Button>
          </form>
        )}
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label={isCrm ? 'Open Leads' : 'Open Threads'} value={isCrm ? '48' : '27'} detail={isCrm ? '+12 this week' : '7 urgent'} />
        <Metric label={isCrm ? 'Quote Value' : 'Reply Time'} value={isCrm ? 'INR 8.4L' : '8m'} detail={isCrm ? 'Pipeline' : '-22%'} />
        <Metric label={isCrm ? 'Follow-ups' : 'Assigned'} value={isCrm ? '9' : '19'} detail="Today" />
        <Metric label="Conversion" value={isCrm ? '18%' : '94%'} detail={isCrm ? 'Lead to booking' : 'SLA health'} />
      </section>

      {isCrm ? (
        <section className="grid gap-4 xl:grid-cols-4">
          {livePipelineStages.map((stage) => (
            <div key={stage.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-950">{stage.title}</h3>
                <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500">
                  {stage.leads.length}
                </span>
              </div>
              <div className="space-y-3">
                {stage.leads.map((lead) => (
                  <div key={`${stage.title}-${lead.name}`} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <div className="text-sm font-black text-slate-950">{lead.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{lead.request}</div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{lead.value}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100">
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Traveler Inbox</h3>
            </div>
            <div className="space-y-3">
              {liveConversations.map((thread) => (
                <div key={thread.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-950">{thread.title}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                        {thread.customer} / {thread.channel}
                      </div>
                    </div>
                    <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100">
                      {thread.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{thread.message}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Reply Tools</h3>
            </div>
            {['AI Reply Draft', 'Assign Thread', 'Create Follow-up', 'Attach Booking'].map((tool) => (
              <button
                key={tool}
                className="mb-3 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 ring-1 ring-slate-100"
              >
                {tool}
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Follow-up Queue</h3>
          </div>
          <div className="space-y-3">
            {followUps.map((item) => (
              <div key={item.title} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div>
                  <div className="text-sm font-black text-slate-950">{item.title}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{item.owner}</div>
                </div>
                <span className="text-xs font-bold text-emerald-700">{item.due}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Conversion Playbook</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['Call hot leads', 'Within 10 minutes'],
              ['Quote direct savings', 'Show Tripetrip price advantage'],
              ['Escalate urgent chats', 'Assign owner before SLA breach'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <PhoneCall className="mb-3 h-4 w-4 text-emerald-600" />
                <div className="text-sm font-black text-slate-950">{title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
