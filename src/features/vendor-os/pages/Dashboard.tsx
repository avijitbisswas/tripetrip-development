import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getCurrentSession } from '@/src/services/auth';
import { AuditTimeline } from '../components/AuditTimeline';
import { DocumentVault } from '../components/DocumentVault';
import { ModuleCard } from '../components/ModuleCard';
import { VendorOSLayout } from '../components/VendorOSLayout';
import { getVendorOSModuleByPath, vendorOSModules } from '../data';
import { useVendorOSAuditLogs, useVendorOSDocuments, useVendorOSNotifications, useVendorOSTenant } from '../hooks';
import type { VendorOSModule } from '../types';
import { moduleContent } from './moduleContent';

interface VendorOSDashboardProps {
  initialUserId?: string;
}

function ModuleWorkspace({ module }: { module: VendorOSModule }) {
  const content = moduleContent[module];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">Module foundation</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{content.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{content.subtitle}</p>
        </div>
        <Button className="rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
          Create Record
        </Button>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {content.bullets.map((bullet) => (
          <div key={bullet} className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700 ring-1 ring-slate-100">
            {bullet}
          </div>
        ))}
      </div>
    </section>
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
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
                  <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
                </div>
              ))}
            </section>

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
        ) : (
          <ModuleWorkspace module={activeModule} />
        )}
      </div>
    </VendorOSLayout>
  );
}
