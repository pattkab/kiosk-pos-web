export const PRINTER_STORAGE_KEY = "kiosk-bluetooth-printer";

export interface SavedPrinter {
  address: string;
  name: string;
}

export function getSavedPrinter(): SavedPrinter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PRINTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedPrinter;
    if (parsed.address && parsed.name) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function savePrinter(printer: SavedPrinter) {
  localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printer));
}

export function clearSavedPrinter() {
  localStorage.removeItem(PRINTER_STORAGE_KEY);
}
