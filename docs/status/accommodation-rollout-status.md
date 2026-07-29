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
- Payment operations now include GST invoice capture, refund processing with folio/reservation resync, and a live night-audit desk for end-of-day finance review.
- Accommodation entitlement controls now cover reservation changes, rate-plan controls, refund controls, and night-audit visibility so launch can stay open now and switch to gated plans later without rewiring the vendor workflows.
- Marketplace inventory sync now includes admin approval routing, channel targets, per-channel distribution state, and admin publishing queue controls for accommodation vendors.
- OTA and channel foundations now include live channel connection records, sync activity logs, manual verification, and retryable push-sync workflows for accommodation vendors.
- Guest arrival operations now include reservation-linked document uploads, readiness tracking, and manual identity verification flows inside the PMS workspace.
- Guest arrival operations now include a live pre-check-in desk for ETA capture, arrival mode, and special-request intake stored against PMS reservations before front desk arrival.
- Team workspace now includes live shift planning, attendance state tracking, branch staffing coverage summaries, and staffing audit signals backed by vendor team member records.
- Analytics workspace now derives live occupancy, arrivals, folio settlement, collection watch, and branch reporting signals from PMS reservations, folio entries, and payment records.
- Analytics and PMS now include multi-property focus controls, portfolio rollups, and property-scoped operational filtering without splitting enterprise operations into a separate console.
- Marketplace and AI assistant now derive live OTA-readiness, sync-exception, collections, housekeeping, and approval-risk signals from PMS, accounting, and marketplace records instead of relying only on static placeholder operations cues.
- Analytics now includes deterministic forecasting and anomaly foundations for demand pressure, revenue gaps, and housekeeping load using live PMS, folio, payment, and housekeeping-task records.
- PMS booking controls now include room availability visibility, source-mix pulse, overlap prevention for assigned rooms, and occupancy-capacity checks before reservation creation.
- PMS booking controls now include an assignment desk that suggests clean, conflict-free rooms for unassigned arrivals and lets front desk teams auto-assign them in one step.
- PMS booking controls now include group-arrival visibility and a cancellation action that releases reserved inventory when no overlapping stays remain.
- PMS booking controls now include inline reservation change management from the arrivals desk, with overlap validation for assigned rooms before stay edits are saved.
- PMS booking controls now include a live booking rate desk with source-aware stay pricing, weekend mix logic, and reservation-linked rate-plan metadata persisted at booking time.
- PMS guest automation now includes real booking-confirmation and pre-arrival email payloads with reservation-aware messaging from the arrivals desk.
- PMS housekeeping automation now includes dispatch summaries, arrival-aware urgency, live owner assignment, and due-time routing from the housekeeping board.
- Production readiness now has an authenticated admin System panel with live launch-gate summaries, database table checks, optional integration warnings, and manual smoke-test guidance backed by the Worker readiness endpoint.

## In Progress

- Final live-environment validation after Cloudflare deployment: confirm `/api/readiness` returns `ready` or `ready_with_warnings` against production secrets and Supabase migrations.

## Next

- Deploy the latest committed Worker build, open Admin > System, and resolve any failed readiness checks before onboarding real users.
- Run the manual smoke-test list in Admin > System with one traveler account and one accommodation vendor account.

## Deferred

- Real OTA integrations
- External AI forecasting model training and third-party anomaly pipelines
- Digital key / kiosk / biometric integrations
- Multi-property CRS
- Hardware IoT room-state integration

## Notes / Risks

- Phase 1 should remain permissive by default so launch behavior does not regress.
- Worker routes and Supabase RLS now both enforce accommodation module visibility for Vendor OS writes, but capability-level approvals remain controlled by the app and Worker layer.
- Deferred advanced features remain documented as roadmap-backed external integrations, while internal readiness, adapter boundaries, and manual control loops are shipped and testable.
- Status file should be updated at each implementation checkpoint.
