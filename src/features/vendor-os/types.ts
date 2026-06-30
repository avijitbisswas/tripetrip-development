import type { ResolvedVendorAccommodationAccess } from './accommodationAccess';

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
export type VendorTeamMemberStatus = 'invited' | 'active' | 'suspended';

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
  display_name: string | null;
  invited_email: string | null;
  invited_by: string | null;
  accepted_at: string | null;
  status: VendorTeamMemberStatus;
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
  vendorProfileId?: string | null;
  vendorBusinessType?: string | null;
  accommodationAccess: ResolvedVendorAccommodationAccess | null;
  role: VendorOSRole;
  can: (module: VendorOSModule, action?: PermissionAction) => boolean;
}

export type VendorPmsResource = 'room_types' | 'rooms' | 'reservations' | 'housekeeping' | 'folios';

export interface VendorRoomTypeRecord {
  id: string;
  organization_id: string;
  property_id: string;
  name: string;
  occupancy: number;
  base_rate: number;
  amenities: string[];
  created_at: string;
}

export interface VendorRoomRecord {
  id: string;
  organization_id: string;
  property_id: string;
  room_type_id: string | null;
  room_number: string;
  floor: string | null;
  status: string;
  housekeeping_status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface VendorPmsReservationRecord {
  id: string;
  organization_id: string;
  branch_id: string | null;
  property_id: string;
  room_id: string | null;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  status: string;
  payment_status: string;
  total_amount: number;
  source: string;
  notes: string | null;
  created_at: string;
}

export interface VendorHousekeepingTaskRecord {
  id: string;
  organization_id: string;
  property_id: string;
  room_id: string | null;
  title: string;
  status: string;
  assigned_to: string | null;
  due_at: string | null;
  created_at: string;
}

export interface VendorFolioEntryRecord {
  id: string;
  organization_id: string;
  branch_id: string | null;
  property_id: string;
  reservation_id: string | null;
  entry_type: string;
  title: string;
  amount: number;
  quantity: number;
  payment_state: string;
  notes: string | null;
  posted_at: string;
  created_at: string;
}

export type VendorAccountingResource = 'payments';

export interface VendorPaymentRecord {
  id: string;
  organization_id: string;
  branch_id: string | null;
  reservation_id: string | null;
  folio_entry_id: string | null;
  manual_payment_intent_id: string | null;
  payment_method: string;
  amount: number;
  status: string;
  reference_number: string | null;
  collected_at: string;
  collected_by: string | null;
  notes: string | null;
  created_at: string;
}
