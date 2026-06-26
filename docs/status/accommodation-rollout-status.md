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
- Vendor OS create, update, delete, and document-upload flows now perform Worker-backed accommodation authorization before client-side Supabase writes.

## In Progress

- Verification, polish, and test stabilization for phase-one accommodation rollout.

## Next

- Move Vendor OS write paths behind Worker or RLS-backed enforcement for stronger server-side guarantees beyond app-level hook guards.

## Deferred

- Real OTA integrations
- AI forecasting and anomaly detection
- Digital key / kiosk / biometric integrations
- Multi-property CRS
- Predictive housekeeping and IoT room-state integration

## Notes / Risks

- Phase 1 should remain permissive by default so launch behavior does not regress.
- Current write enforcement is app-layer protection through shared hooks; direct Supabase writes outside the app still need server-side or RLS enforcement in a later phase.
- Deferred advanced features must remain documented as roadmap-backed, not falsely shipped.
- Status file should be updated at each implementation checkpoint.
