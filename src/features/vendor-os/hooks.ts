import { useCallback, useEffect, useMemo, useState } from 'react';
import { getVendorByUserId } from '@/src/services/vendors';
import {
  createVendorDocumentSignedUrl,
  createVendorOSRecord,
  deleteVendorOSRecord,
  listVendorAuditLogs,
  listVendorBranches,
  listVendorDocuments,
  listVendorNotifications,
  listVendorOSRecords,
  listVendorOrganizations,
  listVendorTeamMembers,
  markVendorNotificationRead,
  subscribeVendorOSRecords,
  subscribeVendorNotifications,
  updateVendorOSRecord,
  uploadVendorDocumentFile,
  type VendorOSRecordRow,
} from './api';
import type { ResolvedVendorAccommodationAccess } from './accommodationAccess';
import { buildDefaultVendorAccommodationAccess, resolveVendorAccommodationAccess } from './accommodationAccess';
import { getVendorAccommodationAccess as getVendorAccommodationAccessForOrg } from './accessService';
import { getVendorMutationAccessError } from './mutationAccess';
import { getVendorOSOperation } from './operations';
import { canAccessVendorModule } from './permissions';
import type {
  PermissionAction,
  VendorAuditLog,
  VendorBranch,
  VendorDocument,
  VendorNotification,
  VendorOrganization,
  VendorOSModule,
  VendorOSRole,
  VendorTeamMember,
  DocumentStatus,
} from './types';

const DEFAULT_ROLE: VendorOSRole = 'owner';

function useMutationAccommodationAccess(
  organizationId?: string | null,
  accessOverride?: ResolvedVendorAccommodationAccess | null,
) {
  const [access, setAccess] = useState<ResolvedVendorAccommodationAccess | null | undefined>(() =>
    organizationId && accessOverride === undefined ? undefined : accessOverride ?? null,
  );

  useEffect(() => {
    if (accessOverride !== undefined) {
      setAccess(accessOverride ?? null);
      return;
    }

    if (!organizationId) {
      setAccess(null);
      return;
    }

    let mounted = true;
    setAccess(undefined);

    getVendorAccommodationAccessForOrg(organizationId)
      .then((resolved) => {
        if (mounted) setAccess(resolved);
      })
      .catch(() => {
        if (mounted) setAccess(null);
      });

    return () => {
      mounted = false;
    };
  }, [accessOverride, organizationId]);

  return access;
}

export function useVendorOSTenant(userId?: string | null) {
  const [organizations, setOrganizations] = useState<VendorOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<VendorOrganization | null>(null);
  const [branches, setBranches] = useState<VendorBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<VendorBranch | null>(null);
  const [teamMembers, setTeamMembers] = useState<VendorTeamMember[]>([]);
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);
  const [vendorBusinessType, setVendorBusinessType] = useState<string | null>(null);
  const [accommodationAccess, setAccommodationAccess] = useState<ReturnType<typeof resolveVendorAccommodationAccess> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTenant() {
      setLoading(true);
      setError(null);

      try {
        const orgs = await listVendorOrganizations(userId || undefined);
        const selected = orgs[0] || null;
        const [branchList, memberList, vendorProfile] = await Promise.all([
          listVendorBranches(selected?.id),
          listVendorTeamMembers(selected?.id),
          userId ? getVendorByUserId(userId) : Promise.resolve(null),
        ]);
        const access =
          (await getVendorAccommodationAccessForOrg(selected?.id || undefined).catch(() => null)) ||
          (vendorProfile
            ? resolveVendorAccommodationAccess(
                buildDefaultVendorAccommodationAccess({
                  vendorProfileId: vendorProfile.id,
                  businessType: vendorProfile.business_type,
                }),
              )
            : null);

        if (!mounted) return;
        setOrganizations(orgs);
        setSelectedOrganization(selected);
        setBranches(branchList);
        setActiveBranch(branchList[0] || null);
        setTeamMembers(memberList);
        setVendorProfileId(vendorProfile?.id || null);
        setVendorBusinessType(vendorProfile?.business_type || null);
        setAccommodationAccess(access);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load Vendor OS context');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTenant();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const role = useMemo<VendorOSRole>(() => {
    if (!userId || !selectedOrganization) return DEFAULT_ROLE;
    if (selectedOrganization.owner_user_id === userId) return 'owner';
    return teamMembers.find((member) => member.user_id === userId)?.role || 'viewer';
  }, [selectedOrganization, teamMembers, userId]);

  const can = useCallback(
    (module: VendorOSModule, action: PermissionAction = 'view') =>
      Boolean(accommodationAccess?.moduleVisibility[module] ?? true) && canAccessVendorModule(role, module, action),
    [accommodationAccess, role],
  );

  return {
    organizations,
    selectedOrganization,
    setSelectedOrganization,
    branches,
    activeBranch,
    vendorProfileId,
    vendorBusinessType,
    accommodationAccess,
    setActiveBranch,
    teamMembers,
    role,
    can,
    loading,
    error,
  };
}

