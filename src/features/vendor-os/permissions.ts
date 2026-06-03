import type { PermissionAction, VendorOSModule, VendorOSRole } from './types';

export const VENDOR_OS_MODULES: VendorOSModule[] = [
  'dashboard',
  'crm',
  'calendar',
  'inbox',
  'accounting',
  'team',
  'pms',
  'tours',
  'activities',
  'fleet',
  'ai_assistant',
  'marketplace',
  'subscriptions',
  'analytics',
  'branches',
  'documents',
  'settings',
];

const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'approve', 'export', 'manage'];
const VIEW_ONLY: PermissionAction[] = ['view'];
const OPERATE: PermissionAction[] = ['view', 'create', 'update'];
const MANAGE: PermissionAction[] = ['view', 'create', 'update', 'delete', 'approve', 'export', 'manage'];

export type VendorPermissionMatrix = Record<VendorOSRole, Partial<Record<VendorOSModule, PermissionAction[]>>>;

export const defaultVendorPermissionMatrix: VendorPermissionMatrix = {
  owner: Object.fromEntries(VENDOR_OS_MODULES.map((module) => [module, ALL_ACTIONS])) as Record<
    VendorOSModule,
    PermissionAction[]
  >,
  admin: Object.fromEntries(VENDOR_OS_MODULES.map((module) => [module, MANAGE])) as Record<
    VendorOSModule,
    PermissionAction[]
  >,
  manager: {
    dashboard: VIEW_ONLY,
    crm: MANAGE,
    calendar: MANAGE,
    inbox: MANAGE,
    team: OPERATE,
    pms: MANAGE,
    tours: MANAGE,
    activities: MANAGE,
    fleet: MANAGE,
    ai_assistant: OPERATE,
    marketplace: MANAGE,
    analytics: ['view', 'export'],
    branches: OPERATE,
    documents: MANAGE,
    settings: VIEW_ONLY,
  },
  operations: {
    dashboard: VIEW_ONLY,
    calendar: OPERATE,
    inbox: OPERATE,
    pms: OPERATE,
    tours: OPERATE,
    activities: OPERATE,
    fleet: OPERATE,
    ai_assistant: VIEW_ONLY,
    branches: VIEW_ONLY,
    documents: OPERATE,
  },
  sales: {
    dashboard: VIEW_ONLY,
    crm: OPERATE,
    calendar: VIEW_ONLY,
    inbox: OPERATE,
    marketplace: OPERATE,
    analytics: VIEW_ONLY,
    documents: VIEW_ONLY,
  },
  accountant: {
    dashboard: VIEW_ONLY,
    accounting: MANAGE,
    analytics: ['view', 'export'],
    documents: ['view', 'create', 'update', 'export'],
    subscriptions: VIEW_ONLY,
  },
  staff: {
    dashboard: VIEW_ONLY,
    calendar: OPERATE,
    inbox: OPERATE,
    pms: OPERATE,
    tours: OPERATE,
    activities: OPERATE,
    fleet: OPERATE,
    documents: VIEW_ONLY,
  },
  viewer: Object.fromEntries(VENDOR_OS_MODULES.map((module) => [module, VIEW_ONLY])) as Record<
    VendorOSModule,
    PermissionAction[]
  >,
};

export function canAccessVendorModule(
  role: VendorOSRole,
  module: VendorOSModule,
  action: PermissionAction = 'view',
  matrix: VendorPermissionMatrix = defaultVendorPermissionMatrix,
) {
  return Boolean(matrix[role]?.[module]?.includes(action));
}

export function getAllowedVendorModules(
  role: VendorOSRole,
  action: PermissionAction = 'view',
  matrix: VendorPermissionMatrix = defaultVendorPermissionMatrix,
) {
  return VENDOR_OS_MODULES.filter((module) => canAccessVendorModule(role, module, action, matrix));
}
