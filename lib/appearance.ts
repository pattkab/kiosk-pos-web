export const DEFAULT_APPEARANCE_COLORS = {
  primary: "#2563eb",
  accent: "#10b981",
};

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string | null | undefined) {
  return Boolean(value && HEX_COLOR_PATTERN.test(value));
}

export function normalizeHexColor(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) return fallback;
  const candidate = value.startsWith("#") ? value : `#${value}`;
  return isHexColor(candidate) ? candidate.toLowerCase() : fallback;
}

export function hexToHslParts(hex: string) {
  const normalized = normalizeHexColor(hex, DEFAULT_APPEARANCE_COLORS.primary);
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(
    lightness * 100,
  )}%`;
}

export function getReadableForeground(hex: string) {
  const normalized = normalizeHexColor(hex, DEFAULT_APPEARANCE_COLORS.primary);
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.58 ? "222.2 47.4% 11.2%" : "210 40% 98%";
}

export function applyAppearanceColors(colors: {
  primary?: string | null;
  accent?: string | null;
}) {
  if (typeof document === "undefined") return;

  const primary = normalizeHexColor(
    colors.primary,
    DEFAULT_APPEARANCE_COLORS.primary,
  );
  const accent = normalizeHexColor(
    colors.accent,
    DEFAULT_APPEARANCE_COLORS.accent,
  );
  const root = document.documentElement;

  root.style.setProperty("--primary", hexToHslParts(primary));
  root.style.setProperty(
    "--primary-foreground",
    getReadableForeground(primary),
  );
  root.style.setProperty("--ring", hexToHslParts(primary));
  root.style.setProperty("--accent", hexToHslParts(accent));
  root.style.setProperty("--accent-foreground", getReadableForeground(accent));
  root.style.setProperty("--chart-2", hexToHslParts(accent));
}
