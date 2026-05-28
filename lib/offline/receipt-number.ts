import { getMetadata, saveMetadata } from "@/lib/storage/db";

function sanitizeRegisterCode(registerName: string) {
  const code = registerName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6);
  return code || "REG";
}

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function generateOfflineReceiptNumber(
  organizationId: string,
  registerName: string,
) {
  const registerCode = sanitizeRegisterCode(registerName);
  const dateKey = todayKey();
  const counterKey = `offline-receipt-seq:${organizationId}:${registerCode}:${dateKey}`;
  const current = Number((await getMetadata(counterKey)) ?? 0);
  const next = current + 1;
  await saveMetadata(counterKey, next);
  const sequence = String(next).padStart(4, "0");
  return `OFF-${registerCode}-${dateKey}-${sequence}`;
}

export function isOfflineReceiptNumber(value: string) {
  return value.startsWith("OFF-");
}
