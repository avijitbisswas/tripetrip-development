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

## In Progress

- Verification, polish, and test stabilization for phase-one accommodation rollout.

## Next

- Apply the updated `supabase_schema.sql` to the live Supabase project so direct database writes inherit the new accommodation-aware RLS policies in production.

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
