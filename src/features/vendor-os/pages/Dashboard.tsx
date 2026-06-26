import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getCurrentSession } from '@/src/services/auth';
import { AccountingWorkspace } from '../components/AccountingWorkspace';
import { AIAssistantWorkspace } from '../components/AIAssistantWorkspace';
import { AnalyticsWorkspace } from '../components/AnalyticsWorkspace';
import { AuditTimeline } from '../components/AuditTimeline';
import { BranchWorkspace } from '../components/BranchWorkspace';
import { CalendarInventoryWorkspace } from '../components/CalendarInventoryWorkspace';
import { CrmInboxWorkspace } from '../components/CrmInboxWorkspace';
import { DocumentWorkspace } from '../components/DocumentWorkspace';
import { DocumentVault } from '../components/DocumentVault';
import { FleetWorkspace } from '../components/FleetWorkspace';
import { MarketplaceWorkspace } from '../components/MarketplaceWorkspace';
import { ModuleCard } from '../components/ModuleCard';
import { PmsWorkspace } from '../components/PmsWorkspace';
import { SettingsWorkspace } from '../components/SettingsWorkspace';
import { SubscriptionWorkspace } from '../components/SubscriptionWorkspace';
import { TeamWorkspace } from '../components/TeamWorkspace';
import { ToursActivitiesWorkspace } from '../components/ToursActivitiesWorkspace';
import { VendorOSLayout } from '../components/VendorOSLayout';
import { getVendorOSModuleByPath, vendorOSModules } from '../data';
import {
  useVendorOSAuditLogs,
  useVendorOSDocuments,
  useVendorOSNotifications,
  useVendorOSRecordMutations,
  useVendorOSRecords,
  useVendorOSTenant,
} from '../hooks';
import { vendorOSWorkflows } from '../moduleWorkflows';
import { getVendorOSOperation } from '../operations';
import type { VendorOSModule } from '../types';

interface VendorOSDashboardProps {
  initialUserId?: string;
}

function getInitialFieldValue(fieldType: string, options?: string[]) {
  if (fieldType === 'select') return options?.[0] || '';
  return '';
}

function normalizeFieldValue(fieldType: string, value: string) {
  if (fieldType === 'number') return value === '' ? null : Number(value);
  if (fieldType === 'select' && value === 'true') return true;
  if (fieldType === 'select' && value === 'false') return false;
  return value;
}

