export type UgandaMobileNetwork = "mtn" | "airtel" | "unknown";

/** Normalize Ugandan MSISDN to 256XXXXXXXXX. */
export function normalizeUgandaMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("256") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  if (digits.length === 9) return `256${digits}`;
  return null;
}

/** Best-effort network detection from MSISDN prefix (Yo also routes by number). */
export function detectUgandaMobileNetwork(msisdn: string): UgandaMobileNetwork {
  const local = msisdn.startsWith("256") ? msisdn.slice(3) : msisdn;
  const prefix3 = local.slice(0, 3);
  const mtnPrefixes = new Set(["770", "771", "772", "773", "774", "775", "776", "777", "778", "779", "760", "761", "762", "763", "764", "765", "766", "767", "768", "769", "390", "391", "392", "393", "394", "395", "396", "397", "398", "399"]);
  const airtelPrefixes = new Set(["700", "701", "702", "703", "704", "705", "706", "707", "708", "709", "740", "741", "742", "743", "744", "745", "746", "747", "748", "749", "750", "751", "752", "753", "754", "755", "756", "757", "758", "759"]);

  if (mtnPrefixes.has(prefix3)) return "mtn";
  if (airtelPrefixes.has(prefix3)) return "airtel";
  return "unknown";
}

export function methodRequiresPhone(
  method: string,
): method is "mtn_mobile_money" | "airtel_money" {
  return method === "mtn_mobile_money" || method === "airtel_money";
}

export function isCardMethod(method: string) {
  return method === "visa" || method === "mastercard" || method === "card";
}
