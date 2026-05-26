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

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components and layouts.
- `lib/`: Utility functions and shared library configurations (Supabase, etc.).
- `hooks/`: Custom React hooks.
- `store/`: Zustand stores for global state.
- `types/`: TypeScript definitions.
- `validators/`: Zod schemas for form validation.
- `providers/`: React Context providers (Query, Theme, etc.).
- `features/`: Module-specific components and logic.

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
