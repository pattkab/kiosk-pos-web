export const AVATAR_PRESETS = [
  {
    id: "mint-register",
    label: "Mint",
    url: "/avatars/mint-register.svg",
  },
  {
    id: "sky-counter",
    label: "Sky",
    url: "/avatars/sky-counter.svg",
  },
  {
    id: "coral-shift",
    label: "Coral",
    url: "/avatars/coral-shift.svg",
  },
  {
    id: "amber-ledger",
    label: "Amber",
    url: "/avatars/amber-ledger.svg",
  },
  {
    id: "violet-stock",
    label: "Violet",
    url: "/avatars/violet-stock.svg",
  },
  {
    id: "charcoal-till",
    label: "Charcoal",
    url: "/avatars/charcoal-till.svg",
  },
] as const;

export function getProfileInitials(
  fullName?: string | null,
  email?: string | null,
) {
  const source = fullName?.trim() || email?.split("@")[0] || "User";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