function ModuleWorkspace({
  module,
  organizationId,
  branchId,
}: {
  module: VendorOSModule;
  organizationId?: string;
  branchId?: string | null;
}) {
  const workflow = vendorOSWorkflows[module];
  const operation = getVendorOSOperation(module);
  const moduleRecords = useVendorOSRecords(module, organizationId);
  const mutations = useVendorOSRecordMutations(module, organizationId, branchId);
  const initialFormValues = useMemo(
    () =>
      Object.fromEntries(
        operation.createFields.map((field) => [field.name, getInitialFieldValue(field.type, field.options)]),
      ),
    [operation.createFields],
  );
  const [formValues, setFormValues] = useState<Record<string, string>>(initialFormValues);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const displayedRecords = moduleRecords.records.length
    ? moduleRecords.records.map((row) => ({
        title: String(row[operation.titleField] || 'Untitled record'),
        meta: operation.dateField ? String(row[operation.dateField] || 'No date') : operation.table,
        value: operation.valueField ? String(row[operation.valueField] || '-') : operation.table,
        status: String(row[operation.statusField] || 'active'),
      }))
    : workflow.records;

  useEffect(() => {
    setFormValues(initialFormValues);
  }, [initialFormValues]);

  async function handleCreateRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateMessage(null);
    const payload = Object.fromEntries(
      operation.createFields
        .filter((field) => formValues[field.name] !== '')
        .map((field) => [field.name, normalizeFieldValue(field.type, formValues[field.name] || '')]),
    );

    try {
      await mutations.createRecord(payload);
      setFormValues(initialFormValues);
      await moduleRecords.refresh();
      setCreateMessage('Record created');
    } catch (err) {
      setCreateMessage(err instanceof Error ? err.message : 'Unable to create record');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Operating workspace
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{workflow.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{workflow.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {workflow.primaryActions.map((action) => (
              <Button
                key={action}
                className="rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700"
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {workflow.kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{kpi.label}</div>
            <div className="mt-3 text-2xl font-black text-slate-950">{kpi.value}</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">{kpi.trend}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {workflow.lanes.map((lane) => (
          <div key={lane.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-black text-slate-950">{lane.title}</h3>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-slate-100">
                {lane.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{lane.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Operational Records</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by `{operation.table}`</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{displayedRecords.length} tracked</span>
        </div>
        <div className="space-y-3">
          {displayedRecords.map((record) => (
            <div key={`${record.title}-${record.meta}`} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
              <div className="text-sm font-black text-slate-950">{record.title}</div>
              <div className="text-sm text-slate-500">{record.meta}</div>
              <div className="text-sm font-bold text-slate-900">{record.value}</div>
              <div className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100">
                {record.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Create Record</h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={handleCreateRecord}>
          {operation.createFields.map((field) => (
            <label key={field.name} className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {field.label}
                {field.required ? ' *' : ''}
              </span>
              {field.type === 'select' ? (
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  required={field.required}
                  value={formValues[field.name] || ''}
                  onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                >
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  required={field.required}
                  type={field.type === 'datetime' ? 'datetime-local' : field.type}
                  value={formValues[field.name] || ''}
                  onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  placeholder={field.label}
                />
              )}
            </label>
          ))}
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            {mutations.submitting ? 'Saving' : 'Create'}
          </Button>
        </form>
        {(createMessage || mutations.error || moduleRecords.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{createMessage || mutations.error || moduleRecords.error}</p>
        )}
      </section>
    </div>
  );
}

export default function Dashboard({ initialUserId }: VendorOSDashboardProps) {
  const params = useParams();
  const [sessionUserId, setSessionUserId] = useState(initialUserId || null);

  useEffect(() => {
    if (initialUserId) return;
    getCurrentSession().then((state) => setSessionUserId(state.user?.id || null));
  }, [initialUserId]);

  const tenant = useVendorOSTenant(sessionUserId);
  const notifications = useVendorOSNotifications(sessionUserId);
  const auditLogs = useVendorOSAuditLogs(tenant.selectedOrganization?.id);
  const documents = useVendorOSDocuments(tenant.selectedOrganization?.id);
  const activeModule = useMemo(() => getVendorOSModuleByPath(params.module), [params.module]);
  const visibleModules = vendorOSModules.filter((module) => tenant.can(module.id, 'view'));
  const accommodationAccess = tenant.accommodationAccess;

  if (tenant.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold uppercase tracking-widest text-slate-400">
        Loading Vendor OS
      </div>
    );
  }

  return (
    <VendorOSLayout
      organization={tenant.selectedOrganization}
      branches={tenant.branches}
      activeBranch={tenant.activeBranch}
      role={tenant.role}
      notifications={notifications.notifications}
      unreadCount={notifications.unreadCount}
      markNotificationAsRead={notifications.markAsRead}
      can={tenant.can}
    >
      <div className="space-y-6">
        {!tenant.selectedOrganization && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-xl font-black text-slate-950">Create your first Vendor OS business</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your organization, branches, team permissions, documents, notifications, and audit logs will connect here.
            </p>
          </section>
        )}

        {activeModule === 'dashboard' ? (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              {[
                ['Live Modules', visibleModules.length],
                ['Branches', tenant.branches.length],
                ['Unread', notifications.unreadCount],
                ['Role', tenant.role],
                ...(accommodationAccess?.isAccommodationProvider
                  ? [
                      ['Plan', accommodationAccess.planTier],
                      ['Access', accommodationAccess.enforcementMode],
                    ]
                  : []),
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
                  <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
                </div>
              ))}
            </section>

            {accommodationAccess?.isAccommodationProvider && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Accommodation Access</div>
                    <div className="mt-2 text-base font-black text-slate-950">
                      {accommodationAccess.planTier} plan · {accommodationAccess.enforcementMode} mode
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Vendor OS modules are filtered for accommodation operations. Advanced automation remains roadmap-backed until the backend workflows are implemented.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                    {accommodationAccess.visibleModules.length} visible modules
                  </div>
                </div>
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleModules
                .filter((module) => module.id !== 'dashboard')
                .map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <AuditTimeline logs={auditLogs} />
              <DocumentVault documents={documents} />
            </section>
          </>
        ) : activeModule === 'crm' || activeModule === 'inbox' ? (
          <CrmInboxWorkspace
            mode={activeModule}
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'calendar' ? (
          <CalendarInventoryWorkspace
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'pms' ? (
          <PmsWorkspace
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'tours' || activeModule === 'activities' ? (
          <ToursActivitiesWorkspace
            mode={activeModule}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'fleet' ? (
          <FleetWorkspace
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'accounting' ? (
          <AccountingWorkspace
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'marketplace' ? (
          <MarketplaceWorkspace
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'ai_assistant' ? (
          <AIAssistantWorkspace
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'subscriptions' ? (
          <SubscriptionWorkspace accommodationAccess={accommodationAccess} organizationId={tenant.selectedOrganization?.id} />
        ) : activeModule === 'analytics' ? (
          <AnalyticsWorkspace
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'team' ? (
          <TeamWorkspace
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'branches' ? (
          <BranchWorkspace organizationId={tenant.selectedOrganization?.id} />
        ) : activeModule === 'documents' ? (
          <DocumentWorkspace
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : activeModule === 'settings' ? (
          <SettingsWorkspace
            accommodationAccess={accommodationAccess}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        ) : (
          <ModuleWorkspace
            module={activeModule}
            organizationId={tenant.selectedOrganization?.id}
            branchId={tenant.activeBranch?.id || null}
          />
        )}
      </div>
    </VendorOSLayout>
  );
}
