"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MoreHorizontal,
  BarChart3,
  Users,
  Settings,
  UserRoundSearch,
  FileText,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ImpactStyle } from "@capacitor/haptics";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useOrganizationStore } from "@/store/use-organization-store";
import {
  NATIVE_MORE_MODULES,
  NATIVE_TAB_MODULES,
  canExploreWithoutOrganization,
  getNavItemByModule,
  hasModuleAccess,
  isNativeMoreSectionActive,
  isNavItemActive,
  type AppNavModule,
  type AppNavItem,
} from "@/lib/navigation/app-navigation";

const TAB_ICONS: Record<AppNavModule, LucideIcon> = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  inventory: Package,
  reports: BarChart3,
  team: Users,
  customers: UserRoundSearch,
  invoices: FileText,
  settings: Settings,
  notifications: MoreHorizontal,
};

const MORE_ACCENT: Partial<
  Record<AppNavModule, { from: string; to: string; icon: string }>
> = {
  reports: { from: "from-sky-500/20", to: "to-blue-600/10", icon: "text-sky-400" },
  invoices: { from: "from-emerald-500/20", to: "to-green-600/10", icon: "text-emerald-400" },
  customers: { from: "from-violet-500/20", to: "to-purple-600/10", icon: "text-violet-400" },
  team: { from: "from-indigo-500/20", to: "to-indigo-600/10", icon: "text-indigo-400" },
  settings: { from: "from-slate-500/20", to: "to-slate-600/10", icon: "text-slate-400" },
};

function NavTab({
  item,
  active,
  onNavigate,
}: {
  item: AppNavItem;
  active: boolean;
  onNavigate: (
    event: React.MouseEvent<HTMLAnchorElement>,
    module: AppNavModule,
  ) => void;
}) {
  const Icon = TAB_ICONS[item.module];

  return (
    <Link
      href={item.href}
      onClick={(event) => onNavigate(event, item.module)}
      className={cn(
        "native-nav-tab group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-2 pt-3 transition-transform active:scale-95",
        active ? "text-primary" : "text-muted-foreground/80",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "relative flex h-9 w-11 items-center justify-center rounded-2xl transition-all duration-300 ease-out",
          active
            ? "bg-primary/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "group-active:bg-muted/60",
        )}
      >
        <Icon
          className={cn(
            "h-[1.125rem] w-[1.125rem] transition-all duration-300",
            active && "scale-110 drop-shadow-sm",
          )}
          aria-hidden
        />
        {active ? (
          <span className="native-nav-tab-glow absolute inset-0 rounded-2xl bg-primary/10 blur-md" />
        ) : null}
      </span>
      <span
        className={cn(
          "max-w-full truncate text-[9px] font-bold uppercase tracking-[0.14em] transition-opacity duration-200",
          active ? "opacity-100" : "opacity-70",
        )}
      >
        {item.shortName}
      </span>
      <span
        className={cn(
          "absolute bottom-1 h-1 rounded-full bg-primary transition-all duration-300 ease-out",
          active ? "w-4 opacity-100" : "w-0 opacity-0",
        )}
      />
    </Link>
  );
}

function PosFab({
  item,
  active,
  onNavigate,
}: {
  item: AppNavItem;
  active: boolean;
  onNavigate: (
    event: React.MouseEvent<HTMLAnchorElement>,
    module: AppNavModule,
  ) => void;
}) {
  const Icon = TAB_ICONS[item.module];

  return (
    <Link
      href={item.href}
      onClick={(event) => onNavigate(event, item.module)}
      className="native-nav-pos-fab group absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[38%]"
      aria-current={active ? "page" : undefined}
      aria-label={item.name}
    >
      <span
        className={cn(
          "relative flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-[1.35rem] transition-all duration-300 ease-out active:scale-95",
          active
            ? "native-nav-pos-fab-active shadow-[0_10px_28px_rgba(249,115,22,0.55),0_0_0_4px_hsl(var(--background))]"
            : "native-nav-pos-fab-idle shadow-[0_8px_22px_rgba(249,115,22,0.4),0_0_0_4px_hsl(var(--background))]",
        )}
      >
        <span className="absolute inset-0 rounded-[1.35rem] bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600" />
        <span className="absolute inset-[2px] rounded-[1.2rem] bg-gradient-to-br from-orange-300/30 via-transparent to-black/10" />
        <Icon className="relative h-6 w-6 text-white drop-shadow-md" aria-hidden />
        {!active ? <span className="native-nav-pos-ring absolute inset-0 rounded-[1.35rem]" /> : null}
      </span>
      <span
        className={cn(
          "mt-1 block text-center text-[9px] font-bold uppercase tracking-[0.14em] transition-colors",
          active ? "text-orange-500" : "text-muted-foreground",
        )}
      >
        {item.shortName}
      </span>
    </Link>
  );
}

