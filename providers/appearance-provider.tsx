"use client";

import { useEffect } from "react";
import {
  DEFAULT_APPEARANCE_COLORS,
  applyAppearanceColors,
  normalizeHexColor,
} from "@/lib/appearance";
import { useOrganizationSettings } from "@/hooks/use-organization";

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = useOrganizationSettings();
  const primary = normalizeHexColor(
    settings.data?.theme_primary_color,
    DEFAULT_APPEARANCE_COLORS.primary,
  );
  const accent = normalizeHexColor(
    settings.data?.theme_accent_color,
    DEFAULT_APPEARANCE_COLORS.accent,
  );

  useEffect(() => {
    applyAppearanceColors({ primary, accent });
  }, [accent, primary]);

  return children;
}
