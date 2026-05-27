"use client";

import { useConnectivityStore } from "@/store/use-connectivity-store";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const status = useConnectivityStore((state) => state.status);

  if (status === "online") return null;

  const config = {
    offline: {
      bg: "bg-destructive text-destructive-foreground",
      icon: WifiOff,
      text: "Device is offline. sales will queue locally in IndexedDB until connection is restored.",
      pulse: false,
    },
    reconnecting: {
      bg: "bg-amber-600 text-white",
      icon: RefreshCw,
      text: "Network restored. Attempting to sync offline queue...",
      pulse: true,
    },
    "limited-functionality": {
      bg: "bg-amber-500 text-black",
      icon: AlertCircle,
      text: "Unstable connection detected (High latency). Running in limited-functionality mode.",
      pulse: false,
    },
  }[status];

  if (!config) return null;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex min-h-10 w-full items-center justify-center gap-3 px-4 py-2 text-center text-xs font-bold transition-all duration-300 animate-in slide-in-from-top-4",
        config.bg
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", config.pulse && "animate-spin")} />
        <span>{config.text}</span>
      </div>
    </div>
  );
}
