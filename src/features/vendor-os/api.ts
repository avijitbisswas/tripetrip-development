import { supabase } from '@/src/lib/supabase';
import { ServiceError } from '@/src/services/errors';
import type {
  VendorAuditLog,
  VendorBranch,
  DocumentStatus,
  VendorDocument,
  VendorNotification,
  VendorOrganization,
  VendorOSModule,
  VendorRolePermission,
  VendorTeamMember,
  VendorTeamMemberStatus,
} from './types';
import type { VendorOSOperation } from './operations';

type OrganizationInput = Pick<VendorOrganization, 'owner_user_id' | 'name' | 'slug'> &
  Partial<
    Pick<
      VendorOrganization,
      | 'primary_vendor_profile_id'
      | 'legal_name'
      | 'description'
      | 'logo_url'
      | 'cover_url'
      | 'default_currency'
      | 'timezone'
      | 'categories'
      | 'settings'
    >
  >;

type BranchInput = Pick<VendorBranch, 'organization_id' | 'name'> &
  Partial<
    Pick<
      VendorBranch,
      | 'branch_code'
      | 'categories'
      | 'address'
      | 'city'
      | 'state'
      | 'country'
      | 'pincode'
      | 'lat'
      | 'lng'
      | 'phone'
      | 'email'
      | 'manager_user_id'
      | 'settings'
    >
  >;

type TeamMemberInput = Pick<VendorTeamMember, 'organization_id' | 'role'> &
  Partial<
    Pick<
      VendorTeamMember,
      'branch_id' | 'user_id' | 'title' | 'display_name' | 'invited_email' | 'invited_by' | 'accepted_at' | 'status' | 'is_active'
    >
  >;

type AuditLogInput = Pick<VendorAuditLog, 'organization_id' | 'module' | 'action'> &
  Partial<
    Pick<VendorAuditLog, 'branch_id' | 'actor_user_id' | 'entity_type' | 'entity_id' | 'severity' | 'metadata'>
  >;

type DocumentInput = Pick<VendorDocument, 'organization_id' | 'module' | 'name' | 'document_type' | 'storage_path'> &
  Partial<
    Pick<
      VendorDocument,
      'branch_id' | 'uploaded_by' | 'entity_type' | 'entity_id' | 'mime_type' | 'file_size_bytes' | 'status' | 'expires_at' | 'metadata'
    >
  >;

export const VENDOR_DOCUMENTS_BUCKET = 'vendor-documents';

type UploadVendorDocumentInput = {
  organizationId: string;
  branchId?: string | null;
  module: VendorOSModule;
  name: string;
  documentType: string;
  status?: DocumentStatus;
  file: File | Blob;
  fileName?: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

function toServiceError(error: { message: string }, code: string) {
  return new ServiceError(error.message, code, 500);
}

async function getCurrentAuditActorId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id || null;
}

async function getRequiredCurrentUserId() {
  const userId = await getCurrentAuditActorId();
  if (!userId) {
    throw new ServiceError('Sign in before uploading vendor documents', 'VENDOR_OS_AUTH_REQUIRED', 401);
  }
  return userId;
}

function sanitizeStorageSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'document';
}

function getFileMetadata(file: File | Blob, fallbackName: string) {
  const candidate = 'name' in file && typeof file.name === 'string' ? file.name : fallbackName;
  return {
    fileName: candidate,
    mimeType: file.type || null,
    size: typeof file.size === 'number' ? file.size : null,
  };
}

function normalizeTeamMemberStatus(status?: unknown): VendorTeamMemberStatus {
  if (status === 'active' || status === 'suspended' || status === 'invited') return status;
  return 'invited';
}

async function buildTeamMemberPayload(input: Record<string, unknown>) {
  const status = normalizeTeamMemberStatus(input.status);
  return {
    ...input,
    invited_by: input.invited_by || (await getRequiredCurrentUserId()),
    status,
    is_active: input.is_active ?? status !== 'suspended',
    accepted_at: input.accepted_at ?? (status === 'active' ? new Date().toISOString() : null),
  };
}

export function buildVendorDocumentStoragePath(input: {
  organizationId: string;
  branchId?: string | null;
  documentType: string;
  fileName: string;
}) {
  const branchPath = input.branchId ? `branches/${input.branchId}/` : '';
  return [
    `organizations/${input.organizationId}`,
    branchPath,
    sanitizeStorageSegment(input.documentType),
    `${Date.now()}-${sanitizeStorageSegment(input.fileName)}`,
  ]
    .join('/')
    .replace(/\/+/g, '/');
}

