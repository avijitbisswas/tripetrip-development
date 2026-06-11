# Tripetrip

Tripetrip is a direct travel marketplace for stays, adventures, transport, tours, and food experiences.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Cloudinary values if testing uploads
   - Resend values if testing email

3. Run the app:

   ```bash
   npm run dev
   ```

4. Verify:

   ```bash
   npm run lint
   npm run test
   npm run build
   ```

## Architecture

The frontend is Vite and React. Supabase handles auth and data. Cloudinary handles media uploads and delivery. Resend is used through server-only email endpoints.

## Deployment

Use these hosting targets:

- GitHub: source control and CI/CD.
- Cloudflare Workers: serves the Vite frontend assets and handles `/api/*` routes.
- Supabase: database, auth, and storage.

The production runtime is `worker/index.ts`. The local Node/Express server in `server.ts` remains useful for local development, but production deploys use Cloudflare Workers instead of Cloudflare Pages.

### Cloudflare Workers setup

1. Push the repo to GitHub if it is not already there.
2. In Cloudflare, create or use the Worker named `tripetrip-development`.
3. Configure Worker runtime variables/secrets in Cloudflare:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_UPLOAD_FOLDER`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `MANUAL_PAYMENT_UPI_ID`
4. Deploy with:

   ```bash
   npm run cf:deploy
   ```

### Supabase setup

1. Keep your database, auth, and storage in Supabase.
2. Use the Supabase project URL and anon key for browser Supabase access.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` as a Cloudflare Worker secret only.

### GitHub Actions deploy

1. In GitHub repo Settings > Secrets > Actions, add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `APP_URL`
2. Push to `master`.
3. GitHub Actions will build the app and run `wrangler deploy`.

Server-only runtime secrets such as `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, and `GEMINI_API_KEY` should be stored as Worker secrets in Cloudflare, not as browser build variables.
