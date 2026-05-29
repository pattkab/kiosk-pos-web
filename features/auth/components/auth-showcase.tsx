"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CloudOff,
  LockKeyhole,
  ReceiptText,
  Sparkles,
  Store,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "create";

const highlights = {
  signin: {
    eyebrow: "Stock · sell · report",
    title: "Open the right workspace and keep the day moving.",
    description:
      "Fast checkout, register controls, inventory alerts, and daily reporting in one calm workspace built for real shops.",
  },
  create: {
    eyebrow: "Start in minutes",
    title: "Set up your store before the first sale.",
    description:
      "Create your profile, verify email, then walk through organization setup, products, staff roles, and checkout.",
  },
};

export function AuthShowcase({ mode }: { mode: AuthMode }) {
  const copy = highlights[mode];

  return (
    <div className="relative hidden overflow-hidden bg-[#0a0c12] text-white lg:flex lg:flex-col">
      <Image
        src="/kiosk-pos-enterprise-hero.png"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-35"
        sizes="60vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c12] via-[#0a0c12]/92 to-[#0f172a]/88" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(56,189,248,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_90%_100%,rgba(16,185,129,0.14),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(#ffffff08_1px,transparent_1px),linear-gradient(90deg,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(180deg,black,transparent)]" />

      <div className="relative flex min-h-dvh flex-col justify-between p-10 xl:p-12">
        <Link
          href="/"
          className="group flex w-fit items-center gap-3 text-lg font-black tracking-tight"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0a0c12] shadow-lg shadow-black/30 transition-transform group-hover:scale-105">
            K
          </span>
          <span>Kiosk POS</span>
        </Link>

        <div className="grid max-w-2xl gap-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/25">
              <Store className="h-7 w-7 text-emerald-200" />
            </div>
            <h1
              className={cn(
                "text-4xl font-black leading-[1.08] tracking-tight transition-opacity duration-500 xl:text-5xl",
              )}
              key={mode}
            >
              {copy.title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300/95 xl:text-lg">
              {copy.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Today&apos;s sales
                  </p>
                  <p className="mt-1 text-3xl font-black tabular-nums">
                    UGX 2.84M
                  </p>
                  <p className="mt-1 text-sm text-emerald-300">+12% vs yesterday</p>
                </div>
                <BarChart3 className="h-8 w-8 shrink-0 text-sky-300" />
              </div>
              <div className="mt-5 flex items-end gap-1.5">
                {[28, 44, 38, 62, 54, 78, 70, 84].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500/40 to-emerald-300"
                    style={{ height }}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15">
                    <WifiOff className="h-5 w-5 text-sky-200" />
                  </div>
                  <div>
                    <p className="font-bold">Offline sales queued</p>
                    <p className="text-sm text-slate-400">
                      3 receipts waiting to sync
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15">
                    <ReceiptText className="h-5 w-5 text-amber-200" />
                  </div>
                  <div>
                    <p className="font-bold">Register session open</p>
                    <p className="text-sm text-slate-400">
                      Cash accountability intact
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="grid gap-3 text-sm text-slate-300">
          <li className="flex items-center gap-3">
            <LockKeyhole className="h-4 w-4 shrink-0 text-emerald-300" />
            Role-aware access for every workspace
          </li>
          <li className="flex items-center gap-3">
            <Building2 className="h-4 w-4 shrink-0 text-emerald-300" />
            Switch organizations after sign-in
          </li>
          <li className="flex items-center gap-3">
            <CloudOff className="h-4 w-4 shrink-0 text-emerald-300" />
            Sell through outages, sync when you&apos;re back online
          </li>
        </ul>
      </div>
    </div>
  );
}
