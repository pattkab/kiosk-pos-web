const USD_TO_LOCAL_RATE: Record<string, number> = {
  USD: 1,
  UGX: 3800,
  KES: 130,
  TZS: 2600,
  RWF: 1450,
  NGN: 1550,
  GHS: 11,
  INR: 84,
  PKR: 280,
  BDT: 120,
  PHP: 58,
  IDR: 16200,
};

const ZERO_DECIMAL_CURRENCIES = new Set([
  "IDR",
  "JPY",
  "KRW",
  "RWF",
  "UGX",
  "VND",
]);

export function getUsdToLocalRate(currency: string | null | undefined) {
  const code = currency?.toUpperCase();
  return code ? (USD_TO_LOCAL_RATE[code] ?? null) : null;
}

export function formatCurrencyAmount(
  amount: number,
  currency: string,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
    ...options,
  }).format(amount);
}

export function formatUsdCents(cents: number) {
  return formatCurrencyAmount(cents / 100, "USD", {
    maximumFractionDigits: 0,
  });
}

export function formatLocalPriceFromUsdCents(
  cents: number | null,
  currency: string | null | undefined,
) {
  if (cents === null) return null;

  const code = currency?.toUpperCase() || "USD";
  const rate = getUsdToLocalRate(code);
  if (!rate) return null;

  return {
    currency: code,
    rate,
    label: formatCurrencyAmount((cents / 100) * rate, code, {
      maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2,
    }),
  };
}
