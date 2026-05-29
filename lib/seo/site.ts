import { PRODUCTION_APP_URL, getConfiguredAppUrl } from "@/lib/app-url";

export const SITE_NAME = "Kiosk POS";
export const SITE_TAGLINE = "Point of Sale software for growing businesses";
export const SITE_DESCRIPTION =
  "Kiosk POS is offline-first Point of Sale and inventory software for shops, supermarkets, bars, restaurants, hotels, and rentals in Uganda and across Africa. Fast checkout, stock control, reports, and MTN or Airtel mobile money collections.";

export const SITE_KEYWORDS = [
  "point of sale",
  "POS software",
  "POS Uganda",
  "point of sale Uganda",
  "retail POS",
  "supermarket POS",
  "restaurant POS",
  "bar POS",
  "hotel POS",
  "inventory management",
  "offline POS",
  "mobile money POS",
  "MTN mobile money checkout",
  "Airtel money POS",
  "multi branch POS",
  "inventory and sales software",
  "East Africa POS",
  "Kiosk POS",
];

export function getSiteUrl() {
  return getConfiguredAppUrl({ allowLocalhost: false }) || PRODUCTION_APP_URL;
}

export const DEFAULT_OG_IMAGE_PATH = "/kiosk-pos-enterprise-hero.png";

export const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
];
