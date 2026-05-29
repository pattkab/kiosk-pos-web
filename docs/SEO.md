# SEO setup

Kiosk POS uses Next.js App Router metadata, `robots.txt`, `sitemap.xml`, and JSON-LD structured data.

## Public pages (indexed)

- `/` — marketing homepage (SoftwareApplication, FAQ, Organization schema)
- `/privacy`
- `/terms`

## Noindex (app shell)

Login, dashboard, POS, settings, and API routes are blocked in `app/robots.ts` and excluded from the sitemap.

## Configuration

- Site URL: `NEXT_PUBLIC_APP_URL` (production: `https://kioskpos.shop`)
- Shared helpers: `lib/seo/metadata.ts`, `lib/seo/site.ts`
- OG image: `/kiosk-pos-enterprise-hero.png`

## After deploy

1. Submit `https://kioskpos.shop/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
2. Request indexing for the homepage.
3. Add real social profiles to Organization schema when available.
4. Publish blog or help content later and add URLs to `PUBLIC_ROUTES` in `lib/seo/site.ts`.
