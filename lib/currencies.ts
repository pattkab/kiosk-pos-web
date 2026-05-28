const fallbackCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "UGX",
  "KES",
  "TZS",
  "RWF",
  "BIF",
  "NGN",
  "GHS",
  "ZAR",
  "CAD",
  "AUD",
  "NZD",
  "JPY",
  "CNY",
  "INR",
  "AED",
  "SAR",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "HKD",
  "SGD",
  "MYR",
  "THB",
  "PHP",
  "IDR",
  "BRL",
  "MXN",
  "ARS",
  "CLP",
  "COP",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "TRY",
  "EGP",
  "MAD",
] as const;

export function getCurrencyCodes() {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    try {
      const values = Intl.supportedValuesOf("currency")
        .map((code) => code.toUpperCase())
        .sort((a, b) => a.localeCompare(b));
      if (values.length > 0) return values;
    } catch {
      // Fall back to curated list when runtime does not expose all currencies.
    }
  }

  return [...fallbackCurrencies].sort((a, b) => a.localeCompare(b));
}
