# Tripetrip Google Removal and Supabase Architecture Design

## Context

Tripetrip was imported from Google AI Studio and currently contains AI Studio metadata, Gemini API wiring, Firebase Auth, Firestore data access, Firebase config, and Firebase rules. The app also already includes a Supabase schema draft, Cloudinary and Razorpay dependencies, a Vite/React frontend, and an Express dev/production server.

The goal is to remove all Google-related application dependencies while keeping the existing product content, pages, and visual direction intact. The new foundation should be easier to scale as traffic grows.

## Recommended Approach

Use a Supabase-first modular architecture while keeping the existing Vite/React app for the first cleanup pass.

Supabase will become the source of truth for auth, profiles, vendors, listings, bookings, reviews, and messages. Cloudinary will handle media delivery and signed uploads. Resend will be introduced behind an email service boundary for transactional email and future auth-related messaging. Cloudflare Pages will host the static frontend, with server-only endpoints designed so they can move to Cloudflare Functions or Workers later.

This avoids a large framework rewrite while still creating clean service boundaries for future scale.

## Scope

Remove:

- Google AI Studio README/banner/metadata/config references.
- Gemini client and server endpoints.
- `@google/genai`.
- Firebase client SDK usage.
- Firebase config, Firestore rules, and Firebase-specific applet files.
- Google OAuth sign-in UI and provider usage for now.

Keep:

- Existing user-facing content and main page structure.
- Current Vite/React frontend.
- Current UI component library and styling foundation.
- Existing Razorpay payment intent concept, moved behind a cleaner API boundary if touched.

Add or refactor:

- Supabase client setup and environment variables.
- Service modules for auth, profiles, vendors, listings, bookings, media, and email.
- Updated Supabase schema and RLS policies matching the current app data shape.
- Cloudinary signed upload endpoint.
- Resend service boundary for future email flows.
- Cloudflare-ready production build/deployment notes.

## Architecture

Frontend pages should not import backend SDKs directly. They should call typed service functions.

Recommended layout:

- `src/lib/supabase`: Supabase browser client and shared types.
- `src/services/auth`: sign in, sign up, sign out, current session, auth state subscription.
- `src/services/profiles`: profile reads/writes and role lookup.
- `src/services/vendors`: vendor profile reads/writes and public vendor lookup by slug.
- `src/services/listings`: listing list/detail/create/update flows with pagination.
- `src/services/bookings`: traveler and vendor booking queries.
- `src/services/media`: Cloudinary upload signing and upload helpers.
- `src/services/email`: frontend-safe calls to backend email endpoints where needed.
- `server.ts`: local dev server and small server-only API endpoints until Cloudflare Functions are introduced.

## Data Flow

Auth:

1. User signs in or registers with Supabase email/password.
2. Supabase creates or resolves the user session.
3. App fetches the profile row to determine role.
4. Protected routes check the session and role.

Listings:

1. Public search pages call `listListings` with filters, cursor/page, and limit.
2. Supabase returns only active listings allowed by RLS.
3. Detail pages call `getListingById`.
4. Vendor pages call vendor-scoped service methods that rely on RLS and indexed queries.

Media:

1. UI requests a Cloudinary signature from a server-only endpoint.
2. Browser uploads directly to Cloudinary.
3. The returned asset URL is saved in Supabase.

Email:

1. App calls a server-only endpoint for transactional email.
2. The endpoint validates input and sends through Resend.
3. No Resend secret is exposed to the browser.

## Database Design

The existing `supabase_schema.sql` should be updated to include current app needs:

- `profiles`: role, full name, avatar, phone, timestamps.
- `vendor_profiles`: business name, business type, slug, email, phone, description, website, logo, banner, social links, address, geolocation, verification fields.
- `listings`: vendor, title, description, category, price fields, capacity, images, amenities, location, coordinates, flexible `specifics`, active flag, timestamps.
- `availability`: listing/date/slots/custom price.
- `bookings`: listing, traveler, vendor, dates, guests, price, booking status, payment status, Razorpay references.
- `reviews`: listing/vendor/reviewer ratings and responses.
- `messages`: simple notification/message foundation.

Important indexes:

- Active listings by category and created date.
- Listings by vendor.
- Vendor profiles by user and slug.
- Bookings by traveler and vendor.
- Availability by listing/date.

RLS should allow public reads for active public marketplace data, owner-only writes for profiles/vendors/listings/bookings, and admin-only moderation paths when admin support is added.

## Performance and Scale

The first implementation pass should address avoidable bottlenecks:

- Use paginated listing queries instead of reading whole collections.
- Keep database filters aligned with indexes.
- Use route-level lazy loading for heavier dashboard and listing manager pages.
- Serve images through Cloudinary transformations with stable dimensions.
- Avoid loading map libraries until map view is opened.
- Keep AI and optional integrations behind provider interfaces so unused code does not inflate the main bundle.
- Centralize loading and error handling so retries and observability can be added later.

Future scale path:

- Move server-only endpoints to Cloudflare Functions or Workers.
- Add edge caching for public listing/vendor pages where appropriate.
- Add search infrastructure only after real query patterns justify it.
- Add job queues for email, media processing, and analytics if traffic requires it.

## Error Handling

Service functions should return clear errors or throw normalized application errors. UI pages should show user-friendly messages through existing toast and loading states. Server-only endpoints should validate request bodies, avoid leaking provider secrets, and return stable JSON error shapes.

## Testing and Verification

Initial verification:

- `npm run lint`
- `npm run build`
- Start local dev server and smoke-test core routes.

Core flows to smoke-test:

- Home and search render without Google/Firebase dependencies.
- Register and login use Supabase.
- Protected dashboard routes redirect correctly.
- Public listing and vendor pages load from Supabase services.
- Vendor listing create/edit paths call Supabase services.
- Cloudinary signing endpoint fails safely without secrets and works when configured.

## Non-Goals

- No full rewrite to Next.js, Remix, or another framework in this pass.
- No advanced AI assistant replacement in this pass.
- No production-grade search engine integration until the base Supabase migration is stable.
- No payment completion workflow unless explicitly requested after the architecture cleanup.

## Git Policy

Local commits may be created as part of the workflow. Any `git push` must be explicitly approved by the user before it is run.
