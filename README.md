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
