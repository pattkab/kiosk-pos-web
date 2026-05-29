export const businessTypes = [
  { value: "supermarket_or_shop", label: "Supermarket or shop" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "salon", label: "Salon" },
  { value: "restaurant_or_hotel", label: "Restaurant, cafe, or bar" },
  { value: "rental_accommodation", label: "Hotel, BnB, or accommodation" },
  { value: "other", label: "Other" },
] as const;

export type BusinessType = (typeof businessTypes)[number]["value"];

export const businessTypeValues = businessTypes.map((type) => type.value) as [
  BusinessType,
  ...BusinessType[],
];

export function getBusinessTypeLabel(value?: string | null) {
  if (value?.startsWith("other:")) {
    const custom = value.slice("other:".length).trim();
    if (custom.length > 0) return `Other (${custom})`;
  }
  return businessTypes.find((type) => type.value === value)?.label ?? "Other";
}

export function normalizeBusinessType(value?: string | null): BusinessType {
  return businessTypes.some((type) => type.value === value)
    ? (value as BusinessType)
    : "other";
}
