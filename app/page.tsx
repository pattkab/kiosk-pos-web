import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandTitle, PointOfSaleLabel } from "@/components/marketing/brand-title";
import { SiteHeader } from "@/components/marketing/site-header";
import { HomePageJsonLd } from "@/components/seo/home-page-json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { SITE_DESCRIPTION } from "@/lib/seo/site";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  CloudOff,
  Coffee,
  Home,
  Hotel,
  PackageSearch,
  Pill,
  ReceiptText,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  WalletCards,
  Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const verticals: { label: string; icon: LucideIcon }[] = [
  { label: "Shops", icon: Store },
  { label: "Supermarkets", icon: ShoppingCart },
  { label: "Bars", icon: Wine },
  { label: "Restaurants", icon: UtensilsCrossed },
  { label: "Cafés", icon: Coffee },
  { label: "Hotels", icon: Hotel },
  { label: "BnB & rentals", icon: Home },
  { label: "Salons", icon: Scissors },
  { label: "Pharmacies", icon: Pill },
  { label: "Boutiques", icon: ShoppingBag },
];

const features = [
  {
    title: "Fast Point of Sale checkout",
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
    title: "Multi-branch management",
    description:
      "Manage supermarkets, hotels, bars, and rental properties together with consolidated analytics and quick switching.",
    icon: Building2,
    tone: "text-violet-600",
  },
  {
    title: "Offline-first resilience",
    description:
      "Keep selling when power or internet drops — cached catalog, local queue, sync when you are back online.",
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
      "Give owners, admins, managers, and cashiers the right access for checkout, inventory, reports, and settings.",
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
  ["24/7", "offline Point of Sale"],
] as const;

const faqs = [
  {
    question: "What is Kiosk POS?",
    answer:
      "Kiosk POS is Point of Sale and inventory software for retail and hospitality. It covers checkout, stock, reports, register sessions, and offline selling when connectivity is poor.",
  },
  {
    question: "Does it work without internet?",
    answer:
      "Yes. Sales, receipts, and product lookup continue offline. Transactions sync automatically when your connection returns.",
  },
  {
    question: "Can I use mobile money at checkout?",
    answer:
      "Yes. Kiosk POS supports Yo Payments for MTN Mobile Money, Airtel Money, and card collections where your merchant account allows it.",
  },
];

export const metadata = createPageMetadata({
  title:
    "Point of Sale Software for Shops, Supermarkets, Restaurants & Hotels",
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function LandingPage() {
  return (
    <>
      <HomePageJsonLd />
      <SiteHeader />
      <main className="min-h-screen bg-background text-foreground">
      <section
        className="relative min-h-[90vh] overflow-hidden bg-neutral-950 text-white"
        aria-labelledby="hero-heading"
      >
        <Image
          src="/kiosk-pos-enterprise-hero.png"
          alt="Kiosk POS Point of Sale dashboard on a checkout counter"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/88 to-neutral-950/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_10%_20%,rgba(16,185,129,0.12),transparent_55%)]" />

        <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-md">
              <span className="font-bold text-emerald-300">Point of Sale</span>
              <span className="text-white/40">·</span>
              <span>inventory · alerts · reports · branches</span>
            </p>

            <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-300/80">
              Point of Sale software
            </p>
            <h1
              id="hero-heading"
              className="mt-2 text-5xl font-extrabold tracking-tight lg:text-7xl"
            >
              <BrandTitle as="span" />
            </h1>
            <p className="mt-3 text-xl font-medium text-white/90 lg:text-2xl">
              <PointOfSaleLabel className="text-emerald-300" />
              <span className="text-white/50"> — sell, stock, and report from one calm workspace.</span>
            </p>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Whether you run a corner shop, a busy supermarket, a bar tab, a
              restaurant floor, or guest-house rentals —{" "}
              <strong className="font-semibold text-white">
                checkout stays fast
              </strong>{" "}
              and your team always knows what sold and what is left on the shelf.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base font-bold">
                <Link href="/login?mode=create">
                  Start free — create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-white/30 bg-white/10 px-6 text-base font-semibold text-white hover:bg-white hover:text-neutral-950"
              >
                <Link href="/login">Sign in to your Point of Sale</Link>
              </Button>
            </div>
          </div>

          <div className="mt-12">
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/50">
              Built for counters like yours
            </p>
            <div className="flex flex-wrap gap-2">
              {verticals.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm transition-colors hover:border-emerald-400/30 hover:bg-emerald-500/10"
                >
                  <Icon className="h-4 w-4 text-emerald-300" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-12 grid max-w-4xl gap-3 sm:grid-cols-3">
            {enterpriseStats.map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.14] bg-white/[0.08] p-4 backdrop-blur-md"
              >
                <div className="text-2xl font-bold text-emerald-300">{value}</div>
                <div className="mt-1 text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-b bg-muted/25 px-4 py-12 sm:px-6 lg:px-8"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
              Point of Sale + back office
            </p>
            <h2
              id="features-heading"
              className="mt-2 text-3xl font-bold tracking-tight"
            >
              Everything <BrandTitle className="text-3xl" /> does from the counter
              to the stock room
            </h2>
            <p className="mt-3 text-muted-foreground">
              One system for selling at the register, controlling inventory,
              reconciling cash, alerting managers, and seeing profit — whether
              you operate one shop or many branches.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="rounded-xl">
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

      <section
        id="industries"
        className="px-4 py-14 sm:px-6 lg:px-8"
        aria-labelledby="industries-heading"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Multi-location Point of Sale
            </p>
            <h2
              id="industries-heading"
              className="mt-3 text-3xl font-bold tracking-tight"
            >
              Supermarkets, bars, hotels & rentals — one view
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Owners compare branch revenue, gross profit, sales volume, and
              low-stock exposure from a single dashboard, then jump into the
              location that needs attention — shop floor, bar, or front desk.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Retail", "Hospitality", "Food & drink", "Services"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="grid grid-cols-4 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Branch</span>
              <span>Revenue</span>
              <span>Gross profit</span>
              <span>Alerts</span>
            </div>
            {[
              ["Central Supermarket", "$18,420", "$6,310", "2"],
              ["Riverside Bar", "$11,870", "$3,940", "1"],
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

      <section
        id="faq"
        className="border-t bg-background px-4 py-14 sm:px-6 lg:px-8"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="text-3xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Quick answers about Point of Sale, offline mode, and payments in
            Kiosk POS.
          </p>
          <dl className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-lg font-semibold">{faq.question}</dt>
                <dd className="mt-2 leading-7 text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="border-t bg-neutral-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
              Point of Sale that grows with you
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Ready when the next customer walks in.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/65">
              Start with checkout and inventory on day one, then add branch
              analytics, stock alerts, permissions, and profit reporting as you
              scale from shop to supermarket to multi-site group.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login?mode=create">Create account</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
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
      </footer>
    </main>
    </>
  );
}
