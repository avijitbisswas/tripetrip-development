import type { ResolvedVendorAccommodationAccess } from './accommodationAccess';
import type { ApprovalMode } from './accommodationAccess';
import type { VendorOSModule } from './types';

type InsightItem = {
  label: string;
  status: string;
};

export type AccommodationModuleInsight = {
  title: string;
  summary: string;
  items: InsightItem[];
};

function formatApproval(mode: ApprovalMode) {
  if (mode === 'admin_approval_required') return 'Admin approval';
  if (mode === 'vendor_owner_only') return 'Owner approval';
  return 'Open';
}

export function getAccommodationModuleInsights(
  module: VendorOSModule,
  access: ResolvedVendorAccommodationAccess | null | undefined,
): AccommodationModuleInsight | null {
  if (!access?.isAccommodationProvider) return null;

  const isOpen = access.enforcementMode === 'open';
  const summary = isOpen
    ? `Accommodation plan is running in open mode on ${access.planTier}.`
    : `Accommodation plan is enforced on ${access.planTier}, so locked features and approvals are shown here.`;

  if (module === 'pms') {
    return {
      title: 'Accommodation controls',
      summary,
      items: [
        {
          label: 'Mobile check-in',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['checkin.mobile']
              ? 'Enabled'
              : `Locked on ${access.planTier}`,
        },
        {
          label: 'GST folios',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['billing.gst_invoice']
              ? 'Enabled'
              : 'Upgrade to unlock',
        },
        {
          label: 'Housekeeping mobile tasks',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['housekeeping.mobile_tasks']
              ? 'Enabled'
              : 'Locked',
        },
      ],
    };
  }

  if (module === 'calendar') {
    return {
      title: 'Accommodation controls',
      summary,
      items: [
        {
          label: 'OTA sync',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['inventory.ota_sync']
              ? 'Enabled'
              : 'Upgrade to unlock',
        },
        {
          label: 'Rule-based rates',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['inventory.rule_based_rates']
              ? 'Enabled'
              : 'Locked',
        },
        {
          label: 'Dynamic pricing',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['inventory.dynamic_pricing']
              ? 'Enabled'
              : 'Advanced only',
        },
      ],
    };
  }

  if (module === 'marketplace') {
    return {
      title: 'Accommodation controls',
      summary,
      items: [
        {
          label: 'Publishing',
          status: isOpen ? 'Open' : formatApproval(access.resolvedApprovals.marketplace_publishing),
        },
        {
          label: 'Pricing changes',
          status: isOpen ? 'Open' : formatApproval(access.resolvedApprovals.pricing_changes),
        },
        {
          label: 'Automated confirmations',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['guest.automated_confirmations']
              ? 'Enabled'
              : 'Locked',
        },
      ],
    };
  }

  if (module === 'analytics') {
    return {
      title: 'Accommodation controls',
      summary,
      items: [
        {
          label: 'Operational dashboards',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['analytics.operational_dashboards']
              ? 'Enabled'
              : 'Upgrade to unlock',
        },
        {
          label: 'AI forecasting',
          status: isOpen
            ? 'Open'
            : access.resolvedCapabilities['analytics.ai_forecasting']
              ? 'Enabled'
              : 'Advanced only',
        },
        {
          label: 'AI recommendations',
          status: isOpen ? 'Open' : formatApproval(access.resolvedApprovals.ai_recommendations),
        },
      ],
    };
  }

  return null;
}
