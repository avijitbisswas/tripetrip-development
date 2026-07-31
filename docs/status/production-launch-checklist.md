# Production Launch Checklist

Use this checklist before opening the marketplace to unrestricted public users.

## Required Cloudflare Secrets

Set these in the Cloudflare Worker dashboard or with `wrangler secret put`:

- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF` or `SUPABASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `AUTH_OTP_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER`
- `NOMINATIM_BASE_URL`
- `MAP_STYLE_URL`
- `RAZORPAY_KEY_ID` or `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `MANUAL_PAYMENT_UPI_ID` or `TRIPETRIP_UPI_ID`

Recommended but not blocking public launch:

- `GEMINI_API_KEY`

## Required Supabase Migrations

Apply all migrations in `supabase/migrations` to production:

- `20260626150500_vendor_os_accommodation_rls.sql`
- `20260630134500_vendor_os_pms_core.sql`
- `20260630142000_vendor_os_payment_operations.sql`
- `20260731110000_payment_gateway_events.sql`

After migration, `/api/readiness` must show these tables as `pass`:

- `vendor_pms_reservations`
- `vendor_folio_entries`
- `vendor_payment_records`
- `vendor_housekeeping_tasks`
- `vendor_rooms`
- `vendor_room_types`
- `manual_payment_intents`
- `payment_gateway_events`
- `profiles`
- `vendor_profiles`
- `vendor_organizations`
- `vendor_properties`
- `messages`

## Verification Commands

Run locally before deployment:

```bash
npm run verify:release
```

Run after deployment:

```bash
curl https://tripetrip-development.avijit02biswas.workers.dev/api/health
curl https://tripetrip-development.avijit02biswas.workers.dev/api/config/health
curl https://tripetrip-development.avijit02biswas.workers.dev/api/readiness
```

Expected `/api/readiness` status:

- `ready`: safe to onboard users.
- `ready_with_warnings`: do not open unrestricted public launch until warnings are reviewed and accepted.
- `not_ready`: do not onboard users until failed checks are fixed.

## Manual Smoke Tests

- Register a traveler with email OTP.
- Register a vendor with email OTP.
- Log in as admin and confirm maintenance mode is off.
- Confirm vendor launch checklist passes before approving and activating the vendor.
- Create a vendor organization, property, room type, and room.
- Create a PMS reservation.
- Add a folio entry and record a payment.
- Create and complete a housekeeping task.
- Create a marketplace listing sync and verify approval flow.
- Open Analytics and confirm live operations, forecast, and collection signals populate.
- Create a community post as traveler and as vendor, verifying role separation.
- Create a Razorpay payment order with live credentials.
- Verify a Razorpay payment signature.
- Configure Razorpay webhook URL as `/api/payments/webhook/razorpay` and confirm an event appears in `payment_gateway_events`.
- Confirm public booking is blocked for inactive listings, unverified vendors, and over-capacity guest counts.
- Confirm listing publication is blocked until provider launch readiness passes.

## Still External To The App

These require third-party account setup or partner approval before they can be marked complete:

- Real OTA API adapters for Booking.com, Airbnb, Expedia, Agoda, or similar.
- Domain verification in Resend for the production sender domain.
- Production Nominatim/TileServer or managed map provider capacity.
- Digital key, kiosk, biometric, and IoT hardware integrations.
- External AI forecasting model training or third-party anomaly pipelines.
