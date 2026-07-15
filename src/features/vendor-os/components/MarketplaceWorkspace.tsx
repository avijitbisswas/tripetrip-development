import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BadgePercent,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Layers,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listVendorPmsRecords } from '../api';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { getAccommodationModuleInsights } from '../accommodationModuleInsights';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import type { VendorPmsReservationRecord, VendorRoomRecord, VendorRoomTypeRecord } from '../types';
import { AccommodationInsightPanel } from './AccommodationInsightPanel';

interface MarketplaceWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
  accommodationAccess?: ResolvedVendorAccommodationAccess | null;
}

const listings = [
  { title: 'Goa Beach Escape', source: 'PMS / Private villa', sync: 'Synced 4m ago', state: 'Live', metric: '7.8% conversion' },
  { title: 'Kerala Houseboat', source: 'PMS / Stay listing', sync: '4 rooms left', state: 'Inventory guarded', metric: '31 saves' },
  { title: 'Luxury SUV Rental', source: 'Fleet / Transport', sync: 'Service blocks protected', state: 'Promoted', metric: 'INR 2,299/day' },
  { title: 'Scuba Diving', source: 'Activities / Slots', sync: '8 seats left', state: 'Selling', metric: 'Safety log due' },
];

const deals = [
  { title: 'Goa Beach Escape', detail: 'Limited-Time Direct Deal', value: '30% off', state: 'Live' },
  { title: 'Dubai Weekend', detail: 'Festival offer scheduled', value: 'Starts tonight', state: 'Scheduled' },
  { title: 'Bali Luxury Villa', detail: 'Direct booking discount', value: 'Save INR 5,500', state: 'Review' },
];

const mappings = [
  { source: 'PMS Rooms', target: 'Stays listings', health: '98% synced', state: 'Protected' },
  { source: 'Tour Departures', target: 'Package cards', health: '2 supplier holds', state: 'Attention' },
  { source: 'Activity Slots', target: 'Experience listings', health: 'Capacity live', state: 'Live' },
  { source: 'Fleet Availability', target: 'Transport cards', health: '1 vehicle blocked', state: 'Guarded' },
];

const publishingQueue = [
  { title: 'Andaman Trip gallery update', detail: '5 photos awaiting approval', state: 'Review' },
  { title: 'Kerala Houseboat blackout', detail: 'Marketplace inventory recalculated', state: 'Synced' },
  { title: 'Luxury SUV permit risk', detail: 'Transport listing partially paused', state: 'Attention' },
];

const conversionSignals = [
  { title: 'Search visibility', value: '82%', detail: '+9% after deal badge' },
  { title: 'Direct savings', value: 'INR 3.2L', detail: 'Traveler value this month' },
  { title: 'Booking lift', value: '+18%', detail: 'Flash sale segments' },
];

const syncSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Inventory source of truth',
    detail: 'Rooms, departures, slots, and vehicles publish from internal capacity instead of manual marketplace edits.',
    icon: Layers,
  },
  {
    title: 'Direct deal engine',
    detail: 'Seasonal, festival, last-minute, and exclusive direct-booking discounts stay tied to real availability.',
    icon: BadgePercent,
  },
  {
    title: 'Publishing governance',
    detail: 'Approval states protect images, pricing, blackout dates, and public listing changes.',
    icon: ShieldCheck,
  },
];

const sourceModuleOptions = ['pms', 'tours', 'activities', 'fleet'];
const syncStatusOptions = ['pending', 'synced', 'failed'];
const listingStateOptions = ['draft', 'live', 'paused'];
const channelTargetOptions = ['tripetrip', 'direct_web', 'booking_request', 'airbnb_request'];
const providerNameOptions = ['booking.com', 'airbnb', 'expedia', 'agoda', 'direct_api'];
const connectionStatusOptions = ['draft', 'connected', 'error', 'paused'];
const channelSyncTypeOptions = ['inventory', 'rates', 'reservation'];

const channelProviderMap: Record<string, string | null> = {
  tripetrip: null,
  direct_web: null,
  booking_request: 'booking.com',
  airbnb_request: 'airbnb',
};

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatChannelStatus(value: unknown) {
  return titleCase(String(value || 'draft'));
}

