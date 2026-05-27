# Kiosk POS Deployment & Release Guide

## 1. Vercel Deployment

### Environment Variables
Ensure the following variables are set in the Vercel Dashboard:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | **(SECRET)** Required for administrative tasks. Never expose to client. |
| `NEXT_PUBLIC_APP_URL` | The production URL of your app (e.g., `https://pos.yourdomain.com`) |
| `DATABASE_URL` | Transaction pooler connection string for Supabase migrations. |

### Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

---

## 2. Supabase Production Hardening

### Authentication
- [ ] Go to **Authentication > Providers** and disable "Confirm Email" if using Magic Links only, OR ensure SMTP is configured.
- [ ] Set **Site URL** to your production domain.
- [ ] Add `http://localhost:3000/**` and `https://your-production-domain.com/**` to **Redirect URLs**.

### Database Security
- [ ] Verify all tables have **Row Level Security (RLS)** enabled.
- [ ] Run `supabase db push` to ensure production schema matches local.
- [ ] Enable **Point-in-Time Recovery (PITR)** if on a Pro plan.

### Storage
- [ ] Ensure the `product-images` bucket is private and only accessible via RLS policies.

---

## 3. Security Headers
The application is pre-configured with the following headers in `next.config.ts`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security`

---

## 4. Backup & Disaster Recovery
1. **Daily Backups**: Supabase performs daily backups automatically.
2. **Manual Export**: Use the "Export CSV" functionality in the Inventory module for critical stock data.
3. **Offline Recovery**: In case of a sync failure, use the **Offline Queue** UI to manually retry or resolve conflicts.

---

## 5. Release Checklist
- [ ] **Typecheck**: Run `npx tsc --noEmit`
- [ ] **Lint**: Run `npm run lint`
- [ ] **Tests**: Run `npm run test:unit` and `npm run test:e2e`
- [ ] **Build**: Run `npm run build` locally first to verify no production errors.
- [ ] **Environment**: Validate all production keys are present in `.env.local` for testing.
- [ ] **PWA**: Verify the manifest loads and service worker registers on the preview URL.
