import { supabase } from '@/src/lib/supabase';
import { ServiceError } from '@/src/services/errors';
import { getVendorOSOperation, type VendorOSOperation } from './operations';
import type {
  VendorAuditLog,
  VendorBranch,
  DocumentStatus,
  VendorDocument,
  VendorAccountingResource,
  VendorPaymentRecord,
  VendorFolioEntryRecord,
  VendorNotification,
  VendorOrganization,
  VendorOSModule,
  VendorPmsReservationRecord,
  VendorPmsResource,
  VendorRolePermission,
  VendorRoomRecord,
  VendorRoomTypeRecord,
  VendorTeamMember,
  VendorTeamMemberStatus,
  VendorHousekeepingTaskRecord,
} from './types';

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

async function getCurrentAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new ServiceError('Log in before updating Vendor OS records', 'VENDOR_OS_AUTH_REQUIRED', 401);
  }

  return data.session.access_token;
}

async function authorizeVendorOSMutation(input: {
  module: VendorOSModule;
  action: 'create' | 'update' | 'delete' | 'upload';
  organizationId: string;
}) {
  const token = await getCurrentAccessToken();
  const response = await fetch('/api/vendor-os/mutations/authorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as { allowed?: boolean; error?: string };

  if (!response.ok) {
    throw new ServiceError(
      payload.error || 'This module is not enabled for this vendor account.',
      'VENDOR_OS_MUTATION_NOT_ALLOWED',
      response.status,
    );
  }

  if (!payload.allowed) {
    throw new ServiceError('This module is not enabled for this vendor account.', 'VENDOR_OS_MUTATION_NOT_ALLOWED', 403);
  }
}

async function vendorOSMutationFetch<T>(path: string, init: RequestInit = {}) {
  const token = await getCurrentAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new ServiceError(payload.error || 'Unable to update Vendor OS records', 'VENDOR_OS_RECORD_WRITE_FAILED', response.status);
  }

  return payload;
}

async function vendorOSAuthorizedFetch<T>(path: string, init: RequestInit = {}) {
  const token = await getCurrentAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new ServiceError(payload.error || 'Unable to load Vendor OS records', 'VENDOR_OS_RECORDS_READ_FAILED', response.status);
  }

  return payload;
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