async function writeVendorOSRecordAudit(
  operation: VendorOSOperation,
  action: 'created' | 'updated' | 'deleted',
  row: VendorOSRecordRow,
  metadata: Record<string, unknown> = {},
) {
  const actorUserId = await getCurrentAuditActorId();
  if (!actorUserId) return;

  const { error } = await supabase
    .from('vendor_audit_logs')
    .insert({
      organization_id: row.organization_id,
      branch_id: row.branch_id || null,
      actor_user_id: actorUserId,
      module: operation.module,
      action: `${operation.module}.${action}`,
      entity_type: operation.table,
      entity_id: row.id,
      severity: 'info',
      metadata: {
        table: operation.table,
        title_field: operation.titleField,
        ...metadata,
      },
    })
    .select()
    .single();

  if (error) throw toServiceError(error, 'VENDOR_OS_AUDIT_WRITE_FAILED');
}

export async function listVendorOrganizations(userId?: string) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('vendor_organizations')
    .select('*')
    .eq('is_active', true)
    .or(`owner_user_id.eq.${userId}`);

  if (error) throw toServiceError(error, 'VENDOR_OS_ORGANIZATIONS_READ_FAILED');
  return (data || []) as VendorOrganization[];
}

export async function createVendorOrganization(input: OrganizationInput) {
  const { data, error } = await supabase.from('vendor_organizations').insert(input).select().single<VendorOrganization>();

  if (error) throw toServiceError(error, 'VENDOR_OS_ORGANIZATION_WRITE_FAILED');
  return data;
}

export async function listVendorBranches(organizationId?: string) {
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('vendor_branches')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw toServiceError(error, 'VENDOR_OS_BRANCHES_READ_FAILED');
  return (data || []) as VendorBranch[];
}

export async function createVendorBranch(input: BranchInput) {
  const { data, error } = await supabase.from('vendor_branches').insert(input).select().single<VendorBranch>();

  if (error) throw toServiceError(error, 'VENDOR_OS_BRANCH_WRITE_FAILED');
  return data;
}

export async function updateVendorBranch(branchId: string, input: Partial<BranchInput>) {
  const { data, error } = await supabase
    .from('vendor_branches')
    .update(input)
    .eq('id', branchId)
    .select()
    .single<VendorBranch>();

  if (error) throw toServiceError(error, 'VENDOR_OS_BRANCH_UPDATE_FAILED');
  return data;
}

export async function listVendorTeamMembers(organizationId?: string) {
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('vendor_team_members')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw toServiceError(error, 'VENDOR_OS_TEAM_READ_FAILED');
  return (data || []) as VendorTeamMember[];
}

export async function upsertVendorTeamMember(input: TeamMemberInput) {
  const payload = await buildTeamMemberPayload(input);
  const { data, error } = await supabase.from('vendor_team_members').insert(payload).select().single<VendorTeamMember>();

  if (error) throw toServiceError(error, 'VENDOR_OS_TEAM_WRITE_FAILED');
  return data;
}

export async function listRolePermissions() {
  const { data, error } = await supabase.from('vendor_role_permissions').select('*');

  if (error) throw toServiceError(error, 'VENDOR_OS_PERMISSIONS_READ_FAILED');
  return (data || []) as VendorRolePermission[];
}

export async function listVendorNotifications(userId?: string) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('vendor_notifications')
    .select('*')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw toServiceError(error, 'VENDOR_OS_NOTIFICATIONS_READ_FAILED');
  return (data || []) as VendorNotification[];
}

