import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { vendorOSModules } from '../data';
import type { PermissionAction, VendorOSModule } from '../types';

interface VendorOSSidebarProps {
  can: (module: VendorOSModule, action?: PermissionAction) => boolean;
}

export function VendorOSSidebar({ can }: VendorOSSidebarProps) {
  const location = useLocation();
  const visibleModules = vendorOSModules.filter((module) => can(module.id, 'view'));

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="text-2xl font-black tracking-tight text-slate-950">Tripetrip</div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600">Vendor OS</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleModules.map((module) => {
            const active = location.pathname === module.path || (module.path !== '/vendor/os' && location.pathname.startsWith(module.path));
            return (
              <Link
                key={module.id}
                to={module.path}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition',
                  active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                )}
              >
                <module.icon className="h-4 w-4" />
                {module.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
