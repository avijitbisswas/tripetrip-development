import { useMemo, useState, type FormEvent } from 'react';
import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  KeyRound,
  MailPlus,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';

interface TeamWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
}

const members = [
  { name: 'Neha Kapoor', email: 'neha@tripetrip.local', branch: 'Manali Hotel', role: 'Manager', state: 'Active' },
  { name: 'Amit Das', email: 'amit@tripetrip.local', branch: 'Fleet depot', role: 'Operations', state: 'Active' },
  { name: 'Riya Shah', email: 'riya@tripetrip.local', branch: 'Sales desk', role: 'Sales', state: 'Invite sent' },
];

const branchStaffing = [
  { branch: 'Manali Hotel', coverage: '8 staff', detail: 'PMS, front desk, housekeeping', state: 'Covered' },
  { branch: 'Goa Villa Desk', coverage: '6 staff', detail: 'Marketplace, PMS, fleet', state: 'Covered' },
  { branch: 'Rishikesh Base', coverage: '3 staff', detail: 'Activities, fleet, documents', state: 'Needs backup' },
];

const permissionRows = [
  { role: 'Owner', access: 'All modules, billing, exports, audit', state: 'Full' },
  { role: 'Manager', access: 'Operations, team, branches, marketplace', state: 'Managed' },
  { role: 'Accountant', access: 'Accounting, invoices, payouts, exports', state: 'Scoped' },
  { role: 'Staff', access: 'Assigned operational modules only', state: 'Limited' },
];

const auditItems = [
  { title: 'Role change approval', detail: 'Manager access reviewed by owner', state: 'Logged' },
  { title: 'Pending invite follow-up', detail: '3 invitations older than 48 hours', state: 'Attention' },
  { title: 'Branch access review', detail: 'Rishikesh Base needs backup operations user', state: 'Review' },
];

const teamSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Role-based access',
    detail: 'Every workspace action is filtered through owner, admin, manager, accountant, operations, sales, staff, and viewer roles.',
    icon: ShieldCheck,
  },
  {
    title: 'Branch accountability',
    detail: 'Team members can be assigned to hotels, villas, depots, offices, activity bases, or DMC desks.',
    icon: Building2,
  },
  {
    title: 'Audit-friendly staffing',
    detail: 'Invites, role changes, and access reviews are designed to flow into audit logs and notification reminders.',
    icon: ClipboardCheck,
  },
];

