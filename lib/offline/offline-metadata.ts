import { getMetadata, saveMetadata } from "@/lib/storage/db";

export const OFFLINE_SETTINGS_KEY = "offline-settings";

export type OfflineSettings = {
  catalogLastSyncedAt: string | null;
  customersLastSyncedAt: string | null;
  catalogFreshnessWarningDays: number;
  lastSuccessfulSyncAt: string | null;
  lastSyncError: string | null;
};

const DEFAULT_SETTINGS: OfflineSettings = {
  catalogLastSyncedAt: null,
  customersLastSyncedAt: null,
  catalogFreshnessWarningDays: 3,
  lastSuccessfulSyncAt: null,
  lastSyncError: null,
};

export async function getOfflineSettings(): Promise<OfflineSettings> {
  const stored = await getMetadata(OFFLINE_SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function updateOfflineSettings(
  patch: Partial<OfflineSettings>,
) {
  const current = await getOfflineSettings();
  await saveMetadata(OFFLINE_SETTINGS_KEY, { ...current, ...patch });
}

export function getCatalogStaleDays(
  catalogLastSyncedAt: string | null,
  now = Date.now(),
) {
  if (!catalogLastSyncedAt) return null;
  const syncedAt = new Date(catalogLastSyncedAt).getTime();
  if (Number.isNaN(syncedAt)) return null;
  return Math.floor((now - syncedAt) / (1000 * 60 * 60 * 24));
}

export function formatLastSyncLabel(iso: string | null) {
  if (!iso) return "Never synced";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never synced";
  return date.toLocaleString();
}
