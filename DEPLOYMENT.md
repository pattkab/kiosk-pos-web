# Kiosk POS Deployment & Release Guide

## 1. Vercel Deployment

### Environment Variables

Ensure the following variables are set in the Vercel Dashboard:

| Variable                        | Description                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                                                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key                                                                      |
| `SUPABASE_SERVICE_ROLE_KEY`     | **(SECRET)** Required for administrative tasks. Never expose to client.                          |
| `NEXT_PUBLIC_APP_URL`           | The canonical production URL of your app. For this deployment use `https://kioskpos.shop`.       |
| `DATABASE_URL`                  | Transaction pooler connection string for Supabase migrations.                                    |
| `RESEND_API_KEY`                | **(SECRET)** API key for invitation email delivery.                                              |
| `RESEND_FROM_EMAIL`             | Verified sender, e.g. `Kiosk POS <noreply@yourdomain.com>`.                                      |
| `STRIPE_SECRET_KEY`             | **(SECRET)** Stripe server key for Checkout + Billing Portal.                                    |
| `STRIPE_WEBHOOK_SECRET`         | **(SECRET)** Stripe webhook signing secret.                                                      |
| `STRIPE_PRICE_STARTER_MONTHLY`  | Optional Stripe monthly Price ID for the Starter tier. If omitted, Checkout uses inline pricing. |
| `STRIPE_PRICE_STARTER_YEARLY`   | Optional Stripe yearly Price ID for the Starter tier. If omitted, Checkout uses inline pricing.  |
| `STRIPE_PRICE_GROWTH_MONTHLY`   | Optional Stripe monthly Price ID for the Growth tier. If omitted, Checkout uses inline pricing.  |
| `STRIPE_PRICE_GROWTH_YEARLY`    | Optional Stripe yearly Price ID for the Growth tier. If omitted, Checkout uses inline pricing.   |
| `STRIPE_PRICE_PRO_MONTHLY`      | Optional Stripe monthly Price ID for the Pro tier. If omitted, Checkout uses inline pricing.     |
| `STRIPE_PRICE_PRO_YEARLY`       | Optional Stripe yearly Price ID for the Pro tier. If omitted, Checkout uses inline pricing.      |

### Stripe Pricing Tiers

The app ships with inline fallback pricing if Stripe Price IDs are not configured:

| Tier    | Monthly | Yearly | Primary gated features                                               |
| ------- | ------- | ------ | -------------------------------------------------------------------- |
| Starter | `$19`   | `$190` | POS checkout, inventory, receipts, and basic dashboard.              |
| Growth  | `$49`   | `$490` | Reports, team management, offline queue, and notifications.          |
| Pro     | `$99`   | `$990` | Branding, appearance controls, audit logs, and advanced permissions. |

### Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

---

## 2. Supabase Production Hardening

### Authentication

- [ ] Go to **Authentication > Providers** and disable "Confirm Email" if using Magic Links only, OR ensure SMTP is configured.
- [ ] Set **Site URL** to `https://kioskpos.shop`.
- [ ] Add `https://kioskpos.shop/**`, `http://localhost:3000/**`, and `kioskpos://auth/callback` (Android native app) to **Redirect URLs**.

### Google sign-in (OAuth)

- [ ] In **Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0 Client, set **Authorized redirect URI** to:
  - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
- [ ] In **Supabase** → Authentication → Providers → **Google**, paste the same client’s **Client ID** and **Client Secret**.
- [ ] Ensure production **Redirect URLs** include `https://kioskpos.shop/**`; the app callback path is `/auth/callback`.
- [ ] Set `NEXT_PUBLIC_APP_URL` in Vercel to `https://kioskpos.shop`.
- [ ] Remove `http://localhost:3000` from production **Site URL**. Keep localhost only in **Redirect URLs** for local development.
- [ ] If sign-in fails with _Unable to exchange external code_, the Google client secret in Supabase does not match Google Cloud, the Supabase callback URI above is missing in Google, or Supabase is still using a localhost Site URL.

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
