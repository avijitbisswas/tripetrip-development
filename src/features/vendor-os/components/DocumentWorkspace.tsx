import { useMemo, useState, type FormEvent } from 'react';
import {
  Archive,
  BellRing,
  CalendarClock,
  Download,
  FileCheck2,
  FileText,
  FolderLock,
  Link2,
  ShieldCheck,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { getAccommodationModuleInsights } from '../accommodationModuleInsights';
import { useVendorDocumentDownload, useVendorDocumentUpload, useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import { AccommodationInsightPanel } from './AccommodationInsightPanel';

interface DocumentWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
  accommodationAccess?: ResolvedVendorAccommodationAccess | null;
}

const vaultDocuments = [
  { name: 'Hotel Trade License', type: 'License', owner: 'Manali Hotel', expiry: 'Expires 2026-12-31', state: 'Active' },
  { name: 'Rafting Safety Permit', type: 'Permit', owner: 'Rishikesh Base', expiry: 'Expires 2026-09-30', state: 'Active' },
  { name: 'Goa Villa Insurance', type: 'Insurance', owner: 'Goa Villa Desk', expiry: 'Review in 18 days', state: 'Review' },
  { name: 'Transport Fitness Certificate', type: 'Fleet', owner: 'Mobility Desk', expiry: 'Expires 2026-08-14', state: 'Active' },
];

const expiryAlerts = [
  { title: 'Insurance renewal', detail: 'Goa Villa Desk policy needs renewal evidence.', value: '18 days', state: 'Review' },
  { title: 'Driver permit batch', detail: '3 fleet documents should be checked before monsoon departures.', value: '24 days', state: 'Monitor' },
  { title: 'Adventure safety pack', detail: 'Rafting SOP and instructor certificates are current.', value: 'Valid', state: 'Clear' },
];

const bookingDocs = [
  { title: 'Voucher templates', detail: 'Confirmation vouchers, invoices, waivers, and itinerary PDFs.', state: 'Ready' },
  { title: 'Supplier contracts', detail: 'DMC, hotel, fleet, guide, and activity vendor agreements.', state: 'Controlled' },
  { title: 'Guest identity records', detail: 'Branch-scoped files connected to bookings and retention policy.', state: 'Protected' },
];

const governance = [
  { title: 'Access control', detail: 'Documents inherit organization, branch, module, and role boundaries.', icon: FolderLock },
  { title: 'Expiry automation', detail: 'Expiry dates can create alerts for managers and compliance owners.', icon: BellRing },
  { title: 'Audit trail ready', detail: 'Upload, review, archive, and replacement actions can feed audit logs.', icon: Archive },
];

const documentSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Compliance source of truth',
    detail: 'Keep KYC, licenses, permits, GST, insurance, SOPs, fleet papers, and contracts in one workspace.',
    icon: ShieldCheck,
  },
  {
    title: 'Booking-linked paperwork',
    detail: 'Prepare the model for vouchers, waivers, invoices, and supplier documents connected to reservations.',
    icon: Link2,
  },
  {
    title: 'Storage-provider ready',
    detail: 'Files upload to private vendor storage and records retain their tenant-scoped object paths.',
    icon: UploadCloud,
  },
];

const documentStatusOptions = ['draft', 'active', 'expired', 'archived'];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function StatePill({ state }: { state: string }) {
  const attention = ['Review', 'Monitor', 'Expired'].includes(state);
  const archived = state === 'Archived';
  return (
    <span
      className={
        archived
          ? 'w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-slate-200'
          : attention
            ? 'w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase text-amber-700 ring-1 ring-amber-100'
            : 'w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100'
      }
    >
      {state}
    </span>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">{detail}</div>
    </div>
  );
}