export function NativeBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const { activeOrganization } = useActiveOrganization();
  const userRole = activeOrganization?.role;
  const permissions = useOrganizationStore((state) => state.permissions);

  const tabItems = NATIVE_TAB_MODULES.map(getNavItemByModule).filter(
    (item): item is NonNullable<typeof item> =>
      Boolean(item && hasModuleAccess(item.module, permissions, userRole)),
  );

  const moreItems = NATIVE_MORE_MODULES.map(getNavItemByModule).filter(
    (item): item is NonNullable<typeof item> =>
      Boolean(item && hasModuleAccess(item.module, permissions, userRole)),
  );

  const posItem = tabItems.find((item) => item.module === "pos");
  const sideTabs = tabItems.filter((item) => item.module !== "pos");
  const leftTabs = sideTabs.slice(0, Math.ceil(sideTabs.length / 2));
  const rightTabs = sideTabs.slice(Math.ceil(sideTabs.length / 2));

  const moreActive = isNativeMoreSectionActive(pathname);

  const triggerHaptic = useCallback(async (style?: ImpactStyle) => {
    try {
      const { Haptics, ImpactStyle: Style } = await import("@capacitor/haptics");
      await Haptics.impact({ style: style ?? Style.Light });
    } catch {
      /* haptics optional */
    }
  }, []);

  const guardNavigation = (
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    module: AppNavModule,
  ) => {
    triggerHaptic();
    if (activeOrganization || canExploreWithoutOrganization(module)) return;
    event.preventDefault();
    toast.info("Create an organization to use this feature.", {
      action: {
        label: "Create",
        onClick: () => router.push("/onboarding"),
      },
    });
  };

  if (tabItems.length === 0) return null;

  return (
    <>
      {moreOpen ? (
        <button
          type="button"
          className="native-more-backdrop fixed inset-0 z-40 animate-in fade-in duration-200"
          aria-label="Close menu"
          onClick={() => {
            triggerHaptic();
            setMoreOpen(false);
          }}
        />
      ) : null}

      {moreOpen && moreItems.length > 0 ? (
        <div
          className="native-more-sheet fixed inset-x-3 z-50 animate-in slide-in-from-bottom-6 fade-in duration-300"
          style={{ bottom: "calc(var(--native-nav-offset) + 0.5rem)" }}
          role="dialog"
          aria-label="More services"
        >
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card/95 shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500/90">
                  Services
                </p>
                <p className="text-sm font-semibold text-foreground">More tools</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setMoreOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors active:scale-95 active:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
              {moreItems.map((item) => {
                const Icon = TAB_ICONS[item.module];
                const active = isNavItemActive(pathname, item.href);
                const accent = MORE_ACCENT[item.module];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={(event) => {
                      guardNavigation(event, item.module);
                      setMoreOpen(false);
                    }}
                    className={cn(
                      "group relative flex min-h-[5.5rem] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border p-3 transition-all active:scale-[0.97]",
                      active
                        ? "border-primary/40 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "border-border/30 bg-muted/20 hover:border-border/60 hover:bg-muted/40",
                    )}
                  >
                    {accent ? (
                      <span
                        className={cn(
                          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
                          accent.from,
                          accent.to,
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-background/40 shadow-sm backdrop-blur-sm transition-transform group-active:scale-95",
                        active && "border-primary/30 bg-primary/15",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          active ? "text-primary" : accent?.icon ?? "text-foreground/80",
                        )}
                      />
                    </span>
                    <span className="relative text-center text-xs font-semibold leading-tight text-foreground">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="native-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-50"
        aria-label="Main"
      >
        <div className="pointer-events-auto mx-auto max-w-lg px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.625rem)]">
          <div className="native-bottom-nav-dock relative h-16 rounded-[1.75rem]">
            {posItem ? (
              <PosFab
                item={posItem}
                active={isNavItemActive(pathname, posItem.href)}
                onNavigate={guardNavigation}
              />
            ) : null}

            <div className="absolute inset-0 flex items-stretch px-1">
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-stretch justify-evenly",
                  posItem && "pr-8",
                )}
              >
                {leftTabs.map((item) => (
                  <NavTab
                    key={item.href}
                    item={item}
                    active={isNavItemActive(pathname, item.href)}
                    onNavigate={guardNavigation}
                  />
                ))}
              </div>

              {posItem ? <div className="w-[4.5rem] shrink-0" aria-hidden /> : null}

              <div
                className={cn(
                  "flex min-w-0 flex-1 items-stretch justify-evenly",
                  posItem && "pl-8",
                )}
              >
                {rightTabs.map((item) => (
                  <NavTab
                    key={item.href}
                    item={item}
                    active={isNavItemActive(pathname, item.href)}
                    onNavigate={guardNavigation}
                  />
                ))}

                {moreItems.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      void triggerHaptic();
                      setMoreOpen((open) => !open);
                    }}
                    className={cn(
                      "native-nav-tab group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-2 pt-3 transition-transform active:scale-95",
                      moreActive || moreOpen ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-expanded={moreOpen}
                    aria-haspopup="dialog"
                  >
                    <span
                      className={cn(
                        "relative flex h-9 w-11 items-center justify-center rounded-2xl transition-all duration-300",
                        moreActive || moreOpen
                          ? "bg-primary/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          : "group-active:bg-muted/60",
                      )}
                    >
                      <MoreHorizontal
                        className={cn(
                          "h-[1.125rem] w-[1.125rem] transition-all duration-300",
                          (moreActive || moreOpen) && "scale-110",
                        )}
                        aria-hidden
                      />
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-70">
                      More
                    </span>
                    <span
                      className={cn(
                        "absolute bottom-1 h-1 rounded-full bg-primary transition-all duration-300",
                        moreActive || moreOpen ? "w-4 opacity-100" : "w-0 opacity-0",
                      )}
                    />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
