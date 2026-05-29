export const LOYALTY_CARD_PREFIX = "KPOS";

export function normalizeLoyaltyCardNumber(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isLoyaltyCardCode(value: string): boolean {
  const normalized = normalizeLoyaltyCardNumber(value);
  return (
    normalized.startsWith(LOYALTY_CARD_PREFIX) &&
    normalized.length === LOYALTY_CARD_PREFIX.length + 10
  );
}

export function formatLoyaltyCardNumber(value: string): string {
  const normalized = normalizeLoyaltyCardNumber(value);
  if (!normalized.startsWith(LOYALTY_CARD_PREFIX)) return normalized;
  const suffix = normalized.slice(LOYALTY_CARD_PREFIX.length);
  return `${LOYALTY_CARD_PREFIX}-${suffix.slice(0, 5)}-${suffix.slice(5)}`;
}

export function loyaltyCardPayload(value: string): string {
  return normalizeLoyaltyCardNumber(value);
}
