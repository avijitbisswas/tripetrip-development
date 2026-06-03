export type VendorBusinessCategory =
  | 'property_owner'
  | 'hotel'
  | 'resort'
  | 'homestay'
  | 'hostel'
  | 'travel_agent'
  | 'tour_operator'
  | 'dmc'
  | 'adventure_operator'
  | 'transport_provider';

export type VendorOSRole = 'owner' | 'admin' | 'manager' | 'operations' | 'sales' | 'accountant' | 'staff' | 'viewer';

export type VendorOSModule =
  | 'dashboard'
  | 'crm'
  | 'calendar'
  | 'inbox'
  | 'accounting'
  | 'team'
  | 'pms'
  | 'tours'
  | 'activities'
  | 'fleet'
  | 'ai_assistant'
  | 'marketplace'
  | 'subscriptions'
  | 'analytics'
  | 'branches'
  | 'documents'
  | 'settings';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'manage';

export type AuditEventSeverity = 'info' | 'warning' | 'critical';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type DocumentStatus = 'draft' | 'active' | 'expired' | 'archived';

export interface VendorOrganization {
  id: string;
  owner_user_id: string;
  primary_vendor_profile_id: string | null;
  name: string;
  legal_name: string | null;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  default_currency: string;
  timezone: string;
  categories: VendorBusinessCategory[];
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface VendorBranch {
  id: string;
  organization_id: string;
  name: string;
  branch_code: string | null;
  categories: VendorBusinessCategory[];
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  manager_user_id: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface VendorTeamMember {
  id: string;
  organization_id: string;
  branch_id: string | null;
  user_id: string | null;
  role: VendorOSRole;
  title: string | null;
  invited_email: string | null;
  invited_by: string | null;
  accepted_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VendorRolePermission {
  id?: string;
  role: VendorOSRole;
  module: VendorOSModule;
  actions: PermissionAction[];
}

export interface VendorAuditLog {
  id: string;
  organization_id: string;
  branch_id: string | null;
  actor_user_id: string | null;
  module: VendorOSModule;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  severity: AuditEventSeverity;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface VendorNotification {
  id: string;
  organization_id: string;
  branch_id: string | null;
  recipient_user_id: string;
  module: VendorOSModule;
  title: string;
  body: string | null;
  status: NotificationStatus;
  priority: AuditEventSeverity;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

export interface VendorDocument {
  id: string;
  organization_id: string;
  branch_id: string | null;
  uploaded_by: string | null;
  module: VendorOSModule;
  entity_type: string | null;
  entity_id: string | null;
  name: string;
  document_type: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  status: DocumentStatus;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface VendorOSModuleDefinition {
  id: VendorOSModule;
  label: string;
  description: string;
  path: string;
  category: 'core' | 'operations' | 'commerce' | 'admin';
}

export interface VendorOSContext {
  organizations: VendorOrganization[];
  selectedOrganization: VendorOrganization | null;
  branches: VendorBranch[];
  activeBranch: VendorBranch | null;
  role: VendorOSRole;
  can: (module: VendorOSModule, action?: PermissionAction) => boolean;
}
