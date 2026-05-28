# Offline-first POS

Kiosk POS is an offline-first PWA for checkout in low-connectivity environments.

## What works offline

- POS checkout (queued locally, synced when online)
- Cart persistence across reload/power loss (localStorage + recovery banner)
- Product search and barcode lookup (IndexedDB catalog cache)
- Receipt preview/print with offline receipt numbers (`OFF-{REGISTER}-{YYYYMMDD}-{SEQUENCE}`)
- Manual and automatic sync via **Sync now** and `/pos/queue`

## Database migration

Apply Supabase migration for idempotent offline sales:

```bash
supabase db push
```

Migration: `20260528240000_offline_checkout_idempotency.sql` adds `client_sale_id`, optional receipt number on `process_checkout`, and duplicate-sale protection.

## Environment variables

No new environment variables. Ensure production build enables the service worker:

- `NEXT_WEBPACK_BUILD=1` or `npm run build` (uses webpack + Serwist)

## Testing offline mode

1. Sign in and open POS while online — catalog caches automatically.
2. Chrome DevTools → Network → **Offline**.
3. Complete a sale — confirm toast **Offline sale saved** and receipt shows pending sync.
4. Reload the page — cart recovery banner if cart had items; completed sales stay in queue.
5. Go **Online** — connectivity banner shows sync; open `/pos/queue` for details.
6. Retry the same queued sale (dev) — server returns existing sale id (idempotency).

## Known limitations

- Register open/close still requires network.
- Customer create/edit offline is not fully implemented.
- Reports only work offline for prefetched date ranges.
- Background Sync API is not used; foreground sync on reconnect only.
- Native IndexedDB (`lib/storage/db.ts`) is the canonical offline store (Dexie removed).
- Customer picker uses locally cached customers; create/edit offline customers is not implemented yet.
- Admin sync dashboard: **Settings → Offline sync** (`/settings/sync`).

## Recommended next steps

- Server-side batch sync API route
- Offline customer cache + merge
- Register session snapshot for offline open
- E2E Playwright offline scenario
- Wire structured logging (`lib/logger.ts`) into sync/checkout
