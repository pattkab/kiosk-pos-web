"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { Monitor, Moon, Palette, RotateCcw, Sun, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/features/inventory/components/image-upload";
import {
  useActiveOrganization,
  useOrganizationSettings,
} from "@/hooks/use-organization";
import {
  organizationAppearanceSchema,
  organizationBrandingSchema,
  type OrganizationAppearanceValues,
  type OrganizationBrandingValues,
} from "@/validators/organization";
import {
  DEFAULT_APPEARANCE_COLORS,
  applyAppearanceColors,
  isHexColor,
  normalizeHexColor,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

const colorPresets = [
  { label: "Kiosk", primary: "#2563eb", accent: "#10b981" },
  { label: "Market", primary: "#0f766e", accent: "#f59e0b" },
  { label: "Retail", primary: "#7c3aed", accent: "#06b6d4" },
  { label: "Cafe", primary: "#be123c", accent: "#65a30d" },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();

  const appearanceForm = useForm<OrganizationAppearanceValues>({
    resolver: zodResolver(organizationAppearanceSchema),
    defaultValues: {
      theme_primary_color: DEFAULT_APPEARANCE_COLORS.primary,
      theme_accent_color: DEFAULT_APPEARANCE_COLORS.accent,
    },
  });
  const brandingForm = useForm<OrganizationBrandingValues>({
    resolver: zodResolver(organizationBrandingSchema),
    defaultValues: {
      logo_url: "",
    },
  });

  const primary = appearanceForm.watch("theme_primary_color");
  const accent = appearanceForm.watch("theme_accent_color");

  useEffect(() => {
    appearanceForm.reset({
      theme_primary_color: normalizeHexColor(
        settings.data?.theme_primary_color,
        DEFAULT_APPEARANCE_COLORS.primary,
      ),
      theme_accent_color: normalizeHexColor(
        settings.data?.theme_accent_color,
        DEFAULT_APPEARANCE_COLORS.accent,
      ),
    });
  }, [
    appearanceForm,
    settings.data?.theme_accent_color,
    settings.data?.theme_primary_color,
  ]);

  useEffect(() => {
    brandingForm.reset({
      logo_url: activeOrganization?.logo_url ?? "",
    });
  }, [activeOrganization?.logo_url, brandingForm]);

  useEffect(() => {
    applyAppearanceColors({ primary, accent });
  }, [accent, primary]);

  const applyPreset = (preset: (typeof colorPresets)[number]) => {
    appearanceForm.setValue("theme_primary_color", preset.primary, {
      shouldDirty: true,
      shouldValidate: true,
    });
    appearanceForm.setValue("theme_accent_color", preset.accent, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const resetColors = () => {
    appearanceForm.setValue(
      "theme_primary_color",
      DEFAULT_APPEARANCE_COLORS.primary,
      { shouldDirty: true, shouldValidate: true },
    );
    appearanceForm.setValue(
      "theme_accent_color",
      DEFAULT_APPEARANCE_COLORS.accent,
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = (theme ?? "system") === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className="h-12 justify-start gap-2 font-bold"
                  onClick={() => setTheme(option.value)}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>

          <form
            className="space-y-5"
            onSubmit={appearanceForm.handleSubmit((values) =>
              settings.updateAppearance.mutate(values),
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ColorField
                label="Primary color"
                value={primary}
                onChange={(value) =>
                  appearanceForm.setValue("theme_primary_color", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={
                  appearanceForm.formState.errors.theme_primary_color?.message
                }
              />
              <ColorField
                label="Accent color"
                value={accent}
                onChange={(value) =>
                  appearanceForm.setValue("theme_accent_color", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={
                  appearanceForm.formState.errors.theme_accent_color?.message
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 px-3 font-bold"
                  onClick={() => applyPreset(preset)}
                >
                  <span className="flex -space-x-1">
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </span>
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={settings.updateAppearance.isPending}
              >
                Save appearance
              </Button>
              <Button type="button" variant="outline" onClick={resetColors}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset colors
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company branding</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-6 lg:grid-cols-[220px_1fr]"
            onSubmit={brandingForm.handleSubmit((values) =>
              settings.updateBranding.mutate(values),
            )}
          >
            <ImageUpload
              value={brandingForm.watch("logo_url") || null}
              onChange={(value) =>
                brandingForm.setValue("logo_url", value || "", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              folder="branding"
              label="Upload logo"
              alt="Company logo"
              previewClassName="h-44 w-44 p-4"
              imageClassName="object-contain"
            />
            <div className="space-y-5">
              <div className="rounded-md border bg-muted/20 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Preview
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border bg-background">
                    {brandingForm.watch("logo_url") ? (
                      <div className="relative h-full w-full">
                        <Image
                          fill
                          src={brandingForm.watch("logo_url") ?? ""}
                          alt=""
                          className="h-full w-full object-contain p-2"
                        />
                      </div>
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">
                      {activeOrganization?.name ?? "Kiosk POS"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeOrganization?.email ??
                        activeOrganization?.phone ??
                        ""}
                    </p>
                  </div>
                </div>
              </div>
              {brandingForm.formState.errors.logo_url?.message ? (
                <p className="text-sm text-destructive">
                  {brandingForm.formState.errors.logo_url.message}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={settings.updateBranding.isPending}
              >
                Save branding
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-[52px_1fr] gap-2">
        <Input
          type="color"
          value={isHexColor(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 cursor-pointer p-1"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-11 font-mono uppercase",
            error && "border-destructive",
          )}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
