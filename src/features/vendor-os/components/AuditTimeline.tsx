import { History } from 'lucide-react';
import type { VendorAuditLog } from '../types';

interface AuditTimelineProps {
  logs: Partial<VendorAuditLog>[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-emerald-600" />
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Audit Timeline</h2>
      </div>
      <div className="space-y-3">
        {logs.slice(0, 4).map((log) => (
          <div key={log.id} className="border-l-2 border-emerald-200 pl-4">
            <div className="text-sm font-bold text-slate-900">{log.action}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {log.module} · {log.severity}
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="text-sm text-slate-500">Audit activity will appear here.</div>}
      </div>
    </section>
  );
}
