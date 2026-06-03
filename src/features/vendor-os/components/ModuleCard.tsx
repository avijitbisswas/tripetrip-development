import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { VendorOSNavItem } from '../data';

interface ModuleCardProps {
  module: VendorOSNavItem;
}

export function ModuleCard({ module }: ModuleCardProps) {
  return (
    <Link
      to={module.path}
      className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/60"
    >
      <div>
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-emerald-600 ring-1 ring-slate-100">
            <module.icon className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            {module.metric}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-950">{module.label}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        Open
        <ArrowUpRight className="h-4 w-4 transition group-hover:text-emerald-600" />
      </div>
    </Link>
  );
}
