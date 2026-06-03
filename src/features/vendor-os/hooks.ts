import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listVendorAuditLogs,
  listVendorBranches,
  listVendorDocuments,
  listVendorNotifications,
  listVendorOSRecords,
  listVendorOrganizations,
  listVendorTeamMembers,
  type VendorOSRecordRow,
} from './api';
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
} from './types';

const DEFAULT_ROLE: VendorOSRole = 'owner';

export function useVendorOSTenant(userId?: string | null) {
  const [organizations, setOrganizations] = useState<VendorOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<VendorOrganization | null>(null);
  const [branches, setBranches] = useState<VendorBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<VendorBranch | null>(null);
  const [teamMembers, setTeamMembers] = useState<VendorTeamMember[]>([]);
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
        const [branchList, memberList] = await Promise.all([
          listVendorBranches(selected?.id),
          listVendorTeamMembers(selected?.id),
        ]);

        if (!mounted) return;
        setOrganizations(orgs);
        setSelectedOrganization(selected);
        setBranches(branchList);
        setActiveBranch(branchList[0] || null);
        setTeamMembers(memberList);
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
    (module: VendorOSModule, action: PermissionAction = 'view') => canAccessVendorModule(role, module, action),
    [role],
  );

  return {
    organizations,
    selectedOrganization,
    setSelectedOrganization,
    branches,
    activeBranch,
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

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
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

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return {
    notifications,
    unreadCount: notifications.filter((notification) => notification.status === 'unread').length,
    loading,
    error,
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

  useEffect(() => {
    let mounted = true;
    const operation = getVendorOSOperation(module);

    setLoading(true);
    setError(null);
    listVendorOSRecords(operation, organizationId || undefined)
      .then((rows) => {
        if (mounted) setRecords(rows);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load module records');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [module, organizationId]);

  return {
    records,
    loading,
    error,
  };
}