export async function markVendorNotificationRead(notificationId: string) {
  const { data, error } = await supabase
    .from('vendor_notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single<VendorNotification>();

  if (error) throw toServiceError(error, 'VENDOR_OS_NOTIFICATION_UPDATE_FAILED');
  return data;
}

export function subscribeVendorNotifications(userId: string, onChange: () => void) {
  const channel = supabase.channel(`vendor-notifications:${userId}`);
  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendor_notifications',
        filter: `recipient_user_id=eq.${userId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createVendorAuditLog(input: AuditLogInput) {
  const { data, error } = await supabase.from('vendor_audit_logs').insert(input).select().single<VendorAuditLog>();

  if (error) throw toServiceError(error, 'VENDOR_OS_AUDIT_WRITE_FAILED');
  return data;
}

export async function listVendorAuditLogs(organizationId?: string) {
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('vendor_audit_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) throw toServiceError(error, 'VENDOR_OS_AUDIT_READ_FAILED');
  return (data || []) as VendorAuditLog[];
}

export async function listVendorDocuments(organizationId?: string) {
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('vendor_documents')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw toServiceError(error, 'VENDOR_OS_DOCUMENTS_READ_FAILED');
  return (data || []) as VendorDocument[];
}

export async function createVendorDocumentRecord(input: DocumentInput) {
  const uploadedBy = input.uploaded_by || (await getRequiredCurrentUserId());
  const { data, error } = await supabase
    .from('vendor_documents')
    .insert({ ...input, uploaded_by: uploadedBy })
    .select()
    .single<VendorDocument>();

  if (error) throw toServiceError(error, 'VENDOR_OS_DOCUMENT_WRITE_FAILED');
  return data;
}

export async function uploadVendorDocumentFile(input: UploadVendorDocumentInput) {
  const uploadedBy = await getRequiredCurrentUserId();
  const fileMetadata = getFileMetadata(input.file, input.fileName || input.name);
  const storagePath = buildVendorDocumentStoragePath({
    organizationId: input.organizationId,
    branchId: input.branchId,
    documentType: input.documentType,
    fileName: fileMetadata.fileName,
  });

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(VENDOR_DOCUMENTS_BUCKET)
    .upload(storagePath, input.file, {
      contentType: fileMetadata.mimeType || undefined,
      upsert: false,
    });

  if (uploadError) throw toServiceError(uploadError, 'VENDOR_OS_DOCUMENT_UPLOAD_FAILED');

  return createVendorDocumentRecord({
    organization_id: input.organizationId,
    branch_id: input.branchId || null,
    uploaded_by: uploadedBy,
    module: input.module,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    name: input.name,
    document_type: input.documentType,
    storage_path: uploadData?.path || storagePath,
    mime_type: fileMetadata.mimeType,
    file_size_bytes: fileMetadata.size,
    status: input.status || 'active',
    metadata: input.metadata || {},
  });
}

export type VendorOSRecordRow = Record<string, unknown> & {
  id: string;
  organization_id: string;
  branch_id?: string | null;
  created_at?: string;
};

export async function listVendorOSRecords(operation: VendorOSOperation, organizationId?: string) {
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from(operation.table)
    .select('*')
    .eq('organization_id', organizationId)
    .order(operation.dateField || 'created_at', { ascending: false })
    .limit(50);

  if (error) throw toServiceError(error, 'VENDOR_OS_RECORDS_READ_FAILED');
  return (data || []) as VendorOSRecordRow[];
}

export async function createVendorOSRecord(
  operation: VendorOSOperation,
  organizationId: string,
  branchId: string | null,
  input: Record<string, unknown>,
) {
  const documentDefaults: Record<string, unknown> =
    operation.module === 'documents'
      ? {
          module: 'documents',
          uploaded_by: await getRequiredCurrentUserId(),
        }
      : {};
  const teamDefaults = operation.module === 'team' ? await buildTeamMemberPayload(input) : {};
  const payload: Record<string, unknown> = {
    organization_id: organizationId,
    ...(operation.branchScoped === false ? {} : { branch_id: branchId }),
    ...documentDefaults,
    ...(operation.module === 'team' ? teamDefaults : input),
  };

  const { data, error } = await supabase.from(operation.table).insert(payload).select().single<VendorOSRecordRow>();

  if (error) throw toServiceError(error, 'VENDOR_OS_RECORD_WRITE_FAILED');
  await writeVendorOSRecordAudit(operation, 'created', data, { fields: Object.keys(input) });
  return data;
}

export async function updateVendorOSRecord(
  operation: VendorOSOperation,
  recordId: string,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from(operation.table)
    .update(input)
    .eq('id', recordId)
    .select()
    .single<VendorOSRecordRow>();

  if (error) throw toServiceError(error, 'VENDOR_OS_RECORD_UPDATE_FAILED');
  await writeVendorOSRecordAudit(operation, 'updated', data, { changed_fields: Object.keys(input) });
  return data;
}

export async function deleteVendorOSRecord(operation: VendorOSOperation, recordId: string) {
  const { data, error } = await supabase
    .from(operation.table)
    .delete()
    .eq('id', recordId)
    .select()
    .single<VendorOSRecordRow>();

  if (error) throw toServiceError(error, 'VENDOR_OS_RECORD_DELETE_FAILED');
  await writeVendorOSRecordAudit(operation, 'deleted', data);
  return { id: recordId };
}
