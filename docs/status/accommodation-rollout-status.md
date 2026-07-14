# Accommodation Rollout Status

## Done

- Design approved for accommodation provider family rollout.
- Control model defined for provider family, plan tiers, capability wall, and approval wall.
- Documentation strategy defined for spec, plan, and delivery-status tracking.
- Accommodation access domain model added in Vendor OS code.
- Worker-backed accommodation access endpoints added for admin and vendor use.
- Admin console accommodation controls added for plan tier, enforcement mode, module overrides, and approval policies.
- Vendor OS tenant access now filters modules for accommodation providers.
- Vendor OS shared mutation hooks now block creates, updates, deletes, and document uploads for modules disabled by accommodation access policy.
- PMS, calendar, marketplace, and analytics workspaces now surface accommodation plan, capability, and approval guidance directly in the vendor UI.
- CRM, inbox, accounting, and settings workspaces now surface accommodation plan, capability, and approval guidance directly in the vendor UI.
- Team, documents, and subscriptions workspaces now surface accommodation plan, capability, and approval guidance directly in the vendor UI.
- Admin accommodation controls now support capability-level overrides in addition to plan tier, module visibility, and approval policies.
- Admin accommodation saves now preserve existing override state when only one part of the access policy is updated.
- Vendor OS create, update, and delete flows now execute through Worker-backed mutation routes with accommodation access enforcement and tenant scoping.
- Vendor document uploads still use direct storage upload, but the metadata record creation path now runs through the Worker-backed Vendor OS mutation route.
- Supabase schema now includes accommodation-aware RLS write checks for Vendor OS operational tables, matching the Worker and app-layer module enforcement for direct database writes.
- PMS Core slice now includes real schema and Worker/API plumbing for PMS reservations and folio entries.
- PMS workspace now supports live room type, room, reservation, housekeeping task, and folio entry creation against dedicated PMS resources.
- PMS arrivals, housekeeping, folio panels, and operational metrics now derive from live PMS records instead of relying only on static demo arrays.
- Payment operations slice now includes vendor payment record schema, Worker/API plumbing, and a live accounting settlement desk for reservation-linked payment capture.
- Payment operations now include finance-side approval and rejection controls for pending manual payments, with folio and reservation balance sync when approvals close or reopen billing.
- Marketplace inventory sync now includes admin approval routing, channel targets, per-channel distribution state, and admin publishing queue controls for accommodation vendors.
- OTA and channel foundations now include live channel connection records, sync activity logs, manual verification, and retryable push-sync workflows for accommodation vendors.
- Guest arrival operations now include reservation-linked document uploads, readiness tracking, and manual identity verification flows inside the PMS workspace.
- Guest arrival operations now include a live pre-check-in desk for ETA capture, arrival mode, and special-request intake stored against PMS reservations before front desk arrival.
- Team workspace now includes live shift planning, attendance state tracking, branch staffing coverage summaries, and staffing audit signals backed by vendor team member records.
- Analytics workspace now derives live occupancy, arrivals, folio settlement, collection watch, and branch reporting signals from PMS reservations, folio entries, and payment records.
- PMS booking controls now include room availability visibility, source-mix pulse, overlap prevention for assigned rooms, and occupancy-capacity checks before reservation creation.
- PMS booking controls now include an assignment desk that suggests clean, conflict-free rooms for unassigned arrivals and lets front desk teams auto-assign them in one step.
- PMS guest automation now includes real booking-confirmation and pre-arrival email payloads with reservation-aware messaging from the arrivals desk.
- PMS housekeeping automation now includes dispatch summaries, arrival-aware urgency, live owner assignment, and due-time routing from the housekeeping board.

## In Progress

- Accommodation operations expansion beyond arrival foundations: deeper guest engagement, booking depth, and payment-wall-ready controls beyond live front-desk and finance flows.

## Next

- Apply the latest PMS migration to the live Supabase project so `vendor_pms_reservations` and `vendor_folio_entries` exist in production before relying on the deployed PMS workspace.
- Apply the payment operations migration so `vendor_payment_records` exists in production before deploying the new settlement desk.
- Extend the accommodation stack into deeper guest engagement and payment-wall-ready controls on top of the completed PMS, payments, marketplace, channel, arrival, staff-control, reporting, booking-control, assignment-desk, transactional-email, and housekeeping-dispatch foundations.

## Deferred

- Real OTA integrations
- AI forecasting and anomaly detection
- Digital key / kiosk / biometric integrations
- Multi-property CRS
- Predictive housekeeping and IoT room-state integration

## Notes / Risks

- Phase 1 should remain permissive by default so launch behavior does not regress.
- Worker routes and Supabase RLS now both enforce accommodation module visibility for Vendor OS writes, but capability-level approvals remain controlled by the app and Worker layer.
- Deferred advanced features must remain documented as roadmap-backed, not falsely shipped.
- Status file should be updated at each implementation checkpoint.
