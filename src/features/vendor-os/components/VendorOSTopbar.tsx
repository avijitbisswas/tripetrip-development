import { ShieldCheck } from 'lucide-react';
import { BranchSwitcher } from './BranchSwitcher';
import { NotificationCenter } from './NotificationCenter';
import type { VendorBranch, VendorNotification, VendorOrganization, VendorOSRole } from '../types';

interface VendorOSTopbarProps {
  organization: Partial<VendorOrganization> | null;
  branches: VendorBranch[];
  activeBranch: VendorBranch | null;
  role: VendorOSRole;
  notifications: Partial<VendorNotification>[];
  unreadCount: number;
}

export function VendorOSTopbar({
  organization,
  branches,
  activeBranch,
  role,
  notifications,
  unreadCount,
}: VendorOSTopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
            Multi-tenant travel operations
          </div>
          <h1 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">Tripetrip Vendor OS</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            <span>{organization?.name || 'Create your first business'}</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="capitalize">{role}</span>
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_minmax(0,320px)]">
          <BranchSwitcher branches={branches} activeBranch={activeBranch} />
          <NotificationCenter notifications={notifications} unreadCount={unreadCount} />
        </div>
      </div>
    </header>
  );
}
