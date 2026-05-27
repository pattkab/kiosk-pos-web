# Kiosk POS Web

A production-grade SaaS-style POS and inventory management web application rebuilt with Next.js 15, TypeScript, and Supabase.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database/Auth**: Supabase
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd kiosk_pos_web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### PWA & Offline Support

Kiosk POS is a fully capable Progressive Web App. 

#### Setup Icons:
To make the PWA fully functional with splash screens and icons, add the following files to `public/icons/`:
- `icon-192x192.png`
- `icon-512x512.png`
- `icon-maskable-192x192.png`

#### Features:
- **Offline Checkout**: Complete sales even with zero internet. Transactions are queued in IndexedDB.
- **Background Sync**: Automatic reconciliation once internet is restored.
- **IndexedDB Catalog**: Products and categories are cached locally for instant lookup.
- **Installable**: Add to Home Screen on iOS, Android, and Desktop.

#### Technical Implementation:
- **Serwist**: Service Worker management for Next.js 15.
- **IndexedDB**: Using a robust native implementation via `lib/storage/db.ts`.
- **Sync Engine**: Atomic RPC-based synchronization in `lib/offline/sync-engine.ts`.
- **Connectivity Monitoring**: Real-time network status tracking.

## Deployment

This application is ready to be deployed on **Vercel**.

1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Configure the environment variables in the Vercel dashboard.
4. Deploy!

## Multi-tenancy Support

The architecture is designed to support multi-tenancy. Organizations are handled via Supabase and can be integrated into the data fetching logic using the `organization_id` column in your PostgreSQL tables.

## Offline/PWA Support

To enable PWA features, you can use `next-pwa` or similar tools to configure a service worker.
