import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getCurrentSession, signOut } from '@/src/services/auth';
import { getProfile } from '@/src/services/profiles';
import type { AccommodationCapabilityKey, ApprovalMode, VendorAccessEnforcementMode, VendorPlanTier, VendorProviderFamily } from '@/src/features/vendor-os/accommodationAccess';
import {
  getAdminContentConfig,
  getAdminOverview,
  getAdminSystemState,
  listAdminAccommodationAccess,
  listAdminAuditEntries,
  listAdminBookings,
  listAdminCommunityPosts,
  listAdminDeals,
  listAdminListings,
  listAdminMarketplaceSyncs,
  listAdminManualPayments,
  listAdminUsers,
  listAdminVendors,
  removeAdminCommunityPost,
  saveAdminContentConfig,
  saveAdminAccommodationAccess,
  saveAdminSystemConfig,
  updateAdminBooking,
  updateAdminListing,
  updateAdminMarketplaceSync,
  updateAdminManualPayment,
  updateAdminUser,
  updateAdminVendor,
} from '@/src/services/admin';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Receipt,
  RefreshCw,
  Settings2,
  Shield,
  Store,
  type LucideIcon,
  Users,
  XCircle,
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/vendors', label: 'Vendors', icon: Building2 },
  { path: '/admin/listings', label: 'Listings', icon: Store },
  { path: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { path: '/admin/payments', label: 'Payments', icon: Receipt },
  { path: '/admin/community', label: 'Community', icon: MessageSquare },
  { path: '/admin/accommodation', label: 'Accommodation', icon: Building2 },
  { path: '/admin/deals', label: 'Deals', icon: BadgeCheck },
  { path: '/admin/content', label: 'Content', icon: Megaphone },
  { path: '/admin/system', label: 'System', icon: Settings2 },
  { path: '/admin/audit', label: 'Audit', icon: FileText },
] as const;

const accommodationPlanOptions = ['advanced', 'paid', 'basic'] as const satisfies readonly VendorPlanTier[];
const accommodationEnforcementOptions = ['open', 'enforced'] as const satisfies readonly VendorAccessEnforcementMode[];
const accommodationApprovalModes = ['open', 'vendor_owner_only', 'admin_approval_required'] as const satisfies readonly ApprovalMode[];
const accommodationCapabilityGroups: Array<{ title: string; capabilities: AccommodationCapabilityKey[] }> = [
  {
    title: 'Bookings',
    capabilities: [
      'bookings.manual_entry',
      'bookings.online_engine',
      'bookings.group_bookings',
      'bookings.reservation_changes',
      'bookings.rate_plan_controls',
      'bookings.ai_chatbot',
    ],
  },
  {
    title: 'Inventory',
    capabilities: ['inventory.manual_updates', 'inventory.ota_sync', 'inventory.rule_based_rates', 'inventory.dynamic_pricing'],
  },
  {
    title: 'Check-in',
    capabilities: ['checkin.manual', 'checkin.mobile', 'checkin.digital_keys'],
  },
  {
    title: 'Billing',
    capabilities: [
      'billing.manual_folios',
      'billing.gst_invoice',
      'billing.integrated_payments',
      'billing.refund_controls',
      'billing.night_audit',
    ],
  },
  {
    title: 'Housekeeping',
    capabilities: ['housekeeping.room_status', 'housekeeping.mobile_tasks', 'housekeeping.predictive_scheduling'],
  },
  {
    title: 'Staff',
    capabilities: ['staff.manual_attendance', 'staff.shift_scheduling', 'staff.biometric_attendance'],
  },
  {
    title: 'Analytics',
    capabilities: ['analytics.occupancy_reports', 'analytics.operational_dashboards', 'analytics.ai_forecasting'],
  },
  {
    title: 'Guest',
    capabilities: ['guest.manual_communication', 'guest.automated_confirmations', 'guest.whatsapp_automation'],
  },
];

function formatAmount(amount: unknown) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) return '-';
  return new Date(value).toLocaleString();
}

