import type { VendorOSModule } from './types';

export type VendorOSFieldType = 'text' | 'number' | 'date' | 'datetime' | 'select';

export interface VendorOSCreateField {
  name: string;
  label: string;
  type: VendorOSFieldType;
  required?: boolean;
  options?: string[];
}

export interface VendorOSOperation {
  module: VendorOSModule;
  table: string;
  titleField: string;
  statusField: string;
  valueField?: string;
  dateField?: string;
  branchScoped?: boolean;
  createFields: VendorOSCreateField[];
}

export const vendorOSOperations: Record<VendorOSModule, VendorOSOperation> = {
  dashboard: {
    module: 'dashboard',
    table: 'vendor_tasks',
    titleField: 'title',
    statusField: 'status',
    dateField: 'due_at',
    createFields: [
      { name: 'title', label: 'Task title', type: 'text', required: true },
      { name: 'module', label: 'Module', type: 'select', required: true, options: ['dashboard', 'calendar', 'pms', 'marketplace'] },
    ],
  },
  crm: {
    module: 'crm',
    table: 'vendor_leads',
    titleField: 'title',
    statusField: 'stage',
    valueField: 'estimated_value',
    dateField: 'travel_start',
    createFields: [
      { name: 'title', label: 'Lead title', type: 'text', required: true },
      { name: 'stage', label: 'Stage', type: 'select', options: ['new', 'qualified', 'quote_sent', 'won', 'lost'] },
      { name: 'estimated_value', label: 'Estimated value', type: 'number' },
    ],
  },
  calendar: {
    module: 'calendar',
    table: 'vendor_calendar_events',
    titleField: 'title',
    statusField: 'status',
    valueField: 'capacity',
    dateField: 'starts_at',
    createFields: [
      { name: 'title', label: 'Event title', type: 'text', required: true },
      { name: 'event_type', label: 'Event type', type: 'select', options: ['booking', 'blackout', 'departure', 'maintenance'] },
      { name: 'starts_at', label: 'Starts at', type: 'datetime', required: true },
    ],
  },
  inbox: {
    module: 'inbox',
    table: 'vendor_conversations',
    titleField: 'subject',
    statusField: 'status',
    dateField: 'last_message_at',
    createFields: [
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      { name: 'channel', label: 'Channel', type: 'select', options: ['tripetrip', 'email', 'phone', 'whatsapp'] },
      { name: 'status', label: 'Status', type: 'select', options: ['open', 'assigned', 'closed'] },
    ],
  },
  accounting: {
    module: 'accounting',
    table: 'vendor_invoices',
    titleField: 'invoice_number',
    statusField: 'status',
    valueField: 'total_amount',
    dateField: 'due_at',
    createFields: [
      { name: 'invoice_number', label: 'Invoice number', type: 'text', required: true },
      { name: 'total_amount', label: 'Total amount', type: 'number', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'paid', 'overdue'] },
    ],
  },
  team: {
    module: 'team',
    table: 'vendor_team_members',
    titleField: 'title',
    statusField: 'role',
    dateField: 'created_at',
    createFields: [
      { name: 'invited_email', label: 'Email', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'select', required: true, options: ['admin', 'manager', 'operations', 'sales', 'accountant', 'staff', 'viewer'] },
    ],
  },
  pms: {
    module: 'pms',
    table: 'vendor_properties',
    titleField: 'name',
    statusField: 'property_type',
    dateField: 'created_at',
    createFields: [
      { name: 'name', label: 'Property name', type: 'text', required: true },
      { name: 'property_type', label: 'Property type', type: 'select', required: true, options: ['hotel', 'resort', 'homestay', 'hostel', 'villa'] },
      { name: 'address', label: 'Address', type: 'text' },
    ],
  },
  tours: {
    module: 'tours',
    table: 'vendor_tour_itineraries',
    titleField: 'title',
    statusField: 'is_active',
    valueField: 'base_price',
    dateField: 'created_at',
    createFields: [
      { name: 'title', label: 'Itinerary title', type: 'text', required: true },
      { name: 'duration_days', label: 'Duration days', type: 'number', required: true },
      { name: 'base_price', label: 'Base price', type: 'number' },
    ],
  },
  activities: {
    module: 'activities',
    table: 'vendor_activity_slots',
    titleField: 'title',
    statusField: 'status',
    valueField: 'capacity',
    dateField: 'starts_at',
    createFields: [
      { name: 'title', label: 'Activity slot', type: 'text', required: true },
      { name: 'starts_at', label: 'Starts at', type: 'datetime', required: true },
      { name: 'capacity', label: 'Capacity', type: 'number', required: true },
    ],
  },
  fleet: {
    module: 'fleet',
    table: 'vendor_vehicles',
    titleField: 'name',
    statusField: 'status',
    valueField: 'seats',
    dateField: 'created_at',
    createFields: [
      { name: 'name', label: 'Vehicle name', type: 'text', required: true },
      { name: 'vehicle_type', label: 'Vehicle type', type: 'select', required: true, options: ['suv', 'sedan', 'tempo', 'bike', 'bus'] },
      { name: 'registration_number', label: 'Registration number', type: 'text' },
    ],
  },
  ai_assistant: {
    module: 'ai_assistant',
    table: 'vendor_ai_insights',
    titleField: 'title',
    statusField: 'status',
    valueField: 'confidence',
    dateField: 'created_at',
    createFields: [
      { name: 'title', label: 'Insight title', type: 'text', required: true },
      { name: 'recommendation', label: 'Recommendation', type: 'text', required: true },
      { name: 'confidence', label: 'Confidence', type: 'number' },
    ],
  },
  marketplace: {
    module: 'marketplace',
    table: 'vendor_marketplace_syncs',
    titleField: 'module',
    statusField: 'sync_status',
    valueField: 'conversion_rate',
    dateField: 'last_synced_at',
    createFields: [
      { name: 'module', label: 'Source module', type: 'select', required: true, options: ['pms', 'tours', 'activities', 'fleet'] },
      { name: 'sync_status', label: 'Sync status', type: 'select', options: ['pending', 'synced', 'failed'] },
    ],
  },
  subscriptions: {
    module: 'subscriptions',
    table: 'vendor_subscription_accounts',
    titleField: 'plan_code',
    statusField: 'status',
    dateField: 'current_period_end',
    branchScoped: false,
    createFields: [
      { name: 'plan_code', label: 'Plan code', type: 'select', required: true, options: ['starter', 'growth', 'scale', 'enterprise'] },
      { name: 'billing_cycle', label: 'Billing cycle', type: 'select', options: ['monthly', 'annual'] },
    ],
  },
  analytics: {
    module: 'analytics',
    table: 'vendor_analytics_snapshots',
    titleField: 'module',
    statusField: 'snapshot_date',
    dateField: 'snapshot_date',
    createFields: [
      { name: 'module', label: 'Module', type: 'select', required: true, options: ['crm', 'pms', 'tours', 'activities', 'fleet', 'marketplace'] },
      { name: 'snapshot_date', label: 'Snapshot date', type: 'date', required: true },
    ],
  },
  branches: {
    module: 'branches',
    table: 'vendor_branches',
    titleField: 'name',
    statusField: 'is_active',
    dateField: 'created_at',
    branchScoped: false,
    createFields: [
      { name: 'name', label: 'Branch name', type: 'text', required: true },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
    ],
  },
  documents: {
    module: 'documents',
    table: 'vendor_documents',
    titleField: 'name',
    statusField: 'status',
    dateField: 'expires_at',
    createFields: [
      { name: 'name', label: 'Document name', type: 'text', required: true },
      { name: 'document_type', label: 'Document type', type: 'text', required: true },
      { name: 'storage_path', label: 'Storage path', type: 'text', required: true },
    ],
  },
  settings: {
    module: 'settings',
    table: 'vendor_os_module_settings',
    titleField: 'module',
    statusField: 'is_enabled',
    dateField: 'updated_at',
    createFields: [
      { name: 'module', label: 'Module', type: 'select', required: true, options: ['crm', 'pms', 'fleet', 'marketplace'] },
      { name: 'is_enabled', label: 'Enabled', type: 'select', options: ['true', 'false'] },
    ],
  },
};

export function getVendorOSOperation(module: VendorOSModule) {
  return vendorOSOperations[module];
}