function formatTimestamp(value: unknown) {
  const parsed = new Date(String(value || ''));
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatePill({ state }: { state: string }) {
  const attention = ['Attention', 'Review', 'Scheduled'].includes(state);
  return (
    <span
      className={
        attention
          ? 'w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase text-amber-700 ring-1 ring-amber-100'
          : 'w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100'
      }
    >
      {state}
    </span>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">{detail}</div>
    </div>
  );
}

export function MarketplaceWorkspace({ organizationId, branchId, accommodationAccess }: MarketplaceWorkspaceProps) {
  const records = useVendorOSRecords('marketplace', organizationId);
  const propertyRecords = useVendorOSRecords('pms', organizationId);
  const mutations = useVendorOSRecordMutations('marketplace', organizationId, branchId);
  const accommodationInsight = getAccommodationModuleInsights('marketplace', accommodationAccess);
  const [syncForm, setSyncForm] = useState({
    listing_title: '',
    public_slug: '',
    property_id: '',
    room_type_id: '',
    module: 'pms',
    sync_status: 'pending',
    listing_state: 'draft',
    nightly_rate: '',
    conversion_rate: '',
    channel_targets: ['tripetrip', 'direct_web'],
    direct_deal_enabled: false,
    deal_badge: '',
  });
  const [connectionForm, setConnectionForm] = useState({
    provider_name: 'booking.com',
    connection_status: 'draft',
    credential_label: '',
    sync_type: 'inventory',
    enabled: true,
    notes: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [pmsLoading, setPmsLoading] = useState(false);
  const [pmsError, setPmsError] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<VendorRoomTypeRecord[]>([]);
  const [rooms, setRooms] = useState<VendorRoomRecord[]>([]);
  const [reservations, setReservations] = useState<VendorPmsReservationRecord[]>([]);

  useEffect(() => {
    let active = true;

    async function loadPmsInventory() {
      if (!organizationId) {
        if (active) {
          setRoomTypes([]);
          setRooms([]);
          setReservations([]);
          setPmsError(null);
          setPmsLoading(false);
        }
        return;
      }

      setPmsLoading(true);
      setPmsError(null);

      try {
        const [roomTypeRows, roomRows, reservationRows] = await Promise.all([
          listVendorPmsRecords('room_types', organizationId),
          listVendorPmsRecords('rooms', organizationId),
          listVendorPmsRecords('reservations', organizationId),
        ]);

        if (!active) return;
        setRoomTypes(roomTypeRows);
        setRooms(roomRows);
        setReservations(reservationRows);
      } catch (error) {
        if (!active) return;
        setPmsError(error instanceof Error ? error.message : 'Unable to load PMS availability');
      } finally {
        if (active) setPmsLoading(false);
      }
    }

    void loadPmsInventory();

    return () => {
      active = false;
    };
  }, [organizationId]);

  const propertyMap = useMemo(
    () =>
      new Map(
        propertyRecords.records.map((record) => [
          String(record.id),
          {
            id: String(record.id),
            name: String(record.name || 'Untitled property'),
          },
        ]),
      ),
    [propertyRecords.records],
  );

  const roomTypeMap = useMemo(() => new Map(roomTypes.map((roomType) => [roomType.id, roomType])), [roomTypes]);

  const activeReservationStatuses = new Set(['reserved', 'confirmed', 'checked_in']);
  const inventorySummaries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayValue = today.getTime();

    return roomTypes
      .map((roomType) => {
        const roomRows = rooms.filter((room) => room.property_id === roomType.property_id && room.room_type_id === roomType.id);
        const activeReservationsCount = reservations.filter((reservation) => {
          if (reservation.property_id !== roomType.property_id || !activeReservationStatuses.has(reservation.status)) return false;
          const roomMatches = reservation.room_id ? roomRows.some((room) => room.id === reservation.room_id) : true;
          if (!roomMatches) return false;

          const checkInValue = new Date(reservation.check_in_date).getTime();
          const checkOutValue = new Date(reservation.check_out_date).getTime();
          if (Number.isNaN(checkInValue) || Number.isNaN(checkOutValue)) return false;
          return checkInValue <= todayValue && checkOutValue > todayValue;
        }).length;

        const totalInventory = roomRows.length;
        const availableInventory = Math.max(totalInventory - activeReservationsCount, 0);
        const occupancyRate = totalInventory > 0 ? Number((((totalInventory - availableInventory) / totalInventory) * 100).toFixed(1)) : 0;

        return {
          propertyId: roomType.property_id,
          roomTypeId: roomType.id,
          propertyName: propertyMap.get(roomType.property_id)?.name || 'Untitled property',
          roomTypeName: roomType.name,
          totalInventory,
          availableInventory,
          occupiedInventory: totalInventory - availableInventory,
          occupancyRate,
          baseRate: Number(roomType.base_rate || 0),
          housekeepingAttention: roomRows.filter((room) => room.housekeeping_status !== 'clean').length,
        };
      })
      .filter((summary) => summary.totalInventory > 0);
  }, [propertyMap, reservations, roomTypes, rooms]);

  const selectedSummary = useMemo(
    () =>
      inventorySummaries.find(
        (summary) => summary.propertyId === syncForm.property_id && summary.roomTypeId === syncForm.room_type_id,
      ) || null,
    [inventorySummaries, syncForm.property_id, syncForm.room_type_id],
  );

  const typedMarketplaceRecords = useMemo(
    () =>
      records.records.map((record) => {
        const metadata =
          record.metadata && typeof record.metadata === 'object' ? (record.metadata as Record<string, unknown>) : {};

        return {
          record,
          metadata,
          recordType: String(metadata.record_type || 'listing_sync'),
        };
      }),
    [records.records],
  );

  const liveListings = useMemo(
    () =>
      typedMarketplaceRecords
        .filter(({ recordType }) => recordType === 'listing_sync')
        .map(({ record, metadata }) => {
        const availableInventory = Number(metadata.available_inventory || 0);
        const totalInventory = Number(metadata.total_inventory || 0);
        const nightlyRate = Number(metadata.nightly_rate || 0);
        const approvalStatus = String(metadata.approval_status || 'open');
        const channelTargets = Array.isArray(metadata.channel_targets) ? metadata.channel_targets.map((value) => String(value)) : [];
        const channelDistribution =
          metadata.channel_distribution && typeof metadata.channel_distribution === 'object'
            ? (metadata.channel_distribution as Record<string, { status?: string; mode?: string }>)
            : {};
        return {
          id: String(record.id),
          title: String(metadata.listing_title || record.title || 'Untitled listing'),
          slug: String(metadata.public_slug || 'Slug pending'),
          dealBadge: metadata.direct_deal_enabled ? `${String(metadata.deal_badge || 'Direct deal')} direct deal` : 'No direct deal',
          propertyId: metadata.property_id ? String(metadata.property_id) : '',
          roomTypeId: metadata.room_type_id ? String(metadata.room_type_id) : '',
          source: `${String(record.module || 'marketplace').toUpperCase()} / ${String(metadata.room_type_name || 'Room inventory')}`,
          sync: String(record.last_synced_at ? `Synced ${record.last_synced_at}` : 'Awaiting marketplace sync'),
          state: titleCase(String(metadata.listing_state || record.sync_status || 'pending')),
          syncStatus: String(record.sync_status || 'pending'),
          approvalStatus: titleCase(approvalStatus),
          metric:
            record.conversion_rate === null || record.conversion_rate === undefined
              ? 'Conversion pending'
              : `${record.conversion_rate}% conversion`,
          inventory: totalInventory > 0 ? `${availableInventory}/${totalInventory} rooms available` : 'Inventory pending',
          nightlyRate: nightlyRate > 0 ? `INR ${Math.round(nightlyRate).toLocaleString('en-IN')}/night` : 'Rate pending',
          channels: channelTargets.join(', '),
          channelDistribution: channelTargets.map((channel) => ({
            channel,
            status: formatChannelStatus(channelDistribution[channel]?.status),
          })),
        };
      }),
    [typedMarketplaceRecords],
  );

  const channelConnections = useMemo(
    () =>
      typedMarketplaceRecords
        .filter(({ recordType }) => recordType === 'channel_connection')
        .map(({ record, metadata }) => ({
          id: String(record.id),
          providerName: String(metadata.provider_name || 'Unknown provider'),
          connectionStatus: titleCase(String(metadata.connection_status || record.sync_status || 'draft')),
          syncType: titleCase(String(metadata.sync_type || 'inventory')),
          credentialLabel: String(metadata.credential_label || 'Credential pending'),
          enabled: Boolean(metadata.enabled ?? true),
          notes: String(metadata.notes || ''),
          lastVerifiedAt: metadata.last_verified_at ? formatTimestamp(metadata.last_verified_at) : 'Not verified',
        })),
    [typedMarketplaceRecords],
  );

  const channelSyncLogs = useMemo(
    () =>
      typedMarketplaceRecords
        .filter(({ recordType }) => recordType === 'channel_sync_log')
        .map(({ record, metadata }) => ({
          id: String(record.id),
          connectionId: String(metadata.connection_id || ''),
          providerName: String(metadata.provider_name || 'Unknown provider'),
          syncType: titleCase(String(metadata.sync_type || 'inventory')),
          direction: titleCase(String(metadata.direction || 'outbound')),
          status: titleCase(String(metadata.status || record.sync_status || 'queued')),
          rawStatus: String(metadata.status || record.sync_status || 'queued'),
          payloadSummary: String(metadata.payload_summary || 'No payload summary'),
          errorSummary: String(metadata.error_summary || ''),
          sortValue: String(record.last_synced_at || record.created_at || ''),
          updatedAt: record.last_synced_at ? formatTimestamp(record.last_synced_at) : formatTimestamp(record.created_at),
        }))
        .sort((left, right) => right.sortValue.localeCompare(left.sortValue)),
    [typedMarketplaceRecords],
  );

  async function refreshInventory() {
    await Promise.all([
      records.refresh(),
      propertyRecords.refresh(),
      organizationId
        ? Promise.all([
            listVendorPmsRecords('room_types', organizationId),
            listVendorPmsRecords('rooms', organizationId),
            listVendorPmsRecords('reservations', organizationId),
          ]).then(([roomTypeRows, roomRows, reservationRows]) => {
            setRoomTypes(roomTypeRows);
            setRooms(roomRows);
            setReservations(reservationRows);
          })
        : Promise.resolve(),
    ]);
  }

  async function handleSyncSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    if (!selectedSummary) {
      setFormMessage('Choose a property and room type with live PMS inventory before publishing.');
      return;
    }

    try {
      const requiresAdminApproval = accommodationAccess?.resolvedApprovals.marketplace_publishing === 'admin_approval_required';
      const effectiveSyncStatus = requiresAdminApproval ? 'pending_approval' : syncForm.sync_status;
      const effectiveListingState = requiresAdminApproval && syncForm.listing_state === 'live' ? 'pending_approval' : syncForm.listing_state;

      await mutations.createRecord({
        listing_title: syncForm.listing_title || `${selectedSummary.propertyName} ${selectedSummary.roomTypeName}`,
        public_slug:
          syncForm.public_slug ||
          `${selectedSummary.propertyName}-${selectedSummary.roomTypeName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        property_id: selectedSummary.propertyId,
        room_type_id: selectedSummary.roomTypeId,
        room_type_name: selectedSummary.roomTypeName,
        module: syncForm.module,
        sync_status: effectiveSyncStatus,
        requested_sync_status: syncForm.sync_status,
        listing_state: effectiveListingState,
        requested_listing_state: syncForm.listing_state,
        approval_status: requiresAdminApproval ? 'pending' : 'open',
        nightly_rate: syncForm.nightly_rate ? Number(syncForm.nightly_rate) : selectedSummary.baseRate,
        total_inventory: selectedSummary.totalInventory,
        available_inventory: selectedSummary.availableInventory,
        occupied_inventory: selectedSummary.occupiedInventory,
        occupancy_rate: selectedSummary.occupancyRate,
        conversion_rate: syncForm.conversion_rate ? Number(syncForm.conversion_rate) : null,
        channel_targets: syncForm.channel_targets,
        direct_deal_enabled: syncForm.direct_deal_enabled,
        deal_badge: syncForm.deal_badge,
      });
      setSyncForm({
        listing_title: '',
        public_slug: '',
        property_id: '',
        room_type_id: '',
        module: 'pms',
        sync_status: 'pending',
        listing_state: 'draft',
        nightly_rate: '',
        conversion_rate: '',
        channel_targets: ['tripetrip', 'direct_web'],
        direct_deal_enabled: false,
        deal_badge: '',
      });
      await refreshInventory();
      setFormMessage(requiresAdminApproval ? 'Inventory submitted for admin publishing approval' : 'Inventory published to marketplace sync');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create listing sync');
    }
  }

  async function handleRefreshListing(listingId: string, propertyId: string, roomTypeId: string, currentSyncStatus: string) {
    const summary = inventorySummaries.find((item) => item.propertyId === propertyId && item.roomTypeId === roomTypeId);
    if (!summary) {
      setFormMessage('Live PMS availability is missing for this listing.');
      return;
    }

    try {
      await mutations.updateRecord(listingId, {
        sync_status: currentSyncStatus === 'pending_approval' ? 'pending_approval' : 'synced',
        ...(currentSyncStatus === 'pending_approval' ? {} : { last_synced_at: new Date().toISOString() }),
        metadata: {
          property_id: summary.propertyId,
          room_type_id: summary.roomTypeId,
          room_type_name: summary.roomTypeName,
          total_inventory: summary.totalInventory,
          available_inventory: summary.availableInventory,
          occupied_inventory: summary.occupiedInventory,
          occupancy_rate: summary.occupancyRate,
          nightly_rate: summary.baseRate,
        },
      });
      await refreshInventory();
      setFormMessage('Listing availability refreshed from PMS.');
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Unable to refresh listing availability');
    }
  }

  async function handleConnectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        record_type: 'channel_connection',
        module: 'pms',
        provider_name: connectionForm.provider_name,
        connection_status: connectionForm.connection_status,
        credential_label: connectionForm.credential_label,
        sync_type: connectionForm.sync_type,
        enabled: connectionForm.enabled,
        notes: connectionForm.notes,
      });
      setConnectionForm({
        provider_name: 'booking.com',
        connection_status: 'draft',
        credential_label: '',
        sync_type: 'inventory',
        enabled: true,
        notes: '',
      });
      await records.refresh();
      setFormMessage('Channel connection saved');
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Unable to save channel connection');
    }
  }

  async function handleVerifyConnection(connectionId: string, providerName: string, syncType: string) {
    if (!organizationId) return;

    try {
      const verifiedAt = new Date().toISOString();
      await mutations.updateRecord(connectionId, {
        sync_status: 'connected',
        metadata: {
          connection_status: 'connected',
          last_verified_at: verifiedAt,
        },
      });
      await mutations.createRecord({
        record_type: 'channel_sync_log',
        module: 'pms',
        connection_id: connectionId,
        provider_name: providerName,
        sync_type: syncType.toLowerCase(),
        direction: 'outbound',
        status: 'applied',
        payload_summary: 'Manual connection verification completed',
      });
      await records.refresh();
      setFormMessage(`Verified ${providerName} connection`);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Unable to verify channel connection');
    }
  }

  async function handleRunChannelSync(connectionId: string, providerName: string, syncType: string, isConnected: boolean) {
    try {
      await mutations.createRecord({
        record_type: 'channel_sync_log',
        module: 'pms',
        connection_id: connectionId,
        provider_name: providerName,
        sync_type: syncType.toLowerCase(),
        direction: 'outbound',
        status: isConnected ? 'applied' : 'failed',
        payload_summary: `Manual ${syncType.toLowerCase()} push requested from Vendor OS`,
        error_summary: isConnected ? null : 'Connection must be verified before sending channel updates',
      });
      await records.refresh();
      setFormMessage(isConnected ? `Pushed ${syncType.toLowerCase()} update for ${providerName}` : `Channel sync failed for ${providerName}`);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Unable to run channel sync');
    }
  }

  async function handleRetryChannelLog(log: {
    connectionId: string;
    providerName: string;
    syncType: string;
  }) {
    const linkedConnection = channelConnections.find((connection) => connection.id === log.connectionId);
    await handleRunChannelSync(
      log.connectionId,
      log.providerName,
      log.syncType,
      linkedConnection?.connectionStatus.toLowerCase() === 'connected',
    );
  }

  const liveMetricCards = useMemo(() => {
    const listingsLive = liveListings.filter((listing) => listing.state.toLowerCase() === 'live').length;
    const dealsActive = liveListings.filter((listing) => listing.dealBadge !== 'No direct deal').length;
    const averageConversion =
      liveListings.length > 0
        ? (
            liveListings.reduce((total, listing) => {
              const numeric = Number.parseFloat(listing.metric);
              return Number.isFinite(numeric) ? total + numeric : total;
            }, 0) / liveListings.filter((listing) => Number.isFinite(Number.parseFloat(listing.metric))).length || 0
          ).toFixed(1)
        : '0.0';
    const syncHealth =
      liveListings.length > 0
        ? `${Math.round((liveListings.filter((listing) => listing.state.toLowerCase() !== 'failed').length / liveListings.length) * 100)}%`
        : '100%';
    const connectedChannels = channelConnections.filter((connection) => connection.connectionStatus.toLowerCase() === 'connected').length;
    const failedChannelLogs = channelSyncLogs.filter((log) => log.rawStatus === 'failed' || log.rawStatus === 'conflict').length;

    return [
      ['Listings Live', String(listingsLive), 'Published inventory'],
      ['Deals Active', String(dealsActive), 'Direct deal enabled'],
      ['Connected Channels', String(connectedChannels), 'Ready for push sync'],
      ['Sync Exceptions', String(failedChannelLogs), 'Need manual retry'],
      ['Conversion', `${averageConversion}%`, 'Average tracked'],
      ['Sync Health', syncHealth, 'PMS connected'],
    ];
  }, [channelConnections, channelSyncLogs, liveListings]);

  const mappingHealth = useMemo(() => {
    const latestLogByConnection = new Map<
      string,
      {
        rawStatus: string;
        providerName: string;
        updatedAt: string;
      }
    >();
    channelSyncLogs.forEach((log) => {
      if (!log.connectionId) return;
      const existing = latestLogByConnection.get(log.connectionId);
      if (!existing || new Date(log.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        latestLogByConnection.set(log.connectionId, {
          rawStatus: log.rawStatus,
          providerName: log.providerName,
          updatedAt: log.updatedAt,
        });
      }
    });

    return inventorySummaries.map((summary) => {
      const relatedListings = liveListings.filter(
        (listing) => listing.propertyId === summary.propertyId && listing.roomTypeId === summary.roomTypeId,
      );
      const channelTargets = Array.from(
        new Set(relatedListings.flatMap((listing) => listing.channelDistribution.map((channel) => channel.channel))),
      );
      const requiredProviders = channelTargets
        .map((target) => channelProviderMap[target] || null)
        .filter((provider): provider is string => Boolean(provider));
      const connectedProviders = new Set(
        channelConnections
          .filter((connection) => connection.connectionStatus.toLowerCase() === 'connected')
          .map((connection) => connection.providerName.toLowerCase()),
      );
      const blockedProviders = requiredProviders.filter((provider) => !connectedProviders.has(provider.toLowerCase()));
      const relatedConnectionIds = channelConnections
        .filter((connection) => requiredProviders.includes(connection.providerName))
        .map((connection) => connection.id);
      const failedSyncs = relatedConnectionIds.filter((connectionId) => {
        const latestLog = latestLogByConnection.get(connectionId);
        return latestLog?.rawStatus === 'failed' || latestLog?.rawStatus === 'conflict';
      }).length;
      const pendingApproval = relatedListings.filter((listing) => listing.approvalStatus.toLowerCase() === 'pending').length;
      const readyState =
        blockedProviders.length > 0 || failedSyncs > 0 || summary.housekeepingAttention > 0
          ? 'Attention'
          : summary.availableInventory > 0
            ? 'Live'
            : 'Review';

      return {
        ...summary,
        blockedProviders,
        failedSyncs,
        pendingApproval,
        channelTargets,
        readyState,
      };
    });
  }, [channelConnections, channelSyncLogs, inventorySummaries, liveListings]);

  const otaReadinessQueue = useMemo(() => {
    const failedLogs = channelSyncLogs
      .filter((log) => log.rawStatus === 'failed' || log.rawStatus === 'conflict')
      .map((log) => ({
        id: `log-${log.id}`,
        title: `${titleCase(log.providerName)} ${titleCase(log.syncType)} sync blocked`,
        detail: log.errorSummary || log.payloadSummary,
        state: 'Attention',
      }));
    const disconnectedProviders = channelConnections
      .filter((connection) => connection.connectionStatus.toLowerCase() !== 'connected')
      .map((connection) => ({
        id: `connection-${connection.id}`,
        title: `${titleCase(connection.providerName)} verification pending`,
        detail: `${titleCase(connection.syncType)} sync is ${connection.connectionStatus.toLowerCase()} until the channel is verified.`,
        state: 'Review',
      }));
    const pendingListings = liveListings
      .filter((listing) => listing.approvalStatus.toLowerCase() === 'pending')
      .map((listing) => ({
        id: `listing-${listing.id}`,
        title: `${listing.title} awaiting publishing approval`,
        detail: `${listing.channels} cannot go live until the publishing queue clears this change.`,
        state: 'Review',
      }));

    return [...failedLogs, ...disconnectedProviders, ...pendingListings].slice(0, 6);
  }, [channelConnections, channelSyncLogs, liveListings]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Listings, deals, sync, conversion
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Marketplace Listing Management</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Connect operating inventory to Tripetrip listings, direct deals, publishing approvals, price visibility, and conversion performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700"
              disabled={pmsLoading || records.loading}
              onClick={() => void refreshInventory()}
              type="button"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Listing
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <Tag className="mr-2 h-4 w-4" />
              Create Flash Sale
            </Button>
          </div>
        </div>
      </section>

      <AccommodationInsightPanel insight={accommodationInsight} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Listing Sync Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_marketplace_syncs</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live Marketplace API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_0.8fr_0.6fr_0.6fr_0.55fr_auto]" onSubmit={handleSyncSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Property *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={syncForm.property_id}
              onChange={(inputEvent) =>
                setSyncForm((current) => ({ ...current, property_id: inputEvent.target.value, room_type_id: '' }))
              }
            >
              <option value="">Select property</option>
              {Array.from(propertyMap.values()).map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Room type *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={syncForm.room_type_id}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, room_type_id: inputEvent.target.value }))}
            >
              <option value="">Select room type</option>
              {inventorySummaries
                .filter((summary) => !syncForm.property_id || summary.propertyId === syncForm.property_id)
                .map((summary) => (
                  <option key={summary.roomTypeId} value={summary.roomTypeId}>
                    {summary.roomTypeName}
                  </option>
                ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Listing title *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Marketplace listing"
              value={syncForm.listing_title}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, listing_title: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Public slug</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="private-villa-goa"
              value={syncForm.public_slug}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, public_slug: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Source module *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={syncForm.module}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, module: inputEvent.target.value }))}
            >
              {sourceModuleOptions.map((module) => (
                <option key={module} value={module}>
                  {titleCase(module)}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-2 md:col-span-2 xl:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Channels</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {channelTargetOptions.map((channel) => (
                <label
                  key={channel}
                  className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700"
                >
                  <input
                    checked={syncForm.channel_targets.includes(channel)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    type="checkbox"
                    onChange={(inputEvent) =>
                      setSyncForm((current) => ({
                        ...current,
                        channel_targets: inputEvent.target.checked
                          ? [...current.channel_targets, channel]
                          : current.channel_targets.filter((value) => value !== channel),
                      }))
                    }
                  />
                  {titleCase(channel)}
                </label>
              ))}
            </div>
          </div>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Listing state *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={syncForm.listing_state}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, listing_state: inputEvent.target.value }))}
            >
              {listingStateOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Sync status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={syncForm.sync_status}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, sync_status: inputEvent.target.value }))}
            >
              {syncStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Nightly rate</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              min="0"
              step="0.01"
              type="number"
              value={syncForm.nightly_rate}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, nightly_rate: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Conversion rate</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              min="0"
              step="0.1"
              type="number"
              value={syncForm.conversion_rate}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, conversion_rate: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Deal badge</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="30% off"
              value={syncForm.deal_badge}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, deal_badge: inputEvent.target.value }))}
            />
          </label>
          <label className="flex h-11 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 text-xs font-bold text-emerald-800 xl:mt-auto">
            <input
              checked={syncForm.direct_deal_enabled}
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600"
              type="checkbox"
              onChange={(inputEvent) =>
                setSyncForm((current) => ({ ...current, direct_deal_enabled: inputEvent.target.checked }))
              }
            />
            Direct deal enabled
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Publish Inventory
          </Button>
        </form>
        {selectedSummary && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="text-sm font-black text-slate-950">
              {selectedSummary.propertyName} / {selectedSummary.roomTypeName}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
              <span>{selectedSummary.availableInventory}/{selectedSummary.totalInventory} rooms available</span>
              <span>{selectedSummary.occupancyRate}% occupied</span>
              <span>INR {Math.round(selectedSummary.baseRate).toLocaleString('en-IN')} base rate</span>
              <span>{selectedSummary.housekeepingAttention} rooms need housekeeping review</span>
            </div>
          </div>
        )}
        {(formMessage || mutations.error || records.error || pmsError || propertyRecords.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">
            {formMessage || mutations.error || records.error || pmsError || propertyRecords.error}
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {liveMetricCards.map(([label, value, detail]) => (
          <Metric key={label} label={label} value={value} detail={detail} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Channel Connections</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">Manual OTA foundation with real status and verification history</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
              Live Connection State
            </span>
          </div>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleConnectionSubmit}>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Provider *</span>
              <select
                aria-label="Provider *"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={connectionForm.provider_name}
                onChange={(event) => setConnectionForm((current) => ({ ...current, provider_name: event.target.value }))}
              >
                {providerNameOptions.map((provider) => (
                  <option key={provider} value={provider}>
                    {titleCase(provider)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Connection status *</span>
              <select
                aria-label="Connection status *"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={connectionForm.connection_status}
                onChange={(event) => setConnectionForm((current) => ({ ...current, connection_status: event.target.value }))}
              >
                {connectionStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {titleCase(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Credential label *</span>
              <input
                aria-label="Credential label *"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Prod API token"
                required
                value={connectionForm.credential_label}
                onChange={(event) => setConnectionForm((current) => ({ ...current, credential_label: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Primary sync *</span>
              <select
                aria-label="Primary sync *"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={connectionForm.sync_type}
                onChange={(event) => setConnectionForm((current) => ({ ...current, sync_type: event.target.value }))}
              >
                {channelSyncTypeOptions.map((syncType) => (
                  <option key={syncType} value={syncType}>
                    {titleCase(syncType)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Notes</span>
              <input
                aria-label="Connection notes"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Manual XML pull, staged mapping, sandbox verified"
                value={connectionForm.notes}
                onChange={(event) => setConnectionForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
            <label className="flex h-11 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 text-xs font-bold text-emerald-800">
              <input
                aria-label="Connection enabled"
                checked={connectionForm.enabled}
                className="h-4 w-4 rounded border-emerald-300 text-emerald-600"
                type="checkbox"
                onChange={(event) => setConnectionForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Connection enabled
            </label>
            <Button
              className="h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700"
              disabled={!organizationId || mutations.submitting}
              type="submit"
            >
              Save Connection
            </Button>
          </form>
          <div className="mt-4 space-y-3">
            {channelConnections.map((connection) => (
              <div key={connection.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{titleCase(connection.providerName)}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{connection.syncType}</div>
                    <div className="mt-1 text-xs text-slate-500">{connection.credentialLabel}</div>
                  </div>
                  <StatePill state={connection.connectionStatus} />
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                  {connection.enabled ? 'Enabled' : 'Disabled'} • Verified {connection.lastVerifiedAt}
                </div>
                {connection.notes ? <div className="mt-2 text-sm text-slate-600">{connection.notes}</div> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl bg-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800"
                    disabled={!organizationId || mutations.submitting}
                    onClick={() => void handleVerifyConnection(connection.id, connection.providerName, connection.syncType)}
                  >
                    Verify Connection
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    disabled={!organizationId || mutations.submitting}
                    onClick={() =>
                      void handleRunChannelSync(
                        connection.id,
                        connection.providerName,
                        connection.syncType,
                        connection.connectionStatus.toLowerCase() === 'connected',
                      )
                    }
                  >
                    Push Sync
                  </Button>
                </div>
              </div>
            ))}
            {channelConnections.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                No channel connections yet. Save one above to start manual OTA operations.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Sync Activity</h3>
          </div>
          <div className="space-y-3">
            {channelSyncLogs.map((log) => (
              <div key={log.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{titleCase(log.providerName)}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                      {log.syncType} • {log.direction}
                    </div>
                  </div>
                  <StatePill state={log.status} />
                </div>
                <div className="mt-3 text-sm text-slate-600">{log.payloadSummary}</div>
                {log.errorSummary ? <div className="mt-2 text-xs font-bold text-amber-700">{log.errorSummary}</div> : null}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{log.updatedAt}</div>
                  {(log.rawStatus === 'failed' || log.rawStatus === 'conflict') && log.connectionId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                      disabled={!organizationId || mutations.submitting}
                      onClick={() =>
                        void handleRetryChannelLog({
                          connectionId: log.connectionId,
                          providerName: log.providerName,
                          syncType: log.syncType,
                        })
                      }
                    >
                      Retry Sync
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {channelSyncLogs.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                Verification, sync pushes, failures, and retries will appear here as live channel history.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Listing Sync Command</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {liveListings.map((listing) => (
              <div key={listing.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{listing.title}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{listing.source}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{listing.slug}</div>
                  </div>
                  <StatePill state={listing.state} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {listing.sync}
                </div>
                <div className="mt-3 text-sm font-bold text-slate-800">{listing.inventory}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{listing.nightlyRate}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{listing.approvalStatus}</div>
                <div className="mt-1 text-xs text-slate-500">{listing.channels}</div>
                {listing.channelDistribution.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {listing.channelDistribution.map((channel) => (
                      <span
                        key={`${listing.id}-${channel.channel}`}
                        className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 ring-1 ring-slate-200"
                      >
                        {titleCase(channel.channel)} {channel.status}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-slate-800">
                  <span>{listing.metric}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] uppercase tracking-widest text-emerald-700">
                    {listing.dealBadge}
                  </span>
                </div>
                <Button
                  className="mt-4 h-9 rounded-xl bg-slate-950 px-4 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800"
                  disabled={!organizationId || !listing.propertyId || !listing.roomTypeId || mutations.submitting}
                  onClick={() => void handleRefreshListing(listing.id, listing.propertyId, listing.roomTypeId, listing.syncStatus)}
                  type="button"
                >
                  Refresh Availability
                </Button>
              </div>
            ))}
            {listings.map((listing) => (
              <div key={listing.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{listing.title}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{listing.source}</div>
                  </div>
                  <StatePill state={listing.state} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {listing.sync}
                </div>
                <div className="mt-3 text-sm font-bold text-slate-800">{listing.metric}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Direct Deals Desk</h3>
          </div>
          <div className="space-y-3">
            {deals.map((deal) => (
              <div key={deal.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{deal.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{deal.detail}</div>
                  </div>
                  <StatePill state={deal.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{deal.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Inventory Mapping</h3>
          </div>
          <div className="space-y-3">
            {mappingHealth.slice(0, 6).map((summary) => (
              <div
                key={`${summary.propertyId}-${summary.roomTypeId}`}
                className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{summary.propertyName}</div>
                    <div className="mt-1 text-xs text-slate-500">{summary.roomTypeName}</div>
                  </div>
                  <StatePill state={summary.readyState} />
                </div>
                <div className="mt-3 text-sm font-bold text-slate-800">
                  {summary.availableInventory}/{summary.totalInventory} rooms available
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                  {summary.occupancyRate}% occupied
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  {summary.channelTargets.length > 0
                    ? `${summary.channelTargets.map((target) => titleCase(target)).join(', ')} mapped`
                    : 'Tripetrip and direct web ready'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>{summary.housekeepingAttention} housekeeping alerts</span>
                  <span>{summary.failedSyncs} sync exceptions</span>
                  <span>{summary.pendingApproval} approvals open</span>
                </div>
                {summary.blockedProviders.length > 0 ? (
                  <div className="mt-2 text-xs font-bold text-amber-700">
                    Connection required: {summary.blockedProviders.map((provider) => titleCase(provider)).join(', ')}
                  </div>
                ) : null}
              </div>
            ))}
            {inventorySummaries.length === 0 && mappings.map((mapping) => (
              <div key={mapping.source} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{mapping.source}</div>
                    <div className="mt-1 text-xs text-slate-500">{mapping.target}</div>
                  </div>
                  <StatePill state={mapping.state} />
                </div>
                <div className="mt-3 text-sm font-bold text-slate-800">{mapping.health}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Conversion Health</h3>
          </div>
          <div className="space-y-3">
            {conversionSignals.map((signal) => (
              <div key={signal.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="text-sm font-black text-slate-950">{signal.title}</div>
                <div className="mt-3 text-2xl font-black text-slate-950">{signal.value}</div>
                <div className="mt-2 text-xs font-bold text-emerald-700">{signal.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">OTA Readiness Queue</h3>
          </div>
          <div className="space-y-3">
            {otaReadinessQueue.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                  </div>
                  <StatePill state={item.state} />
                </div>
              </div>
            ))}
            {otaReadinessQueue.length === 0
              ? publishingQueue.map((item) => (
                  <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-950">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                      </div>
                      <StatePill state={item.state} />
                    </div>
                  </div>
                ))
              : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {syncSignals.map(({ title, detail, icon: Icon }) => (
            <div key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-black text-slate-950">{title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