const roleOptions = ['owner', 'admin', 'manager', 'operations', 'sales', 'accountant', 'staff', 'viewer'];
const statusOptions = ['invited', 'active', 'suspended'];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function StatePill({ state }: { state: string }) {
  const attention = ['Invite sent', 'Attention', 'Review', 'Needs backup', 'Limited', 'Suspended', 'Invited'].includes(state);
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

export function TeamWorkspace({ organizationId, branchId }: TeamWorkspaceProps) {
  const records = useVendorOSRecords('team', organizationId);
  const mutations = useVendorOSRecordMutations('team', organizationId, branchId);
  const [memberForm, setMemberForm] = useState({
    invited_email: '',
    role: 'manager',
    status: 'invited',
    display_name: '',
  });
  const [reviewForm, setReviewForm] = useState({
    member_id: '',
    role: 'manager',
    status: 'active',
    note: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const liveMembers = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        name: String(record.display_name || record.full_name || record.invited_email || 'Pending member'),
        email: String(record.invited_email || record.email || 'Email pending'),
        rawRole: String(record.role || 'staff'),
        rawStatus: String(record.status || 'invited'),
        role: titleCase(String(record.role || 'staff')),
        state: titleCase(String(record.status || 'invited')),
        title: String(record.title || ''),
      })),
    [records.records],
  );

  async function handleMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        invited_email: memberForm.invited_email,
        role: memberForm.role,
        status: memberForm.status,
        display_name: memberForm.display_name,
      });
      setMemberForm({
        invited_email: '',
        role: 'manager',
        status: 'invited',
        display_name: '',
      });
      await records.refresh();
      setFormMessage('Team member invited');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to invite team member');
    }
  }

  function handleReviewMemberChange(memberId: string) {
    const member = liveMembers.find((item) => item.id === memberId);
    setReviewForm((current) => ({
      ...current,
      member_id: memberId,
      role: member?.rawRole || current.role,
      status: member?.rawStatus || current.status,
      note: member?.title || current.note,
    }));
  }

  async function handleAccessReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    if (!reviewForm.member_id) {
      setFormMessage('Select a team member before saving access review');
      return;
    }

    try {
      await mutations.updateRecord(reviewForm.member_id, {
        role: reviewForm.role,
        status: reviewForm.status,
        is_active: reviewForm.status !== 'suspended',
        title: reviewForm.note,
      });
      await records.refresh();
      setFormMessage('Access review saved');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to save access review');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Staff, roles, permissions, branch access
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Team Management</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Invite staff, assign roles, control branch access, review permissions, and keep accountability visible across every vendor module.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <MailPlus className="mr-2 h-4 w-4" />
              New Invite
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <KeyRound className="mr-2 h-4 w-4" />
              Review Access
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Team Invite</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_team_members</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live Team API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_0.65fr_0.65fr_0.8fr_auto]" onSubmit={handleMemberSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Email *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="member@example.com"
              required
              type="email"
              value={memberForm.invited_email}
              onChange={(inputEvent) => setMemberForm((current) => ({ ...current, invited_email: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Role *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={memberForm.role}
              onChange={(inputEvent) => setMemberForm((current) => ({ ...current, role: inputEvent.target.value }))}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {titleCase(role)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={memberForm.status}
              onChange={(inputEvent) => setMemberForm((current) => ({ ...current, status: inputEvent.target.value }))}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Display name</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Name"
              value={memberForm.display_name}
              onChange={(inputEvent) => setMemberForm((current) => ({ ...current, display_name: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Invite Member
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Access Review</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Update live roles, statuses, and branch accountability notes</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase text-amber-700">
            Owner approval path
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr_1.2fr_auto]" onSubmit={handleAccessReviewSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Review member *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={reviewForm.member_id}
              onChange={(inputEvent) => handleReviewMemberChange(inputEvent.target.value)}
            >
              <option value="">Select member</option>
              {liveMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.email}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Reviewed role *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={reviewForm.role}
              onChange={(inputEvent) => setReviewForm((current) => ({ ...current, role: inputEvent.target.value }))}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {titleCase(role)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Reviewed status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={reviewForm.status}
              onChange={(inputEvent) => setReviewForm((current) => ({ ...current, status: inputEvent.target.value }))}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Access review note</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Review note"
              value={reviewForm.note}
              onChange={(inputEvent) => setReviewForm((current) => ({ ...current, note: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId || !reviewForm.member_id}
            type="submit"
          >
            Save Access Review
          </Button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Active Users" value="19" detail="5 roles" />
        <Metric label="Pending Invites" value="3" detail="Needs follow-up" />
        <Metric label="Branch Managers" value="4" detail="Covered" />
        <Metric label="Access Reviews" value="2" detail="This week" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Role Access</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {liveMembers.map((member) => (
              <div key={member.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{member.name}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{member.email}</div>
                  </div>
                  <StatePill state={member.state} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  {member.role}
                </div>
              </div>
            ))}
            {members.map((member) => (
              <div key={member.email} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{member.name}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{member.branch}</div>
                  </div>
                  <StatePill state={member.state} />
                </div>
                <div className="mt-3 text-xs text-slate-500">{member.email}</div>
                <div className="mt-2 text-sm font-bold text-slate-800">{member.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Branch Staffing</h3>
          </div>
          <div className="space-y-3">
            {branchStaffing.map((branch) => (
              <div key={branch.branch} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{branch.branch}</div>
                    <div className="mt-1 text-xs text-slate-500">{branch.detail}</div>
                  </div>
                  <StatePill state={branch.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{branch.coverage}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Permission Matrix</h3>
          </div>
          <div className="space-y-3">
            {permissionRows.map((row) => (
              <div key={row.role} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{row.role}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.access}</div>
                  </div>
                  <StatePill state={row.state} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Audit Accountability</h3>
          </div>
          <div className="space-y-3">
            {auditItems.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                  </div>
                  <StatePill state={item.state} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {teamSignals.map(({ title, detail, icon: Icon }) => (
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