function formatAdminLabel(value: string) {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatChannelDistribution(metadata: Record<string, unknown>) {
  const distribution =
    metadata.channel_distribution && typeof metadata.channel_distribution === 'object'
      ? (metadata.channel_distribution as Record<string, { status?: string }>)
      : {};
  return Object.entries(distribution).map(([channel, value]) => `${formatAdminLabel(channel)} ${formatAdminLabel(String(value?.status || 'draft'))}`);
}

type LaunchReadinessCheck = {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
};

const launchSmokeTests = [
  'Register traveler with email OTP',
  'Register vendor with email OTP',
  'Create property, room type, and room',
  'Create PMS reservation and folio entry',
  'Approve manual payment and verify billing state',
  'Create housekeeping task and mark it done',
  'Publish marketplace sync through admin approval',
  'Post in traveler and vendor community feeds',
];

const launchSummaryCards: Array<{ label: string; value: string | number; Icon: LucideIcon }> = [
  { label: 'Launch State', value: 'unknown', Icon: Shield },
  { label: 'Passed', value: 0, Icon: CheckCircle2 },
  { label: 'Warnings', value: 0, Icon: AlertTriangle },
  { label: 'Failed', value: 0, Icon: XCircle },
];

function getReadinessChecks(systemState: Record<string, unknown> | null) {
  const readiness = systemState?.readiness;
  if (!readiness || typeof readiness !== 'object') return [] as LaunchReadinessCheck[];
  const checks = (readiness as { checks?: unknown }).checks;
  if (!Array.isArray(checks)) return [];

  return checks
    .map((check) => {
      if (!check || typeof check !== 'object') return null;
      const item = check as Record<string, unknown>;
      const status = item.status === 'pass' || item.status === 'warn' || item.status === 'fail' ? item.status : 'fail';
      return {
        name: String(item.name || 'readiness-check'),
        status,
        detail: String(item.detail || 'No detail returned'),
      };
    })
    .filter((check): check is LaunchReadinessCheck => Boolean(check));
}

function getReadinessSummary(systemState: Record<string, unknown> | null) {
  const readiness = systemState?.readiness;
  if (!readiness || typeof readiness !== 'object') {
    return {
      status: 'unknown',
      passed: 0,
      warnings: 0,
      failed: 0,
    };
  }
  const summary = (readiness as { summary?: Record<string, unknown> }).summary || {};
  return {
    status: String((readiness as { status?: unknown }).status || 'unknown'),
    passed: Number(summary.passed || 0),
    warnings: Number(summary.warnings || 0),
    failed: Number(summary.failed || 0),
  };
}

function readinessBadgeClass(status: string) {
  if (status === 'pass' || status === 'ready') return 'bg-emerald-50 text-emerald-700';
  if (status === 'warn' || status === 'ready_with_warnings') return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

function readinessIcon(status: string) {
  if (status === 'pass') return CheckCircle2;
  if (status === 'warn') return AlertTriangle;
  return XCircle;
}

function AdminSection({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function AdminConsole() {
  const location = useLocation();
  const activePath = navItems.find((item) => item.path === location.pathname)?.path || '/admin';
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [vendors, setVendors] = useState<Array<Record<string, unknown>>>([]);
  const [listings, setListings] = useState<Array<Record<string, unknown>>>([]);
  const [marketplaceSyncs, setMarketplaceSyncs] = useState<Array<Record<string, unknown>>>([]);
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [posts, setPosts] = useState<Array<Record<string, unknown>>>([]);
  const [accommodationVendors, setAccommodationVendors] = useState<Array<Record<string, unknown>>>([]);
  const [deals, setDeals] = useState<Array<Record<string, unknown>>>([]);
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [contentPreview, setContentPreview] = useState<Record<string, unknown>>({});
  const [systemState, setSystemState] = useState<Record<string, unknown> | null>(null);
  const [auditEntries, setAuditEntries] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCurrentSession()
      .then(async ({ user }) => {
        if (!user) {
          if (mounted) setAllowed(false);
          return;
        }
        const profile = await getProfile(user.id);
        if (mounted) setAllowed(profile.role === 'admin');
      })
      .catch(() => mounted && setAllowed(false))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  async function loadModule(path = activePath) {
    setLoading(true);
    try {
      if (path === '/admin') setOverview(await getAdminOverview());
      if (path === '/admin/users') setUsers((await listAdminUsers()).users);
      if (path === '/admin/vendors') setVendors((await listAdminVendors()).vendors);
      if (path === '/admin/listings') {
        setListings((await listAdminListings()).listings);
        setMarketplaceSyncs((await listAdminMarketplaceSyncs()).syncs);
      }
      if (path === '/admin/bookings') setBookings((await listAdminBookings()).bookings);
      if (path === '/admin/payments') setPayments((await listAdminManualPayments()).payments);
      if (path === '/admin/community') setPosts((await listAdminCommunityPosts()).posts);
      if (path === '/admin/accommodation') setAccommodationVendors((await listAdminAccommodationAccess()).vendors);
      if (path === '/admin/deals') setDeals((await listAdminDeals()).deals);
      if (path === '/admin/content') {
        const response = await getAdminContentConfig();
        setContent(response.config);
        setContentPreview(response.preview);
      }
      if (path === '/admin/system') setSystemState(await getAdminSystemState());
      if (path === '/admin/audit') setAuditEntries((await listAdminAuditEntries()).entries);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load admin module');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allowed) void loadModule(activePath);
  }, [activePath, allowed]);

  const stats = useMemo(() => (overview?.metrics as Record<string, number> | undefined) || {}, [overview]);
  const flags = useMemo(() => (overview?.featureFlags as Record<string, boolean> | undefined) || {}, [overview]);
  const systemConfig = useMemo(() => {
    const siteConfig = systemState?.siteConfig;
    if (!siteConfig || typeof siteConfig !== 'object') return {} as Record<string, boolean>;
    const system = (siteConfig as { system?: Record<string, boolean> }).system;
    return system && typeof system === 'object' ? system : {};
  }, [systemState]);
  const readinessChecks = useMemo(() => getReadinessChecks(systemState), [systemState]);
  const readinessSummary = useMemo(() => getReadinessSummary(systemState), [systemState]);
  const configChecks = readinessChecks.filter((check) => !check.name.startsWith('table:'));
  const tableChecks = readinessChecks.filter((check) => check.name.startsWith('table:'));

  const overviewCards: Array<{ label: string; value: number; Icon: LucideIcon }> = [
    { label: 'Users', value: stats.users || 0, Icon: Users },
    { label: 'Vendors', value: stats.vendors || 0, Icon: Building2 },
    { label: 'Listings', value: stats.activeListings || 0, Icon: Store },
    { label: 'Pending Payments', value: stats.pendingPayments || 0, Icon: Receipt },
  ];

  if (allowed === false) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-8 lg:px-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-6">
              <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                Admin Control
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Tripetrip Command</h1>
              <p className="mt-2 text-sm text-slate-500">Launch control, approvals, moderation, and platform health.</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
                    activePath === item.path ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <Button
              variant="outline"
              className="mt-6 w-full rounded-2xl"
              onClick={() => signOut().then(() => (window.location.href = '/'))}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                {navItems.find((item) => item.path === activePath)?.label || 'Admin'}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">Real controls wired to platform data and live approval paths.</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:hidden">
              {navItems.slice(0, 5).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button variant={activePath === item.path ? 'default' : 'outline'} size="sm" className="rounded-xl">
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {activePath === '/admin' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                {overviewCards.map(({ label, value, Icon }) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <Icon className="h-5 w-5 text-emerald-600" />
                    <div className="mt-4 text-3xl font-black text-slate-950">{value}</div>
                    <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <AdminSection title="Recent Admin Actions" subtitle="Latest control-plane writes and reviews">
                  <div className="space-y-3">
                    {((overview?.recentAdminActions as Array<Record<string, unknown>> | undefined) || []).map((entry) => (
                      <div key={String(entry.id)} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-black text-slate-900">{String(entry.summary || 'Admin action')}</div>
                          <Badge className="bg-slate-900 text-white">{String(entry.module || 'system')}</Badge>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">{String((entry.actor as Record<string, unknown> | undefined)?.fullName || 'Admin')}</div>
                        <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{formatDate(entry.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </AdminSection>
                <AdminSection title="Feature Flags" subtitle="Launch-sensitive switches">
                  <div className="space-y-3">
                    {Object.entries(flags).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-sm font-bold text-slate-700">{key}</div>
                        <Badge className={value ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                          {value ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </AdminSection>
              </div>
            </div>
          )}

          {activePath === '/admin/users' && (
            <AdminSection title="User Management" subtitle="Role changes, profile corrections, and access control">
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={String(user.id)} className="grid gap-4 rounded-2xl border border-slate-200 p-4 xl:grid-cols-[1.4fr_0.6fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-black text-slate-950">{String(user.fullName || 'Unknown User')}</div>
                        <Badge>{String(user.role || 'traveler')}</Badge>
                        {user.bannedUntil ? <Badge className="bg-rose-50 text-rose-700">Suspended</Badge> : null}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">{String(user.email || '')}</div>
                      <div className="mt-1 text-sm text-slate-500">{String(user.phone || '-')}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {(['traveler', 'vendor', 'admin'] as const).map((role) => (
                        <Button key={role} variant="outline" size="sm" onClick={() => updateAdminUser({ userId: user.id, role }).then(() => loadModule())}>
                          {role}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-700"
                        onClick={() => updateAdminUser({ userId: user.id, suspend: !user.bannedUntil }).then(() => loadModule())}
                      >
                        {user.bannedUntil ? 'Reactivate' : 'Suspend'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/vendors' && (
            <AdminSection title="Vendor Approvals" subtitle="Verification, activation, and storefront readiness">
              <div className="space-y-3">
                {vendors.map((vendor) => {
                  const launchReadiness =
                    vendor.launchReadiness && typeof vendor.launchReadiness === 'object'
                      ? (vendor.launchReadiness as {
                          status?: string;
                          passed?: number;
                          total?: number;
                          checks?: Array<{ key: string; label: string; passed: boolean }>;
                        })
                      : null;
                  const readinessStatus = String(launchReadiness?.status || 'blocked');
                  return (
                  <div key={String(vendor.id)} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-black text-slate-950">{String(vendor.business_name || '-')}</div>
                          <Badge className={readinessStatus === 'ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                            {readinessStatus === 'ready'
                              ? 'Launch Ready'
                              : `Launch Blocked ${String(launchReadiness?.passed || 0)}/${String(launchReadiness?.total || 0)}`}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">{String((vendor.profile as Record<string, unknown> | undefined)?.full_name || '')}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['pending', 'verified', 'rejected'] as const).map((status) => (
                          <Button key={status} variant="outline" size="sm" onClick={() => updateAdminVendor({ vendorId: vendor.id, verificationStatus: status }).then(() => loadModule())}>
                            {status}
                          </Button>
                        ))}
                        <Button size="sm" onClick={() => updateAdminVendor({ vendorId: vendor.id, isActive: !vendor.is_active }).then(() => loadModule())}>
                          {vendor.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                    {launchReadiness?.checks?.length ? (
                      <div className="mt-4 grid gap-2 md:grid-cols-3">
                        {launchReadiness.checks.map((check) => (
                          <div key={check.key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                            <span>{check.label}</span>
                            <Badge className={check.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                              {check.passed ? 'Pass' : 'Missing'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  );
                })}
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/listings' && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <AdminSection title="Listing Moderation" subtitle="Visibility, pricing sanity, and marketplace quality control">
                <div className="space-y-3">
                  {listings.map((listing) => (
                    <div key={String(listing.id)} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-950">{String(listing.title || '-')}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {String((listing.vendor_profiles as Record<string, unknown> | undefined)?.business_name || '')} · {String(listing.category || '')}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={listing.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}>
                            {listing.is_active ? 'Live' : 'Hidden'}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => updateAdminListing({ listingId: listing.id, isActive: !listing.is_active }).then(() => loadModule())}>
                            {listing.is_active ? 'Hide' : 'Publish'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminSection>

              <AdminSection title="Publishing Queue" subtitle="Approve or reject PMS-driven marketplace publishing requests">
                <div className="space-y-3">
                  {marketplaceSyncs.map((sync) => {
                    const metadata = (sync.metadata as Record<string, unknown> | undefined) || {};
                    const title = String(metadata.listing_title || 'Untitled listing');
                    const roomType = String(metadata.room_type_name || 'Room inventory');
                    const channelTargets = Array.isArray(metadata.channel_targets) ? metadata.channel_targets.map((value) => String(value)) : [];
                    const channelDistribution = formatChannelDistribution(metadata);
                    const approvalStatus = String(metadata.approval_status || 'open');
                    const listingState = String(metadata.listing_state || sync.sync_status || 'draft');

                    return (
                      <div key={String(sync.id)} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-black text-slate-950">{title}</div>
                            <div className="mt-1 text-sm text-slate-500">{roomType}</div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                              <span>{String(sync.sync_status || 'pending')}</span>
                              <span>{listingState}</span>
                              {channelTargets.map((channel) => (
                                <span key={channel}>{channel}</span>
                              ))}
                            </div>
                          </div>
                          <Badge
                            className={
                              approvalStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : approvalStatus === 'rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                            }
                          >
                            {approvalStatus}
                          </Badge>
                        </div>
                        <div className="mt-3 text-sm text-slate-500">
                          {String(metadata.available_inventory || 0)}/{String(metadata.total_inventory || 0)} available · INR {Number(metadata.nightly_rate || 0).toLocaleString('en-IN')}
                        </div>
                        {channelDistribution.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {channelDistribution.map((item) => (
                              <span
                                key={`${sync.id}-${item}`}
                                className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 ring-1 ring-slate-200"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => updateAdminMarketplaceSync({ syncId: sync.id, approvalStatus: 'approved' }).then(() => loadModule())}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAdminMarketplaceSync({
                                syncId: sync.id,
                                approvalStatus: 'rejected',
                                approvalNote: 'Rejected by admin review',
                              }).then(() => loadModule())
                            }
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAdminMarketplaceSync({
                                syncId: sync.id,
                                approvalStatus: 'approved',
                                listingState: 'paused',
                                syncStatus: 'paused',
                                approvalNote: 'Approved but paused for launch control',
                              }).then(() => loadModule())
                            }
                          >
                            Pause
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AdminSection>
            </div>
          )}

          {activePath === '/admin/bookings' && (
            <AdminSection title="Bookings Control" subtitle="Resolve booking states and payment-state drift">
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={String(booking.id)} className="grid gap-3 rounded-2xl border border-slate-200 p-4 xl:grid-cols-[1.3fr_0.7fr]">
                    <div>
                      <div className="font-black text-slate-950">{String((booking.listings as Record<string, unknown> | undefined)?.title || 'Booking')}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {String((booking.profiles as Record<string, unknown> | undefined)?.full_name || booking.traveler_name || '')} · {formatAmount(booking.total_price)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
                        <Button key={status} size="sm" variant="outline" onClick={() => updateAdminBooking({ bookingId: booking.id, status }).then(() => loadModule())}>
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/payments' && (
            <AdminSection title="Payments & Approvals" subtitle="Manual approval lane for barcode payments">
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={String(payment.id)} className="grid gap-3 rounded-2xl border border-slate-200 p-4 xl:grid-cols-[1.3fr_0.7fr]">
                    <div>
                      <div className="font-black text-slate-950">{String(payment.bookingId || payment.booking_id || payment.id)}</div>
                      <div className="mt-1 text-sm text-slate-500">{String(payment.travelerName || payment.traveler_name || 'Guest')} · {formatAmount(payment.amount)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => updateAdminManualPayment(String(payment.id), 'approve').then(() => loadModule())}>Approve</Button>
                      <Button size="sm" variant="outline" className="border-rose-200 text-rose-700" onClick={() => updateAdminManualPayment(String(payment.id), 'reject').then(() => loadModule())}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/community' && (
            <AdminSection title="Community Moderation" subtitle="Review and remove live traveler/vendor posts">
              <div className="space-y-3">
                {posts.map((post) => {
                  const author = post.profiles as Record<string, unknown> | undefined;
                  return (
                    <div key={String(post.id)} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-950">{String(author?.full_name || 'Tripetrip Member')}</div>
                          <div className="mt-1 text-sm text-slate-500">{String(post.content || '').replace('__tripetrip_community__:', '').slice(0, 180)}</div>
                        </div>
                        <Button size="sm" variant="outline" className="border-rose-200 text-rose-700" onClick={() => removeAdminCommunityPost(String(post.id)).then(() => loadModule())}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/accommodation' && (
            <AdminSection title="Accommodation Access Wall" subtitle="Plan tiers, module visibility, and approval posture for stay providers">
              <div className="space-y-4">
                {accommodationVendors.map((vendor) => {
                  const access = (vendor.access as Record<string, unknown> | undefined) || {};
                  const moduleVisibility = (access.moduleVisibility as Record<string, boolean> | undefined) || {};
                  const capabilityVisibility = (access.resolvedCapabilities as Record<string, boolean> | undefined) || {};
                  const capabilityOverrides = (access.capabilityOverrides as Record<string, boolean> | undefined) || {};
                  const approvalPolicies = (access.resolvedApprovals as Record<string, string> | undefined) || {};
                  const planTier = String(access.planTier || 'advanced') as VendorPlanTier;
                  const enforcementMode = String(access.enforcementMode || 'open') as VendorAccessEnforcementMode;
                  const providerFamily = String(access.providerFamily || 'generic') as VendorProviderFamily;
                  const isAccommodation = providerFamily === 'accommodation';

                  return (
                    <div key={String(vendor.vendorId)} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-black text-slate-950">{String(vendor.businessName || '-')}</div>
                            <Badge>{String(vendor.businessType || 'unknown')}</Badge>
                            <Badge className={isAccommodation ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                              {providerFamily}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            {String(vendor.slug || '')} · {String(vendor.verificationStatus || 'pending')}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {accommodationPlanOptions.map((candidatePlanTier) => (
                            <Button
                              key={candidatePlanTier}
                              size="sm"
                              variant={planTier === candidatePlanTier ? 'default' : 'outline'}
                              onClick={() =>
                                saveAdminAccommodationAccess({
                                  vendorProfileId: vendor.vendorId,
                                  businessType: vendor.businessType,
                                  providerFamily,
                                  planTier: candidatePlanTier,
                                  enforcementMode,
                                  moduleOverrides: access.moduleOverrides || {},
                                  capabilityOverrides: access.capabilityOverrides || {},
                                  approvalOverrides: access.approvalOverrides || {},
                                }).then(() => loadModule())
                              }
                            >
                              {candidatePlanTier}
                            </Button>
                          ))}
                          {accommodationEnforcementOptions.map((mode) => (
                            <Button
                              key={mode}
                              size="sm"
                              variant={enforcementMode === mode ? 'default' : 'outline'}
                              onClick={() =>
                                saveAdminAccommodationAccess({
                                  vendorProfileId: vendor.vendorId,
                                  businessType: vendor.businessType,
                                  providerFamily,
                                  planTier,
                                  enforcementMode: mode,
                                  moduleOverrides: access.moduleOverrides || {},
                                  capabilityOverrides: access.capabilityOverrides || {},
                                  approvalOverrides: access.approvalOverrides || {},
                                }).then(() => loadModule())
                              }
                            >
                              {mode}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {isAccommodation ? (
                        <>
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(moduleVisibility).map(([moduleKey, enabled]) => (
                              <button
                                key={moduleKey}
                                type="button"
                                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                                  enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'
                                }`}
                                onClick={() =>
                                  saveAdminAccommodationAccess({
                                    vendorProfileId: vendor.vendorId,
                                    businessType: vendor.businessType,
                                    providerFamily,
                                    planTier,
                                    enforcementMode,
                                    moduleOverrides: {
                                      ...((access.moduleOverrides as Record<string, boolean> | undefined) || {}),
                                      [moduleKey]: !enabled,
                                    },
                                    capabilityOverrides: access.capabilityOverrides || {},
                                    approvalOverrides: access.approvalOverrides || {},
                                  }).then(() => loadModule())
                                }
                              >
                                <span>{moduleKey}</span>
                                <span>{enabled ? 'On' : 'Off'}</span>
                              </button>
                            ))}
                          </div>
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-black text-slate-950">Capability Wall</div>
                                <div className="mt-1 text-xs font-semibold text-slate-500">
                                  Override plan-derived feature access for specific accommodation vendors.
                                </div>
                              </div>
                              <Badge className="bg-indigo-50 text-indigo-700">Capability Overrides</Badge>
                            </div>
                            {accommodationCapabilityGroups.map((group) => (
                              <div key={group.title} className="rounded-2xl border border-slate-200 p-4">
                                <div className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">{group.title}</div>
                                <div className="grid gap-3 xl:grid-cols-2">
                                  {group.capabilities.map((capabilityKey) => {
                                    const effective = Boolean(capabilityVisibility[capabilityKey]);
                                    const overrideValue = capabilityOverrides[capabilityKey];
                                    const overrideState =
                                      overrideValue === true ? 'force_on' : overrideValue === false ? 'force_off' : 'default';

                                    return (
                                      <div key={capabilityKey} className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <div className="font-bold text-slate-900">{formatAdminLabel(capabilityKey)}</div>
                                          <Badge className={effective ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}>
                                            {effective ? 'Enabled' : 'Locked'}
                                          </Badge>
                                        </div>
                                        <div className="mt-2 text-xs font-semibold text-slate-500">
                                          Override: {overrideState === 'default' ? 'Plan default' : overrideState === 'force_on' ? 'Forced on' : 'Forced off'}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          <Button
                                            size="sm"
                                            variant={overrideState === 'default' ? 'default' : 'outline'}
                                            onClick={() => {
                                              const nextOverrides = { ...capabilityOverrides };
                                              delete nextOverrides[capabilityKey];
                                              return saveAdminAccommodationAccess({
                                                vendorProfileId: vendor.vendorId,
                                                businessType: vendor.businessType,
                                                providerFamily,
                                                planTier,
                                                enforcementMode,
                                                moduleOverrides: access.moduleOverrides || {},
                                                capabilityOverrides: nextOverrides,
                                                approvalOverrides: access.approvalOverrides || {},
                                              }).then(() => loadModule());
                                            }}
                                          >
                                            Default
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={overrideState === 'force_on' ? 'default' : 'outline'}
                                            onClick={() =>
                                              saveAdminAccommodationAccess({
                                                vendorProfileId: vendor.vendorId,
                                                businessType: vendor.businessType,
                                                providerFamily,
                                                planTier,
                                                enforcementMode,
                                                moduleOverrides: access.moduleOverrides || {},
                                                capabilityOverrides: {
                                                  ...capabilityOverrides,
                                                  [capabilityKey]: true,
                                                },
                                                approvalOverrides: access.approvalOverrides || {},
                                              }).then(() => loadModule())
                                            }
                                          >
                                            Force On
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={overrideState === 'force_off' ? 'default' : 'outline'}
                                            onClick={() =>
                                              saveAdminAccommodationAccess({
                                                vendorProfileId: vendor.vendorId,
                                                businessType: vendor.businessType,
                                                providerFamily,
                                                planTier,
                                                enforcementMode,
                                                moduleOverrides: access.moduleOverrides || {},
                                                capabilityOverrides: {
                                                  ...capabilityOverrides,
                                                  [capabilityKey]: false,
                                                },
                                                approvalOverrides: access.approvalOverrides || {},
                                              }).then(() => loadModule())
                                            }
                                          >
                                            Force Off
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(approvalPolicies).map(([policyKey, value]) => (
                              <div key={policyKey} className="rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">{formatAdminLabel(policyKey)}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {accommodationApprovalModes.map((mode) => (
                                    <Button
                                      key={mode}
                                      size="sm"
                                      variant={String(value) === mode ? 'default' : 'outline'}
                                      onClick={() =>
                                        saveAdminAccommodationAccess({
                                          vendorProfileId: vendor.vendorId,
                                          businessType: vendor.businessType,
                                          providerFamily,
                                          planTier,
                                          enforcementMode,
                                          moduleOverrides: access.moduleOverrides || {},
                                          capabilityOverrides: access.capabilityOverrides || {},
                                          approvalOverrides: {
                                            ...((access.approvalOverrides as Record<string, string> | undefined) || {}),
                                            [policyKey]: mode,
                                          },
                                        }).then(() => loadModule())
                                      }
                                    >
                                      {mode}
                                    </Button>
                                  ))}
                                </div>
                                <div className="mt-2 text-xs font-semibold text-slate-500">Effective: {value}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                          This vendor is not currently classified into the accommodation provider family.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/deals' && (
            <AdminSection title="Deals & Promotions" subtitle="Live promotional inventory and performance visibility">
              <div className="grid gap-4 md:grid-cols-2">
                {deals.map((deal) => (
                  <div key={String(deal.id)} className="rounded-2xl border border-slate-200 p-5">
                    <div className="font-black text-slate-950">{String(deal.title || '')}</div>
                    <div className="mt-2 text-sm text-slate-500">{String(deal.destination || '')}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <span>{String(deal.discountPercentage || 0)}% off</span>
                      <span>{String(deal.remainingInventory || 0)} left</span>
                      <span>{String(deal.salesVelocity || 0)}% sold</span>
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/content' && (
            <AdminSection title="Content & Website Control" subtitle="Homepage messaging and featured marketplace picks">
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">
                    Homepage announcement
                    <Input
                      className="mt-2"
                      value={String(content.homepageAnnouncement || '')}
                      onChange={(event) => setContent((current) => ({ ...current, homepageAnnouncement: event.target.value }))}
                    />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Featured vendor slugs
                    <Input
                      className="mt-2"
                      value={Array.isArray(content.featuredVendorSlugs) ? content.featuredVendorSlugs.join(', ') : ''}
                      onChange={(event) =>
                        setContent((current) => ({
                          ...current,
                          featuredVendorSlugs: event.target.value.split(',').map((value) => value.trim()).filter(Boolean),
                        }))
                      }
                    />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Featured listing IDs
                    <Input
                      className="mt-2"
                      value={Array.isArray(content.featuredListingIds) ? content.featuredListingIds.join(', ') : ''}
                      onChange={(event) =>
                        setContent((current) => ({
                          ...current,
                          featuredListingIds: event.target.value.split(',').map((value) => value.trim()).filter(Boolean),
                        }))
                      }
                    />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Featured deal slugs
                    <Input
                      className="mt-2"
                      value={Array.isArray(content.featuredDealSlugs) ? content.featuredDealSlugs.join(', ') : ''}
                      onChange={(event) =>
                        setContent((current) => ({
                          ...current,
                          featuredDealSlugs: event.target.value.split(',').map((value) => value.trim()).filter(Boolean),
                        }))
                      }
                    />
                  </label>
                  <Button onClick={() => saveAdminContentConfig(content).then(() => loadModule())}>Save Content Controls</Button>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm font-black text-slate-900">Public Preview</div>
                  <p className="mt-3 text-sm text-slate-600">{String(contentPreview.announcement || 'No announcement is currently published.')}</p>
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Featured Deals</div>
                    {(((contentPreview.featuredDeals as Array<Record<string, unknown>> | undefined) || [])).map((deal) => (
                      <div key={String(deal.slug)} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700">{String(deal.title)}</div>
                    ))}
                  </div>
                </div>
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/system' && (
            <AdminSection title="System & Integrations" subtitle="Runtime health and launch-sensitive platform switches">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {launchSummaryCards.map(({ label, Icon }) => {
                    const value =
                      label === 'Launch State'
                        ? formatAdminLabel(readinessSummary.status)
                        : label === 'Passed'
                          ? readinessSummary.passed
                          : label === 'Warnings'
                            ? readinessSummary.warnings
                            : readinessSummary.failed;
                    return (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <Icon className="h-5 w-5 text-slate-500" />
                      <div className="mt-3 text-2xl font-black text-slate-950">{String(value)}</div>
                      <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</div>
                    </div>
                  );
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div>
                    <div className="flex items-center gap-2 font-black text-slate-950">
                      <ClipboardList className="h-4 w-4 text-emerald-600" />
                      Production Readiness
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Live Worker checks for launch secrets, runtime config, database migrations, and optional integrations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={readinessBadgeClass(readinessSummary.status)}>{formatAdminLabel(readinessSummary.status)}</Badge>
                    <Button size="sm" variant="outline" onClick={() => loadModule('/admin/system')}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4">
                  {[
                    ['registrationEnabled', 'Registration'],
                    ['communityEnabled', 'Community'],
                    ['dealsEnabled', 'Deals'],
                    ['maintenanceMode', 'Maintenance mode'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="font-bold text-slate-700">{label}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          saveAdminSystemConfig({
                            ...systemConfig,
                            [key]: !Boolean(systemConfig[key]),
                          }).then(() => loadModule())
                        }
                      >
                        {systemConfig[key] ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 font-black text-slate-900"><Shield className="h-4 w-4 text-emerald-600" /> Launch Gates</div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {configChecks.map((check) => {
                        const Icon = readinessIcon(check.status);
                        return (
                          <div key={check.name} className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 font-black text-slate-900">
                                <Icon className="h-4 w-4" />
                                {formatAdminLabel(check.name)}
                              </div>
                              <Badge className={readinessBadgeClass(check.status)}>{formatAdminLabel(check.status)}</Badge>
                            </div>
                            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{check.detail}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 font-black text-slate-900"><Building2 className="h-4 w-4 text-emerald-600" /> Supabase Tables</div>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {tableChecks.map((check) => {
                        const Icon = readinessIcon(check.status);
                        return (
                          <div key={check.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-700">
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{check.name.replace('table:', '')}</span>
                            </div>
                            <Badge className={readinessBadgeClass(check.status)}>{formatAdminLabel(check.status)}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 font-black text-slate-900"><ClipboardList className="h-4 w-4 text-emerald-600" /> Manual Smoke Tests</div>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {launchSmokeTests.map((item) => (
                        <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-slate-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 font-black text-slate-900"><Shield className="h-4 w-4 text-emerald-600" /> Config Health</div>
                    <pre className="mt-3 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify((systemState?.configHealth || {}), null, 2)}</pre>
                  </div>
                </div>
                </div>
              </div>
            </AdminSection>
          )}

          {activePath === '/admin/audit' && (
            <AdminSection title="Support & Audit" subtitle="Persistent admin action history">
              <div className="space-y-3">
                {auditEntries.map((entry) => (
                  <div key={String(entry.id)} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-950">{String(entry.summary || '')}</div>
                        <div className="mt-1 text-sm text-slate-500">{String((entry.actor as Record<string, unknown> | undefined)?.fullName || '')}</div>
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{formatDate(entry.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          )}

          {(loading || allowed === null) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">Loading admin control plane...</div>
          )}
        </div>
      </div>
    </div>
  );
}
