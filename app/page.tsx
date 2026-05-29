import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  CloudOff,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  WalletCards,
} from "lucide-react";

const features = [
  {
    title: "Fast POS checkout",
    description:
      "Run counter sales, split payments, register sessions, receipts, and cashier workflows from one clean surface.",
    icon: ShoppingCart,
    tone: "text-sky-600",
  },
  {
    title: "Inventory control",
    description:
      "Track stock levels, barcode lookup, low-stock thresholds, expiry exposure, and item movement history.",
    icon: PackageSearch,
    tone: "text-emerald-600",
  },
  {
    title: "Gross profit analytics",
    description:
      "See revenue, product cost, margins, payment mix, cashier contribution, and profit trends without exporting first.",
    icon: WalletCards,
    tone: "text-amber-600",
  },
  {
    title: "Stock-taking alerts",
    description:
      "Schedule recurring shelf-count reminders so inventory reconciliation becomes part of normal operations.",
    icon: BellRing,
    tone: "text-rose-600",
  },
  {
    title: "Business enterprise management",
    description:
      "Manage multiple businesses or branches together with consolidated analytics and quick branch switching.",
    icon: Building2,
    tone: "text-violet-600",
  },
  {
    title: "Offline-first resilience",
    description:
      "Keep selling with cached catalog data, local queues, conflict handling, and sync status visibility.",
    icon: CloudOff,
    tone: "text-cyan-600",
  },
  {
    title: "Reports and exports",
    description:
      "Review sales, products, inventory value, profit, payments, registers, and cashier reports by date range.",
    icon: BarChart3,
    tone: "text-lime-700",
  },
  {
    title: "Role-based controls",
    description:
      "Give owners, admins, managers, and cashiers the right access for POS, inventory, reports, and settings.",
    icon: ShieldCheck,
    tone: "text-indigo-600",
  },
  {
    title: "Receipts and branding",
    description:
      "Configure receipt copy, notes, organization details, appearance colors, and customer-facing polish.",
    icon: ReceiptText,
    tone: "text-orange-600",
  },
];

const enterpriseStats = [
  ["4", "branch analytics views"],
  ["9", "reporting modules"],
  ["24/7", "offline sales continuity"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative min-h-[86vh] overflow-hidden bg-neutral-950 text-white">
        <Image
          src="/kiosk-pos-enterprise-hero.png"
          alt="Kiosk POS analytics dashboard on a checkout counter"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/82 to-neutral-950/18" />
        <div className="relative z-10 mx-auto flex min-h-[86vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white/85 backdrop-blur">
              POS, inventory, alerts, reports, and branches in one workspace
            </p>
            <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
              Kiosk POS
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/78">
              A serious operating system for shops, restaurants, hotels, BnBs,
              salons, pharmacies, and growing multi-branch teams.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-neutral-950"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 grid max-w-3xl gap-3 sm:grid-cols-3">
            {enterpriseStats.map(([value, label]) => (
              <div
                key={label}
                className="rounded-md border border-white/[0.14] bg-white/[0.08] p-4 backdrop-blur"
              >
                <div className="text-2xl font-bold">{value}</div>
                <div className="mt-1 text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/25 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything Kiosk POS can do for the front counter and the back
              office
            </h2>
            <p className="mt-3 text-muted-foreground">
              The same system handles selling, stock, reconciliation, reporting,
              notifications, user permissions, and enterprise visibility.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="rounded-md">
                  <CardContent className="p-5">
                    <Icon className={`h-6 w-6 ${feature.tone}`} />
                    <h3 className="mt-4 font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Enterprise management
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              See every business and branch together
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Owners can compare branch revenue, gross profit, sales volume, and
              low-stock exposure from a single dashboard, then switch into the
              branch that needs attention.
            </p>
          </div>

          <div className="overflow-hidden rounded-md border bg-card shadow-sm">
            <div className="grid grid-cols-4 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Branch</span>
              <span>Revenue</span>
              <span>Gross profit</span>
              <span>Alerts</span>
            </div>
            {[
              ["Central Shop", "$18,420", "$6,310", "2"],
              ["Airport Kiosk", "$11,870", "$3,940", "1"],
              ["BnB Suites", "$9,640", "$5,480", "0"],
            ].map(([branch, revenue, profit, alerts]) => (
              <div
                key={branch}
                className="grid grid-cols-4 gap-3 border-b px-4 py-4 text-sm last:border-b-0"
              >
                <span className="font-medium">{branch}</span>
                <span>{revenue}</span>
                <span>{profit}</span>
                <span>{alerts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-neutral-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Build the operating rhythm your business deserves.
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Start with checkout and inventory, then grow into branch
              analytics, alerts, permissions, and profit reporting.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/register">Create account</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white hover:text-neutral-950"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl gap-3 text-sm text-white/55">
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <span>/</span>
          <Link href="/terms" className="hover:text-white">
            Terms and Conditions
          </Link>
        </div>
      </section>
    </main>
  );
}
