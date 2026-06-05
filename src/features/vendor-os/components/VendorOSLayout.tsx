import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { vendorOSModules } from '../data';
import type { PermissionAction, VendorBranch, VendorNotification, VendorOrganization, VendorOSModule, VendorOSRole } from '../types';
import { VendorOSSidebar } from './VendorOSSidebar';
import { VendorOSTopbar } from './VendorOSTopbar';

interface VendorOSLayoutProps {
  children: ReactNode;
  organization: Partial<VendorOrganization> | null;
  branches: VendorBranch[];
  activeBranch: VendorBranch | null;
  role: VendorOSRole;
  notifications: Partial<VendorNotification>[];
  unreadCount: number;
  markNotificationAsRead?: (notificationId: string) => Promise<void> | void;
  can: (module: VendorOSModule, action?: PermissionAction) => boolean;
}

export function VendorOSLayout({
  children,
  organization,
  branches,
  activeBranch,
  role,
  notifications,
  unreadCount,
  markNotificationAsRead,
  can,
}: VendorOSLayoutProps) {
  const visibleModules = vendorOSModules.filter((module) => can(module.id, 'view'));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex">
        <VendorOSSidebar can={can} />
        <div className="min-w-0 flex-1">
          <VendorOSTopbar
            organization={organization}
            branches={branches}
            activeBranch={activeBranch}
            role={role}
            notifications={notifications}
            unreadCount={unreadCount}
            markNotificationAsRead={markNotificationAsRead}
          />
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {visibleModules.map((module) => (
                <Link
                  key={module.id}
                  to={module.path}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  <module.icon className="h-4 w-4 text-emerald-600" />
                  {module.label}
                </Link>
              ))}
            </div>
          </div>
          <main className="px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
