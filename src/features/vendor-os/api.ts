import { supabase } from '@/src/lib/supabase';
import { ServiceError } from '@/src/services/errors';
import type {
  VendorAuditLog,
  VendorBranch,
  VendorDocument,
  VendorNotification,
  VendorOrganization,
  VendorRolePermission,
  VendorTeamMember,
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
  Partial<Pick<VendorTeamMember, 'branch_id' | 'user_id' | 'title' | 'invited_email' | 'invited_by' | 'accepted_at'>>;

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

function toServiceError(error: { message: string }, code: string) {
  return new ServiceError(error.message, code, 500);
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
  const { data, error } = await supabase.from('vendor_team_members').insert(input).select().single<VendorTeamMember>();

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
  const { data, error } = await supabase.from('vendor_documents').insert(input).select().single<VendorDocument>();

  if (error) throw toServiceError(error, 'VENDOR_OS_DOCUMENT_WRITE_FAILED');
  return data;
}