export function DocumentWorkspace({ organizationId, branchId, accommodationAccess }: DocumentWorkspaceProps) {
  const records = useVendorOSRecords('documents', organizationId);
  const mutations = useVendorOSRecordMutations('documents', organizationId, branchId);
  const uploads = useVendorDocumentUpload(organizationId, branchId);
  const downloads = useVendorDocumentDownload();
  const accommodationInsight = getAccommodationModuleInsights('documents', accommodationAccess);
  const [documentForm, setDocumentForm] = useState({
    name: '',
    document_type: '',
    storage_path: '',
    status: 'active',
    file: null as File | null,
  });
  const [reviewForm, setReviewForm] = useState({
    document_id: '',
    decision: 'active',
    note: '',
  });
  const [fileInputKey, setFileInputKey] = useState(0);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const liveDocuments = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        name: String(record.name || 'Untitled document'),
        type: titleCase(String(record.document_type || 'document')),
        owner: String(record.entity_type || record.module || 'Vendor OS'),
        expiry: record.expires_at ? `Expires ${record.expires_at}` : 'No expiry set',
        state: titleCase(String(record.status || 'active')),
        rawStatus: String(record.status || 'active'),
        storagePath: String(record.storage_path || ''),
        reviewNote:
          record.metadata && typeof record.metadata === 'object' && 'review_note' in record.metadata
            ? String((record.metadata as Record<string, unknown>).review_note || '')
            : '',
      })),
    [records.records],
  );
  const displayedDocuments = liveDocuments.length ? liveDocuments : vaultDocuments;

  async function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      if (documentForm.file) {
        await uploads.uploadDocument({
          name: documentForm.name,
          document_type: documentForm.document_type,
          status: documentForm.status as 'draft' | 'active' | 'expired' | 'archived',
          file: documentForm.file,
        });
      } else {
        await mutations.createRecord({
          module: 'documents',
          name: documentForm.name,
          document_type: documentForm.document_type,
          storage_path: documentForm.storage_path,
          status: documentForm.status,
        });
      }
      setDocumentForm({
        name: '',
        document_type: '',
        storage_path: '',
        status: 'active',
        file: null,
      });
      setFileInputKey((current) => current + 1);
      await records.refresh();
      setFormMessage(documentForm.file ? 'Document uploaded' : 'Document created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create document');
    }
  }

  function handleReviewDocumentChange(documentId: string) {
    const document = liveDocuments.find((item) => item.id === documentId);
    setReviewForm((current) => ({
      ...current,
      document_id: documentId,
      decision: document?.rawStatus || current.decision,
      note: document?.reviewNote || current.note,
    }));
  }

  async function handleDocumentReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    if (!reviewForm.document_id) {
      setFormMessage('Select a document before saving review');
      return;
    }

    try {
      await mutations.updateRecord(reviewForm.document_id, {
        status: reviewForm.decision,
        metadata: {
          review_note: reviewForm.note,
          review_decision: reviewForm.decision,
          source: 'document_workspace',
        },
      });
      await records.refresh();
      setFormMessage('Document review saved');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to save document review');
    }
  }

  async function handleDocumentDownload(storagePath: string) {
    if (!storagePath) return;
    try {
      const signedUrl = await downloads.createDownloadUrl(storagePath);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to prepare document download');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Compliance, files, expiries, booking paperwork
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Document Management</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Centralize vendor licenses, permits, insurance, contracts, KYC files, booking documents, and expiry accountability.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <CalendarClock className="mr-2 h-4 w-4" />
              Review Expiries
            </Button>
          </div>
        </div>
      </section>

      <AccommodationInsightPanel insight={accommodationInsight} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Document Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_documents</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Branch Scoped
          </span>
        </div>
        <form className="grid gap-3 lg:grid-cols-[1fr_0.65fr_1fr_1fr_0.6fr_auto]" onSubmit={handleDocumentSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Document name *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Hotel Trade License"
              required
              value={documentForm.name}
              onChange={(inputEvent) => setDocumentForm((current) => ({ ...current, name: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Document type *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="license"
              required
              value={documentForm.document_type}
              onChange={(inputEvent) => setDocumentForm((current) => ({ ...current, document_type: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Storage path {!documentForm.file ? '*' : ''}
            </span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="vendors/org-1/licenses/file.pdf"
              required={!documentForm.file}
              value={documentForm.storage_path}
              onChange={(inputEvent) => setDocumentForm((current) => ({ ...current, storage_path: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">File upload</span>
            <input
              key={fileInputKey}
              className="block h-11 w-full cursor-pointer rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-bold text-slate-600 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              type="file"
              onChange={(inputEvent) =>
                setDocumentForm((current) => ({
                  ...current,
                  file: inputEvent.target.files?.[0] || null,
                }))
              }
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={documentForm.status}
              onChange={(inputEvent) => setDocumentForm((current) => ({ ...current, status: inputEvent.target.value }))}
            >
              {documentStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || uploads.submitting || !organizationId}
            type="submit"
          >
            Create Document
          </Button>
        </form>
        {(formMessage || mutations.error || uploads.error || downloads.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">
            {formMessage || mutations.error || uploads.error || downloads.error || records.error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Document Review</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Approve, expire, or archive live compliance records</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase text-amber-700">
            Approval workflow
          </span>
        </div>
        <form className="grid gap-3 lg:grid-cols-[1fr_0.6fr_1.3fr_auto]" onSubmit={handleDocumentReviewSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Review document *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={reviewForm.document_id}
              onChange={(inputEvent) => handleReviewDocumentChange(inputEvent.target.value)}
            >
              <option value="">Select document</option>
              {liveDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.name} - {document.type}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Review decision *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={reviewForm.decision}
              onChange={(inputEvent) => setReviewForm((current) => ({ ...current, decision: inputEvent.target.value }))}
            >
              {documentStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Review note</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Compliance review note"
              value={reviewForm.note}
              onChange={(inputEvent) => setReviewForm((current) => ({ ...current, note: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId || !reviewForm.document_id}
            type="submit"
          >
            Save Document Review
          </Button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Vault" value={String(displayedDocuments.length)} detail="Documents tracked" />
        <Metric label="Expiries" value="3" detail="Need attention" />
        <Metric label="Booking Docs" value="Ready" detail="Voucher prepared" />
        <Metric label="Storage" value="Paths" detail="Upload-ready model" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Compliance Vault</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">Live records replace examples after creation</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{displayedDocuments.length} tracked</span>
          </div>
          <div className="space-y-3">
            {displayedDocuments.map((document) => (
              <div
                key={`${document.name}-${document.type}`}
                className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[1fr_0.45fr_0.65fr_auto_auto] md:items-center"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    {document.name}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{document.owner}</div>
                </div>
                <div className="text-sm font-bold text-slate-800">{document.type}</div>
                <div className="text-sm font-semibold text-slate-500">{document.expiry}</div>
                <StatePill state={document.state} />
                {'storagePath' in document && document.storagePath ? (
                  <Button
                    aria-label={`Download ${document.name}`}
                    className="h-9 rounded-xl border-emerald-200 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:bg-emerald-50"
                    disabled={downloads.submitting}
                    type="button"
                    variant="outline"
                    onClick={() => handleDocumentDownload(String(document.storagePath))}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Expiry Alerts</h3>
          <div className="mt-4 space-y-3">
            {expiryAlerts.map((alert) => (
              <div key={alert.title} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{alert.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{alert.detail}</p>
                  </div>
                  <StatePill state={alert.state} />
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-600">{alert.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Booking Docs</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {bookingDocs.map((document) => (
              <div key={document.title} className="rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm font-black text-slate-950">{document.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{document.detail}</p>
                <div className="mt-4">
                  <StatePill state={document.state} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Storage Governance</h3>
          <div className="mt-4 space-y-3">
            {governance.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl bg-emerald-50 p-4">
                  <Icon className="h-5 w-5 text-emerald-700" />
                  <div className="mt-3 text-sm font-black text-slate-950">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {documentSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div key={signal.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-sm font-black text-slate-950">{signal.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{signal.detail}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
