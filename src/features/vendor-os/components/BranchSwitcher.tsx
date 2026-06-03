import { Building2, ChevronDown } from 'lucide-react';
import type { VendorBranch } from '../types';

interface BranchSwitcherProps {
  branches: VendorBranch[];
  activeBranch: VendorBranch | null;
}

export function BranchSwitcher({ branches, activeBranch }: BranchSwitcherProps) {
  return (
    <button className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Building2 className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Branch</span>
        <span className="block truncate text-sm font-bold text-slate-900">
          {activeBranch?.name || (branches.length ? 'All branches' : 'No branch yet')}
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}
