import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getStoredCurrency() {
  if (typeof window === "undefined") return "USD";

  try {
    const stored = window.localStorage.getItem("active-organization-storage");
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed?.state?.activeCurrency || "USD";
  } catch {
    return "USD";
  }
}

export function formatCurrency(amount: number, currency?: string | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || getStoredCurrency(),
  }).format(amount);
}
