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

- GitHub: source control only.
- Cloudflare Pages: the frontend build from Vite.
- Supabase: database, auth, storage, and any Supabase server functions.
- A Node host for `server.ts` if you need the current Express endpoints unchanged. Cloudflare Pages does not run that Node server directly.

### Cloudflare Pages setup

1. Push the repo to GitHub if it is not already there.
2. In Cloudflare, create a new Pages project and connect the GitHub repository.
3. Set the build command to `npm run build`.
4. Set the build output directory to `dist`.
5. Add environment variables in Cloudflare Pages for the frontend values only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Add any server-only secrets only to the runtime that executes `server.ts`, not to the browser build.
7. Deploy the project.

### Supabase setup

1. Keep your database, auth, and storage in Supabase.
2. Use the Supabase project URL and anon key in Cloudflare Pages.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` and database credentials private on the server side only.

### Environment files

- Keep local secrets in `.env.local`.
- Keep `.env.example` empty of real credentials and use it only as a template.
- Do not commit production secrets to GitHub.