function buildMarketplaceChannelDistribution(input: {
  channelTargets: string[];
  syncStatus?: unknown;
  listingState?: unknown;
  approvalStatus?: unknown;
}) {
  const syncStatus = String(input.syncStatus || 'pending');
  const listingState = String(input.listingState || 'draft');
  const approvalStatus = String(input.approvalStatus || 'open');

  return Object.fromEntries(
    input.channelTargets.map((channel) => {
      const isRequestChannel = channel.endsWith('_request');
      let status = 'draft';

      if (approvalStatus === 'pending' || syncStatus === 'pending_approval') {
        status = 'pending_approval';
      } else if (approvalStatus === 'rejected' || syncStatus === 'rejected') {
        status = 'rejected';
      } else if (listingState === 'paused') {
        status = 'paused';
      } else if (isRequestChannel && listingState === 'live' && syncStatus === 'synced') {
        status = 'request_only';
      } else if (listingState === 'live' && syncStatus === 'synced') {
        status = 'live';
      } else if (syncStatus === 'failed') {
        status = 'attention';
      } else if (listingState === 'draft') {
        status = 'draft';
      } else {
        status = syncStatus;
      }

      return [
        channel,
        {
          status,
          mode: isRequestChannel ? 'request' : 'direct',
        },
      ];
    }),
  );
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

function buildMarketplaceSyncPayload(input: Record<string, unknown>) {
  const baseMetadata = input.metadata && typeof input.metadata === 'object' ? (input.metadata as Record<string, unknown>) : {};
  const recordType = String(input.record_type || baseMetadata.record_type || 'listing_sync');
  const channelTargets = Array.isArray(input.channel_targets)
    ? input.channel_targets.map((value) => String(value)).filter(Boolean)
    : [];

  if (recordType === 'channel_connection') {
    return {
      module: input.module || 'pms',
      sync_status: String(input.sync_status || input.connection_status || 'draft'),
      conversion_rate: null,
      ...(input.last_synced_at ? { last_synced_at: String(input.last_synced_at) } : {}),
      metadata: {
        ...baseMetadata,
        record_type: 'channel_connection',
        provider_name: input.provider_name || null,
        connection_status: input.connection_status || 'draft',
        credential_label: input.credential_label || null,
        enabled: input.enabled ?? true,
        last_verified_at: input.last_verified_at || null,
        notes: input.notes || null,
        property_scope: input.property_scope || 'organization',
        source: 'marketplace_workspace',
      },
    };
  }

  if (recordType === 'channel_sync_log') {
    const logStatus = String(input.status || input.sync_status || 'queued');
    return {
      module: input.module || 'pms',
      sync_status: logStatus,
      conversion_rate: null,
      ...(logStatus === 'sent' || logStatus === 'applied' ? { last_synced_at: new Date().toISOString() } : {}),
      metadata: {
        ...baseMetadata,
        record_type: 'channel_sync_log',
        connection_id: input.connection_id || null,
        provider_name: input.provider_name || null,
        sync_type: input.sync_type || 'inventory',
        direction: input.direction || 'outbound',
        status: logStatus,
        payload_summary: input.payload_summary || null,
        error_summary: input.error_summary || null,
        override_note: input.override_note || null,
        source: 'marketplace_workspace',
      },
    };
  }

  const approvalStatus = input.approval_status || 'open';
  const listingState = input.listing_state || null;
  const requestedListingState = input.requested_listing_state || input.listing_state || null;
  const requestedSyncStatus = input.requested_sync_status || input.sync_status || null;
  const metadata = {
    ...baseMetadata,
    record_type: 'listing_sync',
    listing_title: input.listing_title || null,
    public_slug: input.public_slug || null,
    property_id: input.property_id || null,
    room_type_id: input.room_type_id || null,
    room_type_name: input.room_type_name || null,
    direct_deal_enabled: Boolean(input.direct_deal_enabled),
    deal_badge: input.deal_badge || null,
    nightly_rate: input.nightly_rate ?? null,
    total_inventory: input.total_inventory ?? null,
    available_inventory: input.available_inventory ?? null,
    occupied_inventory: input.occupied_inventory ?? null,
    occupancy_rate: input.occupancy_rate ?? null,
    listing_state: listingState,
    requested_listing_state: requestedListingState,
    requested_sync_status: requestedSyncStatus,
    approval_status: approvalStatus,
    approval_note: input.approval_note || null,
    approved_at: input.approved_at || null,
    approved_by: input.approved_by || null,
    channel_targets: channelTargets,
    channel_distribution: buildMarketplaceChannelDistribution({
      channelTargets,
      syncStatus: input.sync_status,
      listingState,
      approvalStatus,
    }),
    source: 'marketplace_workspace',
  };

  return {
    module: input.module,
    sync_status: input.sync_status || 'pending',
    conversion_rate: input.conversion_rate ?? null,
    ...(input.listing_id ? { listing_id: input.listing_id } : {}),
    ...(input.sync_status === 'synced' ? { last_synced_at: new Date().toISOString() } : {}),
    metadata,
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

export function subscribeVendorOSRecords(operation: VendorOSOperation, organizationId: string, onChange: () => void) {
  const channel = supabase.channel(`vendor-os-records:${operation.table}:${organizationId}`);
  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: operation.table,
        filter: `organization_id=eq.${organizationId}`,
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
  await authorizeVendorOSMutation({
    module: input.module,
    action: 'upload',
    organizationId: input.organizationId,
  });
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

  return createVendorOSRecord(getVendorOSOperation('documents'), input.organizationId, input.branchId || null, {
    module: input.module,
    uploaded_by: uploadedBy,
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

export async function createVendorDocumentSignedUrl(storagePath: string, expiresInSeconds = 300) {
  const { data, error } = await supabase.storage
    .from(VENDOR_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) throw toServiceError(error, 'VENDOR_OS_DOCUMENT_SIGNED_URL_FAILED');
  return data.signedUrl;
}

export type VendorOSRecordRow = Record<string, unknown> & {
  id: string;
  organization_id: string;
  branch_id?: string | null;
  created_at?: string;
};

export type VendorPmsRecordMap = {
  room_types: VendorRoomTypeRecord;
  rooms: VendorRoomRecord;
  reservations: VendorPmsReservationRecord;
  housekeeping: VendorHousekeepingTaskRecord;
  folios: VendorFolioEntryRecord;
};

export type VendorAccountingRecordMap = {
  payments: VendorPaymentRecord;
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
  const marketplacePayload = operation.module === 'marketplace' ? buildMarketplaceSyncPayload(input) : null;
  const payload: Record<string, unknown> = {
    ...documentDefaults,
    ...(operation.module === 'team' ? teamDefaults : marketplacePayload || input),
  };
  const response = await vendorOSMutationFetch<{ record: VendorOSRecordRow }>('/api/vendor-os/records', {
    method: 'POST',
    body: JSON.stringify({
      module: operation.module,
      organizationId,
      branchId: operation.branchScoped === false ? null : branchId,
      payload,
    }),
  });
  return response.record;
}

export async function updateVendorOSRecord(
  operation: VendorOSOperation,
  organizationId: string,
  recordId: string,
  input: Record<string, unknown>,
) {
  const response = await vendorOSMutationFetch<{ record: VendorOSRecordRow }>('/api/vendor-os/records', {
    method: 'PATCH',
    body: JSON.stringify({
      module: operation.module,
      organizationId,
      recordId,
      input,
    }),
  });
  return response.record;
}

export async function deleteVendorOSRecord(operation: VendorOSOperation, organizationId: string, recordId: string) {
  await vendorOSMutationFetch<{ id: string }>('/api/vendor-os/records', {
    method: 'DELETE',
    body: JSON.stringify({
      module: operation.module,
      organizationId,
      recordId,
    }),
  });
  return { id: recordId };
}

export async function listVendorPmsRecords<TResource extends VendorPmsResource>(resource: TResource, organizationId?: string) {
  if (!organizationId) return [] as VendorPmsRecordMap[TResource][];

  const response = await vendorOSAuthorizedFetch<{ records: VendorPmsRecordMap[TResource][] }>(
    `/api/vendor-os/pms?resource=${resource}&organizationId=${organizationId}`,
  );
  return response.records || [];
}

export async function createVendorPmsRecord<TResource extends VendorPmsResource>(
  resource: TResource,
  organizationId: string,
  branchId: string | null,
  payload: Record<string, unknown>,
) {
  const response = await vendorOSMutationFetch<{ record: VendorPmsRecordMap[TResource] }>('/api/vendor-os/pms', {
    method: 'POST',
    body: JSON.stringify({
      resource,
      organizationId,
      branchId,
      payload,
    }),
  });
  return response.record;
}

export async function updateVendorPmsRecord<TResource extends VendorPmsResource>(
  resource: TResource,
  organizationId: string,
  recordId: string,
  input: Record<string, unknown>,
) {
  const response = await vendorOSMutationFetch<{ record: VendorPmsRecordMap[TResource] }>('/api/vendor-os/pms', {
    method: 'PATCH',
    body: JSON.stringify({
      resource,
      organizationId,
      recordId,
      input,
    }),
  });
  return response.record;
}

export async function listVendorAccountingRecords<TResource extends VendorAccountingResource>(resource: TResource, organizationId?: string) {
  if (!organizationId) return [] as VendorAccountingRecordMap[TResource][];

  const response = await vendorOSAuthorizedFetch<{ records: VendorAccountingRecordMap[TResource][] }>(
    `/api/vendor-os/accounting?resource=${resource}&organizationId=${organizationId}`,
  );
  return response.records || [];
}

export async function createVendorAccountingRecord<TResource extends VendorAccountingResource>(
  resource: TResource,
  organizationId: string,
  branchId: string | null,
  payload: Record<string, unknown>,
) {
  const response = await vendorOSMutationFetch<{ record: VendorAccountingRecordMap[TResource] }>('/api/vendor-os/accounting', {
    method: 'POST',
    body: JSON.stringify({
      resource,
      organizationId,
      branchId,
      payload,
    }),
  });
  return response.record;
}
