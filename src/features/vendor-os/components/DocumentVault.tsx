import { FileText } from 'lucide-react';
import type { VendorDocument } from '../types';

interface DocumentVaultProps {
  documents: Partial<VendorDocument>[];
}

export function DocumentVault({ documents }: DocumentVaultProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-emerald-600" />
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Document Vault</h2>
      </div>
      <div className="space-y-3">
        {documents.slice(0, 4).map((document) => (
          <div key={document.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-900">{document.name}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {document.document_type}
              </div>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100">
              {document.status}
            </span>
          </div>
        ))}
        {documents.length === 0 && <div className="text-sm text-slate-500">Upload KYC, permits, and contracts here.</div>}
      </div>
    </section>
  );
}