export function useVendorOSNotifications(userId?: string | null) {
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listVendorNotifications(userId || undefined);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let mounted = true;

    async function loadWhenMounted() {
      setLoading(true);
      setError(null);
      try {
        const data = await listVendorNotifications(userId || undefined);
        if (mounted) setNotifications(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load notifications');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadWhenMounted();

    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    return subscribeVendorNotifications(userId, () => {
      loadNotifications();
    });
  }, [loadNotifications, userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await markVendorNotificationRead(notificationId);
      await loadNotifications();
    },
    [loadNotifications],
  );

  return {
    notifications,
    unreadCount: notifications.filter((notification) => notification.status === 'unread').length,
    loading,
    error,
    markAsRead,
    refresh: loadNotifications,
  };
}

export function useVendorOSAuditLogs(organizationId?: string | null) {
  const [auditLogs, setAuditLogs] = useState<VendorAuditLog[]>([]);

  useEffect(() => {
    let mounted = true;
    listVendorAuditLogs(organizationId || undefined).then((logs) => {
      if (mounted) setAuditLogs(logs);
    });

    return () => {
      mounted = false;
    };
  }, [organizationId]);

  return auditLogs;
}

export function useVendorOSDocuments(organizationId?: string | null) {
  const [documents, setDocuments] = useState<VendorDocument[]>([]);

  useEffect(() => {
    let mounted = true;
    listVendorDocuments(organizationId || undefined).then((records) => {
      if (mounted) setDocuments(records);
    });

    return () => {
      mounted = false;
    };
  }, [organizationId]);

  return documents;
}

export function useVendorOSRecords(module: VendorOSModule, organizationId?: string | null) {
  const [records, setRecords] = useState<VendorOSRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const operation = useMemo(() => getVendorOSOperation(module), [module]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listVendorOSRecords(operation, organizationId || undefined);
      setRecords(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load module records');
    } finally {
      setLoading(false);
    }
  }, [operation, organizationId]);

  useEffect(() => {
    let mounted = true;

    async function loadWhenMounted() {
      setLoading(true);
      setError(null);
      try {
        const rows = await listVendorOSRecords(operation, organizationId || undefined);
        if (mounted) setRecords(rows);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load module records');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadWhenMounted();

    return () => {
      mounted = false;
    };
  }, [operation, organizationId]);

  useEffect(() => {
    if (!organizationId) return undefined;
    return subscribeVendorOSRecords(operation, organizationId, () => {
      loadRecords();
    });
  }, [loadRecords, operation, organizationId]);

  return {
    records,
    loading,
    error,
    refresh: loadRecords,
  };
}

export function useVendorOSRecordMutations(
  module: VendorOSModule,
  organizationId?: string | null,
  branchId?: string | null,
  accessOverride?: ResolvedVendorAccommodationAccess | null,
) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operation = useMemo(() => getVendorOSOperation(module), [module]);
  const accommodationAccess = useMutationAccommodationAccess(organizationId, accessOverride);

  const createRecord = useCallback(
    async (input: Record<string, unknown>) => {
      if (!organizationId) throw new Error('Select an organization before creating records');
      if (accommodationAccess === undefined) {
        const message = 'Checking module access. Please try again.';
        setError(message);
        throw new Error(message);
      }
      const accessError = getVendorMutationAccessError(module, accommodationAccess);
      if (accessError) {
        setError(accessError);
        throw new Error(accessError);
      }
      setSubmitting(true);
      setError(null);
      try {
        return await createVendorOSRecord(operation, organizationId, branchId || null, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to create module record';
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [accommodationAccess, branchId, module, operation, organizationId],
  );

  const updateRecord = useCallback(
    async (recordId: string, input: Record<string, unknown>) => {
      if (accommodationAccess === undefined) {
        const message = 'Checking module access. Please try again.';
        setError(message);
        throw new Error(message);
      }
      const accessError = getVendorMutationAccessError(module, accommodationAccess);
      if (accessError) {
        setError(accessError);
        throw new Error(accessError);
      }
      setSubmitting(true);
      setError(null);
      try {
        return await updateVendorOSRecord(operation, recordId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to update module record';
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [accommodationAccess, module, operation],
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      if (accommodationAccess === undefined) {
        const message = 'Checking module access. Please try again.';
        setError(message);
        throw new Error(message);
      }
      const accessError = getVendorMutationAccessError(module, accommodationAccess);
      if (accessError) {
        setError(accessError);
        throw new Error(accessError);
      }
      setSubmitting(true);
      setError(null);
      try {
        return await deleteVendorOSRecord(operation, recordId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to delete module record';
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [accommodationAccess, module, operation],
  );

  return {
    createRecord,
    updateRecord,
    deleteRecord,
    submitting,
    error,
  };
}

export function useVendorDocumentUpload(
  organizationId?: string | null,
  branchId?: string | null,
  accessOverride?: ResolvedVendorAccommodationAccess | null,
) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accommodationAccess = useMutationAccommodationAccess(organizationId, accessOverride);

  const uploadDocument = useCallback(
    async (input: { name: string; document_type: string; status?: DocumentStatus; file: File | Blob }) => {
      if (!organizationId) throw new Error('Select an organization before uploading documents');
      if (accommodationAccess === undefined) {
        const message = 'Checking module access. Please try again.';
        setError(message);
        throw new Error(message);
      }
      const accessError = getVendorMutationAccessError('documents', accommodationAccess);
      if (accessError) {
        setError(accessError);
        throw new Error(accessError);
      }
      setSubmitting(true);
      setError(null);
      try {
        return await uploadVendorDocumentFile({
          organizationId,
          branchId: branchId || null,
          module: 'documents',
          name: input.name,
          documentType: input.document_type,
          status: input.status || 'active',
          file: input.file,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to upload document';
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [accommodationAccess, branchId, organizationId],
  );

  return {
    uploadDocument,
    submitting,
    error,
  };
}

export function useVendorDocumentDownload() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDownloadUrl = useCallback(async (storagePath: string) => {
    setSubmitting(true);
    setError(null);
    try {
      return await createVendorDocumentSignedUrl(storagePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to prepare document download';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    createDownloadUrl,
    submitting,
    error,
  };
}
